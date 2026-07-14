import { EQUIPMENT_DEFINITIONS } from "../../presentation/defaultGame";
import type { EquipmentId } from "../../game/types";
import { equipmentCopy } from "../../presentation/entityCopy";
import { useGamePresentation } from "../../application/presentationContext";

export const EquipmentImage = ({
  equipmentId,
  compact = false,
}: {
  equipmentId: EquipmentId;
  compact: boolean;
}) => {
  const { manual, translator } = useGamePresentation();
  const definition = EQUIPMENT_DEFINITIONS[equipmentId];
  return (
    <figure
      className={`manual-equipment-image ${compact ? "compact" : ""}`}
      style={{ "--manual-accent": definition.accent }}
    >
      <img
        src={manual.equipmentManual[equipmentId].image}
        alt={translator.text("ui.manual.fieldPlate", {
          name: equipmentCopy(definition, translator).name,
        })}
      />
    </figure>
  );
};
