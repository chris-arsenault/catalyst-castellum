import { EQUIPMENT_DEFINITIONS } from "../../presentation/defaultGame";
import type { EquipmentId } from "../../game/types";
import { equipmentCopy } from "../../presentation/entityCopy";
import { useGamePresentation } from "../../application/presentationContext";
import { machineSpriteUrl } from "../gameMap/machineSprites";

export const EquipmentImage = ({
  equipmentId,
  compact = false,
}: {
  equipmentId: EquipmentId;
  compact: boolean;
}) => {
  const { translator } = useGamePresentation();
  const definition = EQUIPMENT_DEFINITIONS[equipmentId];
  return (
    <figure
      className={`manual-equipment-image ${compact ? "compact" : ""}`}
      style={{ "--manual-accent": definition.accent }}
    >
      <span className="manual-machine-sprite">
        <img
          src={machineSpriteUrl(equipmentId)}
          alt={translator.text("ui.manual.fieldPlate", {
            name: equipmentCopy(definition, translator).name,
          })}
        />
      </span>
    </figure>
  );
};
