import { facilityModelForMap } from "../world/derivedModel";
import type { FacilityLoadout } from "../definitionTypes";
import { emptyGas, emptyLiquid, emptyStationary } from "../materials";
import {
  GAS_TYPES,
  type GasAmounts,
  type ReactionTelemetry,
  type RoomId,
  type RoomReactionId,
  type RoomState,
} from "../types";
import {
  createEquipmentInstance,
  emptyRoomEquipment,
  roomEquipmentVolume,
} from "../engine/equipment";
import { kelvin, STANDARD_TEMPERATURE } from "../engine/physics";
import type { WorldMap } from "../world/map";
import { maybeLineDefinition, processLineIds, definitionRoom } from "../world/instances";
import { processDefinitionForMap } from "./processDefinition";
import type { ProcessDefinition, ProcessPhysicsDefinition, ProcessState } from "./processTypes";
export { cloneProcessState } from "./processClone";

const emptyTelemetry = (): ReactionTelemetry => ({
  lastRate: 0,
  direction: "idle",
  limitingFactor: { kind: "condition", code: "conditions", zone: null },
});

const emptyRoomReactions = (
  definition: ProcessPhysicsDefinition
): Record<RoomReactionId, ReactionTelemetry> =>
  Object.fromEntries(
    Object.values(definition.reactions)
      .filter(({ behavior }) => behavior.kind !== "electrolysis")
      .map(({ id }) => [id, emptyTelemetry()])
  ) as Record<RoomReactionId, ReactionTelemetry>;

const makeRoom = (
  id: RoomId,
  loadout: FacilityLoadout,
  definition: ProcessPhysicsDefinition,
  map: WorldMap
): RoomState => {
  const ambient = definition.ambientGas;
  const equipment = emptyRoomEquipment();
  const scenarioEquipment = loadout.equipment[id];
  if (scenarioEquipment) {
    for (const [socketId, instance] of Object.entries(scenarioEquipment)) {
      if (instance)
        equipment[socketId as keyof typeof equipment] = createEquipmentInstance(
          instance,
          definition
        );
    }
  }
  const temperature =
    loadout.initialTemperatures[id] ?? definitionRoom({ map }, id).ambientTemperature;
  const usableVolume = Math.max(
    8,
    facilityModelForMap(map).roomVolume(id) - roomEquipmentVolume({ equipment }, definition)
  );
  // A newly excavated room starts at the same ambient pressure even when its authored
  // temperature or usable geometry differs. Gas inventory therefore scales with both
  // free volume and absolute temperature, rather than assuming every room is 100 units at 22 °C.
  const ambientReferenceAmount = GAS_TYPES.reduce((total, gas) => total + ambient[gas], 0);
  const ambientScale =
    (usableVolume / ambientReferenceAmount) * (kelvin(STANDARD_TEMPERATURE) / kelvin(temperature));
  return {
    id,
    gas: {
      lower: Object.fromEntries(
        GAS_TYPES.map((gas) => [gas, (ambient[gas] * ambientScale) / 2])
      ) as GasAmounts,
      upper: Object.fromEntries(
        GAS_TYPES.map((gas) => [gas, (ambient[gas] * ambientScale) / 2])
      ) as GasAmounts,
    },
    gasTemperature: { lower: temperature, upper: temperature },
    liquid: emptyLiquid(),
    stationary: { ...emptyStationary(), ...loadout.stationary[id] },
    temperature,
    residue: 0,
    reactionIntensity: 0,
    pressurePulse: 0,
    flashCooldown: { lower: 0, upper: 0 },
    combustionCount: 0,
    reactions: emptyRoomReactions(definition),
    equipment,
  };
};

/** A just-grafted room's state: ambient contents, no loadout. */
export const freshRoomState = (
  id: RoomId,
  definition: ProcessPhysicsDefinition,
  map: WorldMap
): RoomState => makeRoom(id, emptyFacilityLoadout(), definition, map);

const emptyFacilityLoadout = (): FacilityLoadout => ({
  equipment: {},
  initialTemperatures: {},
  gasConduits: {},
  liquidConduits: {},
  stationary: {},
});

const makeRooms = (
  loadout: FacilityLoadout,
  definition: ProcessPhysicsDefinition,
  map: WorldMap
): Record<RoomId, RoomState> =>
  Object.fromEntries(
    Object.keys(map.rooms).map((id) => [id, makeRoom(id, loadout, definition, map)])
  ) as Record<RoomId, RoomState>;

const makeGasSources = (definition: ProcessDefinition): ProcessState["gasSources"] =>
  Object.fromEntries(
    definition.supplies.flatMap((supply) =>
      supply.phase === "gas" ? [[supply.id, { gas: { ...emptyGas(), ...supply.initial } }]] : []
    )
  );

const makeLiquidSources = (definition: ProcessDefinition): ProcessState["liquidSources"] =>
  Object.fromEntries(
    definition.supplies.flatMap((supply) =>
      supply.phase === "liquid"
        ? [[supply.id, { liquid: { ...emptyLiquid(), ...supply.initial } }]]
        : []
    )
  );

const makeGasJunctions = (map: WorldMap): ProcessState["gasJunctions"] =>
  Object.fromEntries(
    Object.keys(map.rooms).map((roomId) => [roomId, { gas: emptyGas(), temperature: 22 }])
  ) as ProcessState["gasJunctions"];

const makeLiquidJunctions = (map: WorldMap): ProcessState["liquidJunctions"] =>
  Object.fromEntries(
    Object.keys(map.rooms).map((roomId) => [roomId, { liquid: emptyLiquid() }])
  ) as ProcessState["liquidJunctions"];

const makeGasConduits = (loadout: FacilityLoadout, map: WorldMap): ProcessState["gasConduits"] =>
  Object.fromEntries(
    processLineIds({ map }, "gas_line").map((runId) => {
      const definition = maybeLineDefinition({ map }, runId, "gas");
      const configured = loadout.gasConduits[runId];
      return [
        runId,
        {
          enabled: configured?.enabled ?? false,
          route: definition ? definition.route.map((cell) => ({ ...cell })) : [],
          gas: { ...emptyGas(), ...(configured?.gas ?? {}) },
          temperature: 22,
          lastFlow: 0,
          lastSpeciesFlow: emptyGas(),
          blocked: false,
          flowCause: "idle",
        },
      ];
    })
  ) as ProcessState["gasConduits"];

const makeLiquidConduits = (
  loadout: FacilityLoadout,
  map: WorldMap
): ProcessState["liquidConduits"] =>
  Object.fromEntries(
    processLineIds({ map }, "liquid_line").map((runId) => {
      const definition = maybeLineDefinition({ map }, runId, "liquid");
      const configured = loadout.liquidConduits[runId];
      return [
        runId,
        {
          enabled: configured?.enabled ?? false,
          route: definition ? definition.route.map((cell) => ({ ...cell })) : [],
          liquid: { ...emptyLiquid(), ...(configured?.liquid ?? {}) },
          lastFlow: 0,
          lastSpeciesFlow: emptyLiquid(),
          blocked: false,
          flowCause: "idle",
        },
      ];
    })
  ) as ProcessState["liquidConduits"];

export const createProcessState = (definition: ProcessDefinition, map: WorldMap): ProcessState => ({
  rooms: makeRooms(definition.loadout, processDefinitionForMap(definition, map), map),
  gasSources: makeGasSources(definition),
  liquidSources: makeLiquidSources(definition),
  gasJunctions: makeGasJunctions(map),
  liquidJunctions: makeLiquidJunctions(map),
  gasConduits: makeGasConduits(definition.loadout, map),
  liquidConduits: makeLiquidConduits(definition.loadout, map),
  gasVent: emptyGas(),
  liquidDrain: emptyLiquid(),
  towerResources: {},
  towerSupply: {},
});
