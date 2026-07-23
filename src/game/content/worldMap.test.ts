import { describe, expect, it } from "vitest";
import { architecturalConnections, isProcessLine } from "../world/map";
import { validateWorldMap } from "../world/mapValidation";
import { WORLD_LINE_BLUEPRINTS, WORLD_MAP } from "./worldMap";

const lines = Object.values(WORLD_LINE_BLUEPRINTS);

/**
 * Iteration order is behavior: gas/liquid flow resolves lines in authored insertion
 * order and architectural flow resolves openings in authored insertion order. These
 * lists are the pre-Map legacy iteration order (TRANSPORT_RUNS/portal declaration
 * order), locked so the determinism snapshot cannot move.
 */
const EXPECTED_GAS_ORDER = [
  "gas:core__furnace",
  "gas:core__switchyard",
  "gas:core__reservoir",
  "gas:core__gallery",
  "gas:furnace__lower_intake",
  "gas:core__lower_intake",
  "gas:lower_intake__reservoir",
  "gas:gallery__reservoir",
  "gas:furnace__gallery",
  "gas:gallery__washlock",
  "gas:furnace__washlock",
  "gas:gallery__switchyard",
  "gas:core__washlock",
];

const EXPECTED_LIQUID_ORDER = [
  "liquid:core__lower_intake",
  "liquid:lower_intake__reservoir",
  "liquid:core__washlock",
  "liquid:reservoir__washlock",
  "liquid:core__reservoir",
];

const EXPECTED_PORTAL_ORDER = [
  "entry_to_switchyard",
  "switchyard_to_furnace_shaft",
  "furnace_to_reservoir_passage",
  "reservoir_to_gallery_trapdoor",
  "gallery_to_lower_intake",
  "lower_intake_to_washlock_drop",
  "washlock_to_core_door",
];

describe("the authored world map", () => {
  it("passes shared map validation", () => {
    expect(validateWorldMap(WORLD_MAP)).toEqual([]);
  });

  it("keeps the authored per-kind iteration order the simulation resolves in", () => {
    expect(lines.filter(({ kind }) => kind === "gas_line").map(({ id }) => id)).toEqual(
      EXPECTED_GAS_ORDER
    );
    expect(lines.filter(({ kind }) => kind === "liquid_line").map(({ id }) => id)).toEqual(
      EXPECTED_LIQUID_ORDER
    );
    expect(architecturalConnections(WORLD_MAP).map(({ id }) => id)).toEqual(EXPECTED_PORTAL_ORDER);
    expect(Object.values(WORLD_MAP.connections).filter(isProcessLine)).toEqual([]);
  });

  it("hosts every utility port in the core manifold", () => {
    for (const node of Object.values(WORLD_MAP.utilityNodes)) {
      expect(["core", "washlock"]).toContain(node.hostRoomId);
    }
    expect(Object.keys(WORLD_MAP.utilityNodes).sort()).toEqual([
      "gas_reservoir",
      "gas_vent",
      "hazard_gas_reservoir",
      "hazard_liquid_reservoir",
      "liquid_drain",
      "liquid_reservoir_a",
      "liquid_reservoir_b",
    ]);
  });

  it("seeds the player's hull as Core + R-06 washlock, the rest site (M6)", () => {
    const hull = Object.values(WORLD_MAP.rooms)
      .filter((room) => room.provenance === "hull")
      .map((room) => room.id)
      .sort();
    expect(hull).toEqual(["core", "washlock"]);
    expect(WORLD_MAP.rooms.core?.hardpoints).toHaveLength(0);
    expect(WORLD_MAP.rooms.washlock?.hardpoints).toHaveLength(2);
  });
});
