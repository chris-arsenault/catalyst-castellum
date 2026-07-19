import { GAS_COLORS, LIQUID_COLORS } from "../../presentation/defaultGame";
import { facilityModelForMap } from "../../game/world/derivedModel";
import { roomAnalysis } from "../../presentation/selectors";
import { roomGasInflow, roomLiquidInflowRate } from "../../presentation/roomFlow";
import {
  GAS_TYPES,
  type GameState,
  type GasAmounts,
  type GasZone,
  type RoomId,
} from "../../game/types";
import { colorNumber, mapViewFor } from "./mapGeometry";
import type { RoomDrawModel } from "./roomGraphics";
import { instance, roomState } from "../../game/world/instances";
import { roomDefinition } from "../../presentation/defaultGame";
import type { CoreReservoirDrawModel } from "./coreGraphics";
import type { SupplyCardCopy } from "../../presentation/supplyCopy";

const sourceFill = (amount: number, capacity: number): number =>
  capacity > 0 ? Math.max(0, Math.min(1, amount / capacity)) : 0;

const reservoir = (
  id: CoreReservoirDrawModel["id"],
  supply: SupplyCardCopy | undefined,
  fallbackColor: number
): CoreReservoirDrawModel => ({
  available: supply?.available ?? false,
  color: supply ? colorNumber(supply.accent) : fallbackColor,
  fill: supply ? sourceFill(supply.amount, supply.capacity) : 0,
  id,
});

const coreReservoirs = (
  supplies: readonly SupplyCardCopy[],
  coreRoomId: RoomId
): readonly CoreReservoirDrawModel[] => {
  const coreSupplies = supplies.filter((supply) => supply.hostRoomId === coreRoomId);
  const gas = coreSupplies.find((supply) => supply.phase === "gas");
  const liquids = coreSupplies.filter((supply) => supply.phase === "liquid");
  return [
    reservoir("gas_header", gas, 0xed9a48),
    reservoir("water", liquids[0], 0x41baf5),
    reservoir("brine", liquids[1], 0x60cce4),
  ];
};

const weightedGasColor = (gas: GasAmounts): number => {
  const total = GAS_TYPES.reduce((sum, species) => sum + gas[species], 0);
  if (total <= 0.001) return 0x24453d;
  const rgb = GAS_TYPES.reduce(
    (mixed, species) => {
      const color = colorNumber(GAS_COLORS[species]);
      const weight = gas[species] / total;
      return {
        red: mixed.red + ((color >> 16) & 0xff) * weight,
        green: mixed.green + ((color >> 8) & 0xff) * weight,
        blue: mixed.blue + (color & 0xff) * weight,
      };
    },
    { red: 0, green: 0, blue: 0 }
  );
  return (Math.round(rgb.red) << 16) | (Math.round(rgb.green) << 8) | Math.round(rgb.blue);
};

/** Pure projection from canonical room cells and simulation state to the room renderer. */
export const roomRenderModel = (
  game: GameState,
  roomId: RoomId,
  selected: boolean,
  occupied: number,
  supplies: readonly SupplyCardCopy[] = []
): RoomDrawModel => {
  const definition = roomDefinition(game, roomId);
  const facility = facilityModelForMap(game.map);
  const view = mapViewFor(game.map);
  const room = roomState(game, roomId);
  const analysis = roomAnalysis(room, game);
  const dimensions = view.roomMapRect(roomId);
  const gasColor = (zone: GasZone): number => weightedGasColor(room.gas[zone]);
  const liquidColor = analysis.dominantLiquid
    ? colorNumber(LIQUID_COLORS[analysis.dominantLiquid])
    : 0x41baf5;
  const center = view.worldToMapPoint(facility.roomCenterWorld(roomId));
  const bounds = instance(game.map.rooms, roomId, "map room").bounds;
  const zoneSplit = bounds.elevation + bounds.height / 2;
  const zoneCapacity = Math.max(1, facility.roomVolume(roomId) / 2);
  const gasFill = (amount: number): number =>
    Math.min(1, 1 - Math.exp(-Math.max(0, amount) / zoneCapacity));
  const gasInflow = roomGasInflow(game, roomId);
  const gasInflowColors = GAS_TYPES.filter((species) => gasInflow.species[species] > 0.001)
    .sort((left, right) => gasInflow.species[right] - gasInflow.species[left])
    .map((species) => colorNumber(GAS_COLORS[species]));
  return {
    width: dimensions.width,
    height: dimensions.height,
    structure: definition.structure,
    selected,
    analysis,
    ring: facility.ringForRoom(roomId),
    lowerGasColor: gasColor("lower"),
    lowerGasFill: gasFill(analysis.lowerGasTotal),
    upperGasColor: gasColor("upper"),
    upperGasFill: gasFill(analysis.upperGasTotal),
    liquidColor,
    cells: facility.roomAtmosphericCells(roomId).map((atmosphericCell) => {
      const rect = view.gridCellMapRect(atmosphericCell);
      return {
        cell: atmosphericCell,
        left: rect.left - center.x,
        top: rect.top - center.y,
        size: view.pixelsPerUnit,
        zone: atmosphericCell.elevation + 0.5 >= zoneSplit ? "upper" : "lower",
        liquidFill: Math.max(
          0,
          Math.min(1, analysis.liquidSurfaceElevation - atmosphericCell.elevation)
        ),
      };
    }),
    reactionIntensity: room.reactionIntensity,
    pressurePulse: room.pressurePulse,
    elapsed: game.elapsed,
    gasInflowRate: gasInflow.rate,
    gasInflowColors,
    liquidInflowRate: roomLiquidInflowRate(game, roomId),
    occupied,
    coreIntegrity: game.coreIntegrity,
    coreReservoirs: definition.structure === "core" ? coreReservoirs(supplies, roomId) : [],
  };
};
