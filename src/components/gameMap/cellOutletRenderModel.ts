import { GAS_BUFFERS, LIQUID_BUFFERS } from "../../presentation/defaultGame";
import {
  type GasBufferId,
  type GameState,
  type LiquidBufferId,
  type RoomId,
} from "../../game/types";
import { gasAmountTotal, liquidAmountTotal } from "../../game/queries";
import { equipmentRenderModels } from "./equipmentRenderModel";
import { colorNumber, mapViewFor } from "./mapGeometry";
import { bufferCopy } from "../../presentation/entityCopy";
import { DEFAULT_TRANSLATOR, type Translator } from "../../localization/translator";
import { roomDefinition } from "../../presentation/defaultGame";

export type CellOutletId = GasBufferId | LiquidBufferId;

export interface CellOutletRenderModel {
  accent: number;
  amount: number;
  bufferId: CellOutletId;
  capacity: number;
  fill: number;
  formula: "Cl₂" | "H₂" | "NaOH";
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
  const definitions = [
    {
      bufferId: "anode_header" as const,
      formula: "Cl₂" as const,
      phase: "gas" as const,
      amount: gasAmountTotal(game.gasBuffers.anode_header.gas),
      definition: GAS_BUFFERS.anode_header,
    },
    {
      bufferId: "cathode_header" as const,
      formula: "H₂" as const,
      phase: "gas" as const,
      amount: gasAmountTotal(game.gasBuffers.cathode_header.gas),
      definition: GAS_BUFFERS.cathode_header,
    },
    {
      bufferId: "cell_liquor" as const,
      formula: "NaOH" as const,
      phase: "liquid" as const,
      amount: liquidAmountTotal(game.liquidBuffers.cell_liquor.liquid),
      definition: LIQUID_BUFFERS.cell_liquor,
    },
  ];

  return {
    header: translator.text("ui.map.outlet.header", {
      room: roomDefinition(installation.roomId).code,
    }),
    installationX: installation.x,
    installationY: installation.y,
    outlets: definitions.map(({ amount, bufferId, definition, formula, phase }, index) => ({
      accent: colorNumber(definition.accent),
      amount,
      bufferId,
      capacity: definition.capacity,
      fill: amount / definition.capacity,
      formula,
      name: bufferCopy(definition, translator).name,
      phase,
      roomId: installation.roomId,
      x: centerX + (index - 1) * 34,
      y: rowY,
    })),
    roomId: installation.roomId,
    rowY,
  };
};
