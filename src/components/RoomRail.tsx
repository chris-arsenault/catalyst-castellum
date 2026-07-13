import { ROOM_DEFINITIONS, ROOM_ORDER, roomRing } from "../game/config";
import { roomAnalysis } from "../presentation/selectors";
import { useGameStore } from "../application/store";

export const RoomRail = () => {
  const game = useGameStore((state) => state.game);
  const selectedRoomId = useGameStore((state) => state.selectedRoomId);
  const selectRoom = useGameStore((state) => state.selectRoom);

  return (
    <nav className="room-rail" aria-label="Select a room">
      {ROOM_ORDER.map((roomId) => {
        const definition = ROOM_DEFINITIONS[roomId];
        const ring = roomRing(roomId);
        const analysis = roomAnalysis(game.rooms[roomId]);
        return (
          <button
            key={roomId}
            type="button"
            className={`${selectedRoomId === roomId ? "selected" : ""} ${definition.structure} ring-${ring}`}
            data-testid={`select-room-${roomId}`}
            onClick={() => selectRoom(roomId)}
          >
            <span className={`room-status hazard-${analysis.hazardLabel.toLowerCase()}`} />
            <span>{definition.code}</span>
            <strong>{definition.name}</strong>
          </button>
        );
      })}
    </nav>
  );
};
