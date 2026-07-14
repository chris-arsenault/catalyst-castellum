import { EQUIPMENT_DEFINITIONS } from "../../game/config";
import type { EquipmentId } from "../../game/types";
import { EQUIPMENT_MANUAL } from "../../presentation/manualContent";

export const EquipmentImage = ({
  equipmentId,
  compact = false,
}: {
  equipmentId: EquipmentId;
  compact: boolean;
}) => {
  const definition = EQUIPMENT_DEFINITIONS[equipmentId];
  return (
    <figure
      className={`manual-equipment-image ${compact ? "compact" : ""}`}
      style={{ "--manual-accent": definition.accent }}
    >
      <img src={EQUIPMENT_MANUAL[equipmentId].image} alt={`${definition.name} field plate`} />
    </figure>
  );
};
