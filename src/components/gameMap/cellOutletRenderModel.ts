import { EQUIPMENT_DEFINITIONS, SPECIES_DEFINITIONS } from "../../presentation/defaultGame";
import { type EquipmentOutputId, type GameState, type RoomId } from "../../game/types";
import { gasAmountTotal, liquidAmountTotal } from "../../game/queries";
import { equipmentRenderModels } from "./equipmentRenderModel";
import { colorNumber, mapViewFor } from "./mapGeometry";
import { equipmentOutputCopy } from "../../presentation/entityCopy";
import { DEFAULT_TRANSLATOR, type Translator } from "../../localization/translator";
import { roomDefinition } from "../../presentation/defaultGame";
import { roomState } from "../../game/world/instances";

export type CellOutletId = EquipmentOutputId;

export interface CellOutletRenderModel {
  accent: number;
  amount: number;
  outputId: CellOutletId;
  capacity: number;
  fill: number;
  formula: string;
  name: string;
  phase: "gas" | "liquid";
  roomId: RoomId;
  x: number;
  y: number;
}

export interface CellOutletAssemblyModel {
  header: string;
  installationX: number;
  installationY: number;
  outlets: readonly CellOutletRenderModel[];
  roomId: RoomId;
  rowY: number;
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

export const cellOutletAssemblyModel = (
  game: GameState,
  translator: Translator = DEFAULT_TRANSLATOR
): CellOutletAssemblyModel | null => {
  const installation = equipmentRenderModels(game).find(
    (model) => model.equipmentId === "membrane_cell"
  );
  if (!installation) return null;

  const room = mapViewFor(game.map).roomMapRect(installation.roomId);
  const centerX = clamp(installation.x, room.left + 45, room.left + room.width - 45);
  const rowY = clamp(installation.y - 54, room.top + 31, room.top + room.height - 39);
  const instance = roomState(game, installation.roomId).equipment[installation.socketId];
  const operation = EQUIPMENT_DEFINITIONS.membrane_cell.operation;
  if (!instance?.operation || !operation) return null;
  const definitions = operation.outputs.flatMap((definition) => {
    const output = instance.operation?.outputs[definition.id];
    if (!output) return [];
    return [
      {
        outputId: definition.id,
        formula: SPECIES_DEFINITIONS[definition.speciesId].formula,
        phase: definition.phase,
        amount:
          output.phase === "gas" ? gasAmountTotal(output.gas) : liquidAmountTotal(output.liquid),
        definition,
      },
    ];
  });

  return {
    header: translator.text("ui.map.outlet.header", {
      room: roomDefinition(game, installation.roomId).code,
    }),
    installationX: installation.x,
    installationY: installation.y,
    outlets: definitions.map(({ amount, outputId, definition, formula, phase }, index) => ({
      accent: colorNumber(definition.accent),
      amount,
      outputId,
      capacity: definition.capacity,
      fill: amount / definition.capacity,
      formula,
      name: equipmentOutputCopy(definition, translator).name,
      phase,
      roomId: installation.roomId,
      x: centerX + (index - 1) * 34,
      y: rowY,
    })),
    roomId: installation.roomId,
    rowY,
  };
};
