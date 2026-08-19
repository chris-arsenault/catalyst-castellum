import { RotateCw } from "lucide-react";
import { useGamePresentation } from "../../application/presentationContext";
import { useGameStore } from "../../application/store";
import { DEFAULT_GAME_RUNTIME } from "../../game/runtime";
import type { TowerInstance } from "../../game/types";
import { orientationKey } from "../../presentation/towerCopy";

export const TowerAimControls = ({ tower }: { tower: TowerInstance }) => {
  const { translator } = useGamePresentation();
  const dispatch = useGameStore((state) => state.dispatch);
  const definition = DEFAULT_GAME_RUNTIME.definition.towers[tower.chassisId];
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
