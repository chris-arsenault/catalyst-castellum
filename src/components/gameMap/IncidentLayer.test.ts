import { describe, expect, it } from "vitest";
import { WORLD_MAP } from "../../game/content/worldMap";
import type { CombatIncident, HazardChannels, RoomId } from "../../game/types";
import { INCIDENT_VISIBLE_SECONDS, incidentMapAggregates } from "./incidentModel";

const channels = (pressure: number): HazardChannels => ({
  atmosphere: 0,
  corrosion: 0,
  heat: 0,
  pressure,
  radiation: 0,
});

const incident = (
  id: number,
  elapsed: number,
  pressure: number,
  killed: boolean,
  roomId: RoomId = "furnace"
): CombatIncident => ({
  id,
  elapsed,
  levelId: "flash_point",
  round: 1,
  phase: "assault",
  roomId,
  zone: "lower",
  sourceId: "hydrogen_oxygen_combustion",
  reactionExtent: 2,
  pressureImpulse: 110,
  heatDelta: 8,
  damageByChannel: channels(pressure),
  targets: [
    {
      enemyId: id,
      enemyType: "deckmouth",
      worldPosition: { x: 98, elevation: 14 },
      healthBefore: 20,
      healthAfter: killed ? 0 : 10,
      damageByChannel: channels(pressure),
      killed,
    },
  ],
});

describe("incident map aggregation", () => {
  it("coalesces readable room feedback for five simulation seconds", () => {
    const aggregates = incidentMapAggregates(
      {
        elapsed: 14,
        phase: "assault",
        campaign: { levelId: "flash_point", roundIndex: 0 },
        incidents: [
          incident(1, 12, 17, true),
          incident(2, 10, 9, false),
          incident(3, 14 - INCIDENT_VISIBLE_SECONDS - 0.1, 40, true),
          incident(4, 13, 5, false, "reservoir"),
        ],
      },
      WORLD_MAP
    );

    expect(aggregates).toHaveLength(2);
    expect(aggregates.find(({ roomId }) => roomId === "furnace")).toMatchObject({
      age: 2,
      count: 2,
      kills: 1,
      pressureDamage: 26,
      heatDamage: 0,
    });
  });

  it("clears transient overlays when the round result freezes the map", () => {
    const aggregates = incidentMapAggregates(
      {
        elapsed: 14,
        phase: "round_result",
        campaign: { levelId: "flash_point", roundIndex: 0 },
        incidents: [incident(1, 13.5, 17, true)],
      },
      WORLD_MAP
    );

    expect(aggregates).toEqual([]);
  });

  it("keeps prior-round incidents out of the next live round", () => {
    const aggregates = incidentMapAggregates(
      {
        elapsed: 14,
        phase: "prime",
        campaign: { levelId: "flash_point", roundIndex: 1 },
        incidents: [incident(1, 13.5, 17, true)],
      },
      WORLD_MAP
    );

    expect(aggregates).toEqual([]);
  });
});
