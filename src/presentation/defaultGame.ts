// The application binds one compiled pack here. UI and presentation code depend on this
// composition seam rather than reaching into authored content or engine internals.
export {
  DEFAULT_GAME_DEFINITION,
  ENEMY_DEFINITIONS,
  EQUIPMENT_DEFINITIONS,
  FACILITY_MAP,
  GAS_BUFFERS,
  GAS_COLORS,
  GAS_LABELS,
  GAS_SOURCES,
  LEVEL_DEFINITIONS,
  LIQUID_BUFFERS,
  LIQUID_COLORS,
  LIQUID_LABELS,
  LIQUID_SOURCES,
  PROCESS_DEFINITIONS,
  REACTION_DEFINITIONS,
  ROOM_DEFINITIONS,
  ROOM_ORDER,
  SPECIES_DEFINITIONS,
  TRANSPORT_RUNS,
  equipmentGrade,
  facilityCells,
  facilityRingForRoom,
  gridCellToWorldPoint,
  gridCellsToWorldPath,
  nextLevelId,
  roomAtmosphericCells,
  roomCenterWorld,
  roomRing,
  roomVolume,
  utilityNodeWorldPoint,
} from "../game/config";

import { DEFAULT_GAME_DEFINITION as PACK } from "../game/config";
import { instance } from "../game/world/instances";
import type { RoomDefinition, TransportRunDefinition } from "../game/types";

/** Loud pack lookups for world-topology instances (ADR-0002). */
export const roomDefinition = (roomId: string): RoomDefinition =>
  instance(PACK.rooms, roomId, "room definition");

export const transportRunDefinition = (runId: string): TransportRunDefinition =>
  instance(PACK.transportRuns, runId, "transport run definition");
