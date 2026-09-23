import type { CombatDefinition, EncounterDefinition } from "../types";
import type { MapRoom, WorldMap } from "../../world/map";
import { materializeRouteGraph } from "../../world/routes";

const corridorRoom: MapRoom = {
  id: "core",
  code: "C",
  structure: "core",
  ambientTemperature: 22,
  socketCount: 0,
  bounds: { column: 1, elevation: 1, width: 20, height: 4 },
  socketCells: {},
  platformCells: [],
  ladderCells: [],
  graftSlots: [],
  provenance: "site",
  taps: {
    gas: { capacity: 0, includeRoomInventory: false, roomPortHeight: 0, sourceIds: [] },
    liquid: { capacity: 0, includeRoomInventory: false, roomPortHeight: 0, sourceIds: [] },
  },
};

const emptyMap: WorldMap = {
  width: 23,
  height: 7,
  cellSize: 1,
  coreAnchor: { column: 20, elevation: 1 },
  ringRadii: { inner: 1, middle: 2 },
  entryCell: { column: 2, elevation: 1 },
  coreBreachCell: { column: 20, elevation: 1 },
  rooms: { core: corridorRoom },
  connections: {},
  utilityNodes: {},
  routeGraph: { coreNodeId: "core", nodes: {}, edges: {}, routes: {} },
};

export const corridorMap: WorldMap = {
  ...emptyMap,
  routeGraph: materializeRouteGraph(
    emptyMap,
    [
      {
        id: "lane",
        roomId: "core",
        offset: { column: 1, elevation: 0 },
        eligibility: "ground",
        movementCost: 1,
      },
    ],
    {}
  ),
};

export const corridorCombat: CombatDefinition = {
  id: "corridor-combat",
  contentVersion: 1,
  tickSeconds: 0.1,
  mechanics: { kind: "legacy" },
  enemies: {
    deckmouth: {
      type: "deckmouth",
      health: 25,
      speed: 0.1,
      coreDamage: 8,
      needsOxygen: false,
      flying: false,
      hazardMultipliers: { atmosphere: 1, corrosion: 1, heat: 1, pressure: 1, radiation: 1 },
      color: "#fff",
      residueOnDeath: 0,
      matterYield: 3,
      behavior: { kind: "standard" },
      presentation: { appearance: "deckmouth" },
    },
  },
  towers: {
    flash_chamber: {
      id: "flash_chamber",
      role: "single_target",
      buildCost: 10,
      recoveryRatio: 0.5,
      footprint: { width: 1, height: 1 },
      mountFaces: ["left_wall"],
      orientations: ["right"],
      range: 20,
      minimumRange: 0,
      firingArc: 180,
      lineOfSight: "required",
      cadence: 3.2,
      targetCap: 1,
      eligibleLayers: ["ground"],
      targetPolicies: ["first", "strongest"],
      attack: {
        strategy: "hitscan",
        projectileSpeed: 0,
        radius: 0,
        packets: [
          {
            sourceId: "tower_flash",
            channels: { atmosphere: 0, corrosion: 0, heat: 5, pressure: 0, radiation: 0 },
          },
        ],
        controlEffects: [],
      },
      upgrades: [
        {
          id: "flash_calibration",
          cost: 5,
          requires: [],
          damageMultiplier: 2,
          cadenceMultiplier: 1,
          rangeDelta: 0,
          targetCapDelta: 0,
          arcDelta: 0,
          supplyMode: "unchanged",
        },
      ],
      supply: null,
      color: "#fff",
    },
  },
};

export const corridorEncounter: EncounterDefinition = {
  id: "corridor",
  contentVersion: 1,
  instanceNamespace: "isolated",
  map: corridorMap,
  wave: [{ tick: 0, type: "deckmouth", level: 20, routeId: "lane" }],
  availability: { towers: ["flash_chamber"], equipment: [], gasLines: [], liquidLines: [] },
  maximumTicks: 1000,
  startingMatter: 30,
  startingCoreIntegrity: 100,
  initialTowers: {},
  initialPortalStates: {},
  process: null,
};
