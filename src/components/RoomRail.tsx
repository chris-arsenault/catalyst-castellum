import { ROOM_ORDER, roomRing } from "../presentation/defaultGame";
import { useGameStore } from "../application/store";
import { roomCopy } from "../presentation/entityCopy";
import { useGamePresentation } from "../application/presentationContext";
import { roomState } from "../game/world/instances";
import { roomDefinition } from "../presentation/defaultGame";

export const RoomRail = () => {
  const { selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const selectedRoomId = useGameStore((state) => state.selectedRoomId);
  const selectRoom = useGameStore((state) => state.selectRoom);

  return (
    <nav className="room-rail" aria-label={translator.text("ui.map.selectRoom")}>
      {ROOM_ORDER.map((roomId) => {
        const definition = roomDefinition(roomId);
        const ring = roomRing(roomId);
        const analysis = selectors.roomAnalysis(roomState(game, roomId));
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
            <strong>{roomCopy(definition, translator).name}</strong>
          </button>
        );
      })}
    </nav>
  );
};
