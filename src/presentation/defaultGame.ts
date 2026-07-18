// The application binds one compiled pack here. UI and presentation code depend on this
// composition seam rather than reaching into authored content or engine internals.
export {
  DEFAULT_GAME_DEFINITION,
  ENEMY_DEFINITIONS,
  EQUIPMENT_DEFINITIONS,
  GAS_BUFFERS,
  GAS_COLORS,
  GAS_LABELS,
  GAS_SOURCES,
  CAMPAIGN_LEVELS,
  LEVEL_DEFINITIONS,
  LIQUID_BUFFERS,
  LIQUID_COLORS,
  LIQUID_LABELS,
  LIQUID_SOURCES,
  NARRATIVE_ACTS,
  NARRATIVE_ROUTE_EDGES,
  NARRATIVE_SITES,
  NARRATIVE_SITES_BY_ID,
  PROCESS_DEFINITIONS,
  REACTION_DEFINITIONS,
  SPECIES_DEFINITIONS,
  equipmentGrade,
  narrativeSiteAfter,
  narrativeSiteForLevel,
  narrativeSiteOpensAct,
  nextLevelId,
} from "../game/config";
export type {
  NarrativeActDefinition,
  NarrativeActId,
  NarrativeDialogueLineDefinition,
  NarrativeSiteDefinition,
  NarrativeSiteId,
  NarrativeSpeakerId,
} from "../game/config";

import {
  instance,
  maybeLineDefinition,
  type MapCarrier,
  type ProcessLineView,
} from "../game/world/instances";
import type { RoomDefinition, RoomId, TransportPhase } from "../game/types";
import type { MapConnection } from "../game/world/map";

/** Loud pack lookups for world-topology instances (ADR-0002). */
export const roomDefinition = (carrier: MapCarrier, roomId: string): RoomDefinition =>
  instance(carrier.map.rooms, roomId, "room definition");

export const connectionDefinition = (carrier: MapCarrier, id: string): MapConnection =>
  instance(carrier.map.connections, id, "connection definition");

/** Per-phase process-line view (ADR-0005); null when the pair has no line of this phase. */
export const lineDefinition = (
  carrier: MapCarrier,
  id: string,
  phase: TransportPhase
): ProcessLineView | null => maybeLineDefinition(carrier, id, phase);

export const connectionRoomPair = (carrier: MapCarrier, id: string): readonly [RoomId, RoomId] =>
  connectionDefinition(carrier, id).rooms;
