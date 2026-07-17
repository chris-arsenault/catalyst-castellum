import { describe, expect, it } from "vitest";
import { CHLOR_ALKALI_SITE, CHLOR_ALKALI_TUTORIAL_SEED } from "../content/sites/chlorAlkali";
import { WORLD_MAP } from "../content/worldMap";
import { DEFAULT_GAME_DEFINITION } from "../definition";
import { createScenarioGame } from "../engine/scenarioState";
import { executeCommand } from "../engine/commands";
import { findEnemyPath } from "../engine/navigation";
import { decodeGame, encodeGame } from "../persistence/saveCodec";
import { facilityModelForMap } from "./derivedModel";
import { hullLayoutFromMap } from "./hullFragment";
import { validateWorldMap } from "./mapValidation";
import { generateSiteLayoutCandidate, generateSiteLayoutCandidates } from "./siteGenerator";

const openPortals = (map: ReturnType<typeof generateSiteLayoutCandidate>["map"]) => {
  const states = facilityModelForMap(map).initialPortalStates();
  for (const state of Object.values(states)) {
    state.open = true;
    state.sealed = false;
  }
  return states;
};

describe("the seeded chunk site generator", () => {
  const hull = hullLayoutFromMap(WORLD_MAP);

  it("replays a seed as identical room and route geometry", () => {
    const first = generateSiteLayoutCandidate(CHLOR_ALKALI_SITE, hull, CHLOR_ALKALI_TUTORIAL_SEED);
    const replay = generateSiteLayoutCandidate(CHLOR_ALKALI_SITE, hull, CHLOR_ALKALI_TUTORIAL_SEED);

    expect(replay.patternId).toBe(first.patternId);
    expect(replay.chunkOrder).toEqual(first.chunkOrder);
    expect(replay.map.rooms).toEqual(first.map.rooms);
    expect(replay.map.connections).toEqual(first.map.connections);
  });

  it("emits distinct, valid candidates with ground and flying routes to Core", () => {
    const candidates = generateSiteLayoutCandidates(CHLOR_ALKALI_SITE, hull, {
      seed: 20_260_700,
      count: 3,
    });

    expect(candidates).toHaveLength(3);
    for (const candidate of candidates) {
      expect(validateWorldMap(candidate.map)).toEqual([]);
      const portalStates = openPortals(candidate.map);
      expect(findEnemyPath({ flying: false, portalStates }, candidate.map).length).toBeGreaterThan(
        0
      );
      expect(findEnemyPath({ flying: true, portalStates }, candidate.map).length).toBeGreaterThan(
        0
      );
    }
  }, 30_000);
});

describe("CL-1's selected generated exterior", () => {
  it("is visibly and structurally distinct from OX-1 while preserving its chemistry", () => {
    const game = createScenarioGame("make_the_reagent", [], DEFAULT_GAME_DEFINITION);

    expect(game.run.seed).toBe(`chlor_alkali_exterior:${CHLOR_ALKALI_TUTORIAL_SEED}`);
    expect(game.map.width).not.toBe(WORLD_MAP.width);
    expect(game.map.rooms.lower_intake?.bounds).not.toEqual(WORLD_MAP.rooms.lower_intake?.bounds);
    expect(game.map.rooms.furnace?.code).toBe("CL-04");
    expect(game.map.rooms.gallery?.code).toBe("CL-05");
    expect(game.map.rooms.core?.provenance).toBe("hull");
    expect(game.map.rooms.washlock?.provenance).toBe("hull");
    expect(game.map.connections["liquid:core__lower_intake"]).toBeDefined();
    expect(game.map.connections["gas:core__lower_intake"]).toBeDefined();
    expect(game.map.connections["gas:lower_intake__reservoir"]).toBeDefined();
    expect(game.map.connections["gas:furnace__lower_intake"]).toBeDefined();
    expect(game.map.connections["gas:furnace__gallery"]).toBeDefined();
    expect(game.map.connections["gas:gallery__washlock"]).toBeDefined();
  });

  it("round-trips through a save and rebases the hull at the following authored site", () => {
    const game = createScenarioGame("make_the_reagent", ["flash_point"], DEFAULT_GAME_DEFINITION);
    const decoded = decodeGame(encodeGame(game, DEFAULT_GAME_DEFINITION), DEFAULT_GAME_DEFINITION);
    expect(decoded?.map.rooms.lower_intake?.bounds).toEqual(game.map.rooms.lower_intake?.bounds);

    game.phase = "level_complete";
    const traveling = executeCommand(game, { type: "start_next_level" }, DEFAULT_GAME_DEFINITION);
    const docked = executeCommand(
      traveling.state,
      { type: "dock_at_site" },
      DEFAULT_GAME_DEFINITION
    );
    expect(docked.accepted).toBe(true);
    expect(docked.state.campaign.levelId).toBe("stored_chlorine");
    expect(docked.state.map.rooms.core?.bounds).toEqual(WORLD_MAP.rooms.core?.bounds);
    expect(docked.state.map.rooms.washlock?.bounds).toEqual(WORLD_MAP.rooms.washlock?.bounds);
  });
});
