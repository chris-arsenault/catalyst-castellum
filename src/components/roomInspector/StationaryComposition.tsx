import { useGamePresentation } from "../../application/presentationContext";
import { useGameStore } from "../../application/store";
import { STATIONARY_TYPES } from "../../game/types";
import { roomState } from "../../game/world/instances";
import { SPECIES_DEFINITIONS, STATIONARY_COLORS } from "../../presentation/defaultGame";
import { speciesCopy } from "../../presentation/entityCopy";

export const StationaryComposition = () => {
  const { formatters, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const roomId = useGameStore((state) => state.selectedRoomId);
  const room = roomState(game, roomId);
  const present = STATIONARY_TYPES.filter((species) => room.stationary[species] > 0.001);
  const total = present.reduce((sum, species) => sum + room.stationary[species], 0);
  if (present.length === 0) return null;
  return (
    <div className="composition-group stationary-group">
      <div className="composition-heading">
        <span>{translator.text("ui.room.stationaryInventory")}</span>
        <strong>{formatters.measurement(total, "mol-eq", 1)}</strong>
      </div>
      <div className="composition-list stationary-list">
        {present.map((species) => (
          <div key={species}>
            <span className="color-dot" style={{ "--dot-color": STATIONARY_COLORS[species] }} />
            <span>{speciesCopy(SPECIES_DEFINITIONS[species], translator).name}</span>
            <strong>{formatters.measurement(room.stationary[species], "mol-eq", 2)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};
