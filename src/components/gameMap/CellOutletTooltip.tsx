import { ROOM_DEFINITIONS } from "../../presentation/defaultGame";
import type { GameState } from "../../game/types";
import { cellOutletAssemblyModel, type CellOutletId } from "./cellOutletRenderModel";

export const CellOutletTooltip = ({
  bufferId,
  game,
}: {
  bufferId: CellOutletId | null;
  game: GameState;
}) => {
  if (!bufferId) return null;
  const assembly = cellOutletAssemblyModel(game);
  const outlet = assembly?.outlets.find((candidate) => candidate.bufferId === bufferId);
  if (!assembly || !outlet) return null;
  const room = ROOM_DEFINITIONS[assembly.roomId];
  return (
    <aside className="room-map-tooltip equipment-map-tooltip" data-testid="cell-outlet-tooltip">
      <header>
        <span style={{ color: `#${outlet.accent.toString(16).padStart(6, "0")}` }}>
          {outlet.formula}
        </span>
        <strong>{outlet.name}</strong>
        <em>{outlet.phase.toUpperCase()}</em>
      </header>
      <dl>
        <div>
          <dt>Cell room</dt>
          <dd>{room.code}</dd>
        </div>
        <div>
          <dt>Inventory</dt>
          <dd>
            {outlet.amount.toFixed(1)} / {outlet.capacity.toFixed(0)} mol
          </dd>
        </div>
        <div>
          <dt>Connection</dt>
          <dd>{room.code} process junction</dd>
        </div>
      </dl>
      <small>Membrane-cell product buffer</small>
    </aside>
  );
};
