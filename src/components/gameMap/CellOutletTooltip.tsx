import type { GameState } from "../../game/types";
import { cellOutletAssemblyModel, type CellOutletId } from "./cellOutletRenderModel";
import { useGamePresentation } from "../../application/presentationContext";
import { roomDefinition } from "../../presentation/defaultGame";

export const CellOutletTooltip = ({
  bufferId,
  game,
}: {
  bufferId: CellOutletId | null;
  game: GameState;
}) => {
  const { formatters, translator } = useGamePresentation();
  if (!bufferId) return null;
  const assembly = cellOutletAssemblyModel(game, translator);
  const outlet = assembly?.outlets.find((candidate) => candidate.bufferId === bufferId);
  if (!assembly || !outlet) return null;
  const room = roomDefinition(game, assembly.roomId);
  return (
    <aside className="room-map-tooltip equipment-map-tooltip" data-testid="cell-outlet-tooltip">
      <header>
        <span style={{ color: `#${outlet.accent.toString(16).padStart(6, "0")}` }}>
          {outlet.formula}
        </span>
        <strong>{outlet.name}</strong>
        <em>
          {translator.text(
            outlet.phase === "gas" ? "ui.map.outlet.phase.gas" : "ui.map.outlet.phase.liquid"
          )}
        </em>
      </header>
      <dl>
        <div>
          <dt>{translator.text("ui.map.outlet.room")}</dt>
          <dd>{room.code}</dd>
        </div>
        <div>
          <dt>{translator.text("ui.map.outlet.inventory")}</dt>
          <dd>
            {formatters.measurement(outlet.amount, "mol", 1)} /{" "}
            {formatters.measurement(outlet.capacity, "mol", 0)}
          </dd>
        </div>
        <div>
          <dt>{translator.text("ui.map.outlet.connection")}</dt>
          <dd>{translator.text("ui.map.outlet.junction", { room: room.code })}</dd>
        </div>
      </dl>
      <small>{translator.text("ui.map.outlet.footer")}</small>
    </aside>
  );
};
