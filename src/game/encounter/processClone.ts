import type { EquipmentInstance, EquipmentOutputState, LimitingFactor, RoomState } from "../types";
import type { ProcessState } from "./processTypes";

const cloneLimitingFactor = (factor: LimitingFactor): LimitingFactor => ({ ...factor });

const cloneEquipmentOutput = (output: EquipmentOutputState | null): EquipmentOutputState | null => {
  if (!output) return null;
  return output.phase === "gas"
    ? { phase: "gas", gas: { ...output.gas } }
    : { phase: "liquid", liquid: { ...output.liquid } };
};

const cloneEquipment = (instance: EquipmentInstance): EquipmentInstance => ({
  ...instance,
  operation: instance.operation
    ? {
        ...instance.operation,
        limitingFactor: cloneLimitingFactor(instance.operation.limitingFactor),
        outputs: Object.fromEntries(
          Object.entries(instance.operation.outputs).map(([id, output]) => [
            id,
            cloneEquipmentOutput(output),
          ])
        ) as NonNullable<EquipmentInstance["operation"]>["outputs"],
      }
    : null,
});

const cloneRooms = (rooms: ProcessState["rooms"]): ProcessState["rooms"] =>
  Object.fromEntries(
    Object.entries(rooms).map(([id, room]) => [
      id,
      {
        ...room,
        gas: {
          lower: { ...room.gas.lower },
          upper: { ...room.gas.upper },
        },
        gasTemperature: { ...room.gasTemperature },
        flashCooldown: { ...room.flashCooldown },
        liquid: { ...room.liquid },
        stationary: { ...room.stationary },
        reactions: Object.fromEntries(
          Object.entries(room.reactions).map(([reactionId, telemetry]) => [
            reactionId,
            {
              ...telemetry,
              limitingFactor: cloneLimitingFactor(telemetry.limitingFactor),
            },
          ])
        ) as RoomState["reactions"],
        equipment: Object.fromEntries(
          Object.entries(room.equipment).map(([socketId, instance]) => [
            socketId,
            instance ? cloneEquipment(instance) : null,
          ])
        ) as RoomState["equipment"],
      },
    ])
  ) as ProcessState["rooms"];

const cloneMaterialState = (
  state: ProcessState
): Pick<ProcessState, "gasSources" | "liquidSources" | "gasVent" | "liquidDrain"> => ({
  gasSources: Object.fromEntries(
    Object.entries(state.gasSources).map(([id, source]) => [id, { gas: { ...source.gas } }])
  ) as ProcessState["gasSources"],
  liquidSources: Object.fromEntries(
    Object.entries(state.liquidSources).map(([id, source]) => [
      id,
      { liquid: { ...source.liquid } },
    ])
  ) as ProcessState["liquidSources"],
  gasVent: { ...state.gasVent },
  liquidDrain: { ...state.liquidDrain },
});

const cloneNetworkState = (
  state: ProcessState
): Pick<ProcessState, "gasJunctions" | "liquidJunctions" | "gasConduits" | "liquidConduits"> => ({
  gasJunctions: Object.fromEntries(
    Object.entries(state.gasJunctions).map(([id, junction]) => [
      id,
      { ...junction, gas: { ...junction.gas } },
    ])
  ) as ProcessState["gasJunctions"],
  liquidJunctions: Object.fromEntries(
    Object.entries(state.liquidJunctions).map(([id, junction]) => [
      id,
      { liquid: { ...junction.liquid } },
    ])
  ) as ProcessState["liquidJunctions"],
  gasConduits: Object.fromEntries(
    Object.entries(state.gasConduits).map(([id, conduit]) => [
      id,
      {
        ...conduit,
        route: conduit.route.map((cell) => ({ ...cell })),
        gas: { ...conduit.gas },
        lastSpeciesFlow: { ...conduit.lastSpeciesFlow },
      },
    ])
  ) as ProcessState["gasConduits"],
  liquidConduits: Object.fromEntries(
    Object.entries(state.liquidConduits).map(([id, conduit]) => [
      id,
      {
        ...conduit,
        route: conduit.route.map((cell) => ({ ...cell })),
        liquid: { ...conduit.liquid },
        lastSpeciesFlow: { ...conduit.lastSpeciesFlow },
      },
    ])
  ) as ProcessState["liquidConduits"],
});

export const cloneProcessState = (state: ProcessState): ProcessState => ({
  rooms: cloneRooms(state.rooms),
  ...cloneMaterialState(state),
  ...cloneNetworkState(state),
  towerResources: Object.fromEntries(
    Object.entries(state.towerResources).map(([id, resources]) => [
      id,
      { gas: { ...resources.gas }, liquid: { ...resources.liquid } },
    ])
  ),
  towerSupply: Object.fromEntries(
    Object.entries(state.towerSupply).map(([id, status]) => [
      id,
      { ...status, connectionIds: [...status.connectionIds] },
    ])
  ),
});
