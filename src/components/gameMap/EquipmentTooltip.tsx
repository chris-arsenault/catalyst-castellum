import { EQUIPMENT_DEFINITIONS, equipmentGrade } from "../../presentation/defaultGame";
import type { GameState } from "../../game/types";
import type { EquipmentHover } from "./EquipmentLayer";
import { equipmentCopy } from "../../presentation/entityCopy";
import { useGamePresentation } from "../../application/presentationContext";
import { roomState } from "../../game/world/instances";
import { roomDefinition } from "../../presentation/defaultGame";

export const EquipmentTooltip = ({
  equipment,
  game,
}: {
  equipment: EquipmentHover | null;
  game: GameState;
}) => {
  const { equipmentGradeEffect, translator } = useGamePresentation();
  if (!equipment) return null;
  const instance = roomState(game, equipment.roomId).equipment[equipment.socketId];
  if (!instance) return null;
  const definition = EQUIPMENT_DEFINITIONS[instance.equipmentId];
  const room = roomDefinition(game, equipment.roomId);
  return (
    <aside className="room-map-tooltip equipment-map-tooltip" data-testid="equipment-map-tooltip">
      <header>
        <span style={{ color: definition.accent }}>{room.code}</span>
        <strong>{equipmentCopy(definition, translator).name}</strong>
        <em>
          {translator.text(
            instance.enabled ? "ui.map.equipment.active" : "ui.map.equipment.standby"
          )}
        </em>
      </header>
      <dl>
        <div>
          <dt>{translator.text("ui.map.equipment.mount")}</dt>
          <dd>
            {translator.text(
              equipment.socketId === "socket_a"
                ? "ui.manual.build.socketA"
                : "ui.manual.build.socketB"
            )}
          </dd>
        </div>
        <div>
          <dt>{translator.text("ui.map.equipment.grade")}</dt>
          <dd>{instance.level}</dd>
        </div>
        <div>
          <dt>{translator.text("ui.map.equipment.effect")}</dt>
          <dd>{equipmentGradeEffect(equipmentGrade(instance.equipmentId, instance.level))}</dd>
        </div>
      </dl>
      <small>{translator.text("ui.map.room.select", { room: room.code })}</small>
    </aside>
  );
};
