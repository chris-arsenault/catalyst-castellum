import { facilityModelForMap } from "../game/world/derivedModel";
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
      {game.encounter.world.rooms.map((roomId) => {
        const definition = roomDefinition(game.encounter, roomId);
        const ring = facilityModelForMap(game.encounter.map).ringForRoom(roomId);
        const analysis = selectors.roomAnalysis(roomState(game.encounter, roomId), game.encounter);
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
