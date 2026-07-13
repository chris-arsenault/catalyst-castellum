import { ROOM_DEFINITIONS, SPECIES_DEFINITIONS, roomVolume } from "../../game/config";
import type { GameState, RoomId } from "../../game/types";
import { roomAnalysis } from "../../presentation/selectors";

export const RoomTooltip = ({ game, roomId }: { game: GameState; roomId: RoomId | null }) => {
  if (!roomId) return null;
  const definition = ROOM_DEFINITIONS[roomId];
  const analysis = roomAnalysis(game.rooms[roomId]);
  const liquidFill = Math.min(1, analysis.liquidTotal / roomVolume(roomId));
  const upper =
    analysis.upperGasTotal > 0.05
      ? `${SPECIES_DEFINITIONS[analysis.upperDominantGas].formula} · ${analysis.upperGasTotal.toFixed(0)} mol-eq`
      : "empty";
  const lower =
    analysis.lowerGasTotal > 0.05
      ? `${SPECIES_DEFINITIONS[analysis.lowerDominantGas].formula} · ${analysis.lowerGasTotal.toFixed(0)} mol-eq`
      : "empty";
  return (
    <aside className="room-map-tooltip" data-testid="room-map-tooltip">
      <header>
        <span>{definition.code}</span>
        <strong>{definition.name}</strong>
        <em className={`hazard-${analysis.hazardLabel.toLowerCase()}`}>{analysis.hazardLabel}</em>
      </header>
      <dl>
        <div>
          <dt>Upper gas</dt>
          <dd>{upper}</dd>
        </div>
        <div>
          <dt>Lower gas</dt>
          <dd>{lower}</dd>
        </div>
        <div>
          <dt>Liquid</dt>
          <dd>{Math.round(liquidFill * 100)}% full</dd>
        </div>
        <div>
          <dt>Pressure</dt>
          <dd>{Math.round(analysis.pressure)} kPa</dd>
        </div>
      </dl>
      <small>Click to select this room</small>
    </aside>
  );
};
