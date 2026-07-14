import { FACILITY_MAP, ROOM_DEFINITIONS } from "../presentation/defaultGame";
import { useGameStore } from "../application/store";
import type { FacilityPortalDefinition, GameState, RoomId } from "../game/types";

const portalKindLabel = (kind: FacilityPortalDefinition["kind"]): string =>
  ({
    passage: "Open passage",
    ladder_shaft: "Open ladder shaft",
    floor_hole: "Floor opening",
    door: "Door",
    trapdoor: "Trapdoor",
    core_door: "Sealed Core door",
  })[kind];

const portalStateLabel = (state: GameState["portalStates"][string]): string => {
  if (state.sealed) return "SEALED";
  return state.open ? "OPEN" : "CLOSED";
};

interface ArchitecturalConnectionModel {
  gasFlow: number;
  liquidFlow: number;
  otherRoomId: RoomId;
  stateLabel: string;
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
    stateLabel: portalStateLabel(state),
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
  const model = architecturalConnectionModel(game, roomId, portal);
  const gasDirection = model.gasFlow >= 0 ? "out" : "in";
  const liquidDirection = model.liquidFlow >= 0 ? "out" : "in";
  return (
    <article data-portal-id={portal.id}>
      <strong>{portalKindLabel(portal.kind)}</strong>
      <span>
        {ROOM_DEFINITIONS[model.otherRoomId].code} · {model.stateLabel}
      </span>
      <small>
        Gas {gasDirection} {Math.abs(model.gasFlow).toFixed(2)} · liquid {liquidDirection}{" "}
        {Math.abs(model.liquidFlow).toFixed(2)} mol-eq/s
      </small>
    </article>
  );
};

export const ArchitecturalConnections = () => {
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const portals = FACILITY_MAP.portals.filter((portal) => portal.rooms.includes(roomId));
  if (portals.length === 0) return null;
  return (
    <section
      className="effects-panel architectural-connections"
      data-testid="architectural-connections"
    >
      <div className="section-title-row">
        <h3>Architectural openings</h3>
        <span>NATURAL FLOW</span>
      </div>
      <div className="architectural-connection-list">
        {portals.map((portal) => (
          <ArchitecturalConnection key={portal.id} game={game} portal={portal} roomId={roomId} />
        ))}
      </div>
    </section>
  );
};
