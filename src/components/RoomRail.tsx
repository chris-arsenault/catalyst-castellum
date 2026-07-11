import { ROOM_DEFINITIONS, ROOM_ORDER } from "../game/config";
import { analyzeRoom } from "../game/simulation";
import { useGameStore } from "../game/store";

export const RoomRail = () => {
  const game = useGameStore((state) => state.game);
  const selectedRoomId = useGameStore((state) => state.selectedRoomId);
  const selectRoom = useGameStore((state) => state.selectRoom);

  return (
    <nav className="room-rail" aria-label="Select a room">
      {ROOM_ORDER.map((roomId) => {
        const definition = ROOM_DEFINITIONS[roomId];
        const analysis = analyzeRoom(game.rooms[roomId]);
        return (
          <button
            key={roomId}
            type="button"
            className={`${selectedRoomId === roomId ? "selected" : ""} ${definition.kind}`}
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
