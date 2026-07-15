import { architecturalConnections } from "../game/world/map";
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import type { FacilityPortalDefinition, GameState, RoomId } from "../game/types";
import type { Translator } from "../localization/translator";
import { roomDefinition } from "../presentation/defaultGame";

const portalKindLabel = (kind: FacilityPortalDefinition["kind"], translator: Translator): string =>
  ({
    passage: translator.text("ui.architecture.kind.passage"),
    ladder_shaft: translator.text("ui.architecture.kind.ladder"),
    floor_hole: translator.text("ui.architecture.kind.floor"),
    door: translator.text("ui.architecture.kind.door"),
    trapdoor: translator.text("ui.architecture.kind.trapdoor"),
    core_door: translator.text("ui.architecture.kind.coreDoor"),
  })[kind];

const portalStateLabel = (
  state: GameState["portalStates"][string],
  translator: Translator
): string => {
  if (state.sealed) return translator.text("ui.architecture.state.sealed");
  return state.open
    ? translator.text("ui.architecture.state.open")
    : translator.text("ui.architecture.state.closed");
};

interface ArchitecturalConnectionModel {
  gasFlow: number;
  liquidFlow: number;
  otherRoomId: RoomId;
  state: GameState["portalStates"][string];
}

const architecturalConnectionModel = (
  game: GameState,
  roomId: RoomId,
  portal: FacilityPortalDefinition
): ArchitecturalConnectionModel => {
  const state = game.portalStates[portal.id];
  if (!state) throw new Error(`Missing state for architectural portal ${portal.id}.`);
  const roomIsFirst = portal.rooms[0] === roomId;
  const otherRoomId = roomIsFirst ? portal.rooms[1] : portal.rooms[0];
  const flowSignForRoom = roomIsFirst ? 1 : -1;
  return {
    gasFlow: state.lastGasFlow * flowSignForRoom,
    liquidFlow: state.lastLiquidFlow * flowSignForRoom,
    otherRoomId,
    state,
  };
};

const ArchitecturalConnection = ({
  game,
  portal,
  roomId,
}: {
  game: GameState;
  portal: FacilityPortalDefinition;
  roomId: RoomId;
}) => {
  const { formatters, translator } = useGamePresentation();
  const model = architecturalConnectionModel(game, roomId, portal);
  const gasDirection = translator.text(
    model.gasFlow >= 0 ? "ui.architecture.direction.out" : "ui.architecture.direction.in"
  );
  const liquidDirection = translator.text(
    model.liquidFlow >= 0 ? "ui.architecture.direction.out" : "ui.architecture.direction.in"
  );
  return (
    <article data-portal-id={portal.id}>
      <strong>{portalKindLabel(portal.kind, translator)}</strong>
      <span>
        {roomDefinition(model.otherRoomId).code} · {portalStateLabel(model.state, translator)}
      </span>
      <small>
        {translator.text("ui.architecture.flow", {
          gasDirection,
          gasFlow: formatters.measurement(Math.abs(model.gasFlow), "mol-eq/s", 2),
          liquidDirection,
          liquidFlow: formatters.measurement(Math.abs(model.liquidFlow), "mol-eq/s", 2),
        })}
      </small>
    </article>
  );
};

export const ArchitecturalConnections = () => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const portals = architecturalConnections(game.map).filter((portal) =>
    portal.rooms.includes(roomId)
  );
  if (portals.length === 0) return null;
  return (
    <section
      className="effects-panel architectural-connections"
      data-testid="architectural-connections"
    >
      <div className="section-title-row">
        <h3>{translator.text("ui.architecture.title")}</h3>
        <span>{translator.text("ui.architecture.kicker")}</span>
      </div>
      <div className="architectural-connection-list">
        {portals.map((portal) => (
          <ArchitecturalConnection key={portal.id} game={game} portal={portal} roomId={roomId} />
        ))}
      </div>
    </section>
  );
};
