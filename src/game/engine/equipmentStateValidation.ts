import type { ProcessEncounterState, ProcessPhysicsDefinition } from "../encounter/processTypes";
import { EQUIPMENT_OUTPUT_IDS, type EquipmentInstance, type EquipmentOutputId } from "../types";
import { roomState } from "../world/instances";
import type { StateValidationIssue } from "./stateValidationTypes";

const operationIssue = (path: string, message: string): StateValidationIssue => ({
  code: "equipment_state_invalid",
  path,
  message,
});

const outputMatches = (
  outputId: EquipmentOutputId,
  instance: EquipmentInstance,
  definition: ProcessPhysicsDefinition
): boolean => {
  const operationDefinition = definition.equipment[instance.equipmentId].operation;
  const expected = operationDefinition?.outputs.find(({ id }) => id === outputId);
  const actual = instance.operation?.outputs[outputId];
  return expected ? actual?.phase === expected.phase : !actual;
};

const validateInstanceOperation = (
  instance: EquipmentInstance,
  definition: ProcessPhysicsDefinition,
  path: string
): StateValidationIssue[] => {
  const operationDefinition = definition.equipment[instance.equipmentId].operation;
  if (Boolean(operationDefinition) !== Boolean(instance.operation)) {
    return [
      operationIssue(path, "Installed equipment operation state does not match its definition."),
    ];
  }
  if (!operationDefinition || !instance.operation) return [];
  return EQUIPMENT_OUTPUT_IDS.filter(
    (outputId) => !outputMatches(outputId, instance, definition)
  ).map((outputId) =>
    operationIssue(
      `${path}.outputs.${outputId}`,
      "Installed equipment output state does not match its authored port."
    )
  );
};

export const validateEquipmentStates = (
  state: ProcessEncounterState,
  definition: ProcessPhysicsDefinition
): StateValidationIssue[] =>
  state.world.rooms.flatMap((roomId) =>
    Object.entries(roomState(state, roomId).equipment).flatMap(([socketId, instance]) =>
      instance
        ? validateInstanceOperation(
            instance,
            definition,
            `rooms.${roomId}.equipment.${socketId}.operation`
          )
        : []
    )
  );
