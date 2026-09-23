import { RotateCw } from "lucide-react";
import { useEncounterControls } from "../../application/encounterSurface";
import type { EncounterTower } from "../../game/encounter/types";
import { orientationKey } from "../../presentation/towerCopy";

export const TowerAimControls = ({ tower }: { tower: EncounterTower }) => {
  const { towers, translator } = useEncounterControls().presentation;
  const dispatch = useEncounterControls().dispatch;
  const definition = towers.definition(tower.chassisId);
  return (
    <>
      <h4>
        <RotateCw size={13} /> {translator.text("tower.panel.aim")}
      </h4>
      <div className="tower-option-row">
        {definition.orientations.map((orientation) => (
          <button
            key={orientation}
            type="button"
            data-testid={`tower-rotate-${orientation}`}
            className={tower.placement.orientation === orientation ? "selected" : ""}
            onClick={() => dispatch({ type: "rotate_tower", towerId: tower.id, orientation })}
          >
            <RotateCw size={12} />
            {translator.text("tower.panel.rotate", {
              direction: translator.text(orientationKey(orientation)),
            })}
          </button>
        ))}
      </div>
    </>
  );
};
