import {
  EQUIPMENT_DEFINITIONS,
  ROOM_DEFINITIONS,
  equipmentGrade,
} from "../../presentation/defaultGame";
import type { GameState } from "../../game/types";
import { equipmentGradeEffect } from "../../presentation/equipmentCopy";
import type { EquipmentHover } from "./EquipmentLayer";
import { equipmentCopy } from "../../presentation/entityCopy";

const socketLabel = (socketId: EquipmentHover["socketId"]): string =>
  socketId === "socket_a" ? "Socket A" : "Socket B";

export const EquipmentTooltip = ({
  equipment,
  game,
}: {
  equipment: EquipmentHover | null;
  game: GameState;
}) => {
  if (!equipment) return null;
  const instance = game.rooms[equipment.roomId].equipment[equipment.socketId];
  if (!instance) return null;
  const definition = EQUIPMENT_DEFINITIONS[instance.equipmentId];
  const room = ROOM_DEFINITIONS[equipment.roomId];
  return (
    <aside className="room-map-tooltip equipment-map-tooltip" data-testid="equipment-map-tooltip">
      <header>
        <span style={{ color: definition.accent }}>{room.code}</span>
        <strong>{equipmentCopy(definition).name}</strong>
        <em>{instance.enabled ? "ACTIVE" : "STANDBY"}</em>
      </header>
      <dl>
        <div>
          <dt>Mount</dt>
          <dd>{socketLabel(equipment.socketId)}</dd>
        </div>
        <div>
          <dt>Grade</dt>
          <dd>{instance.level}</dd>
        </div>
        <div>
          <dt>Effect</dt>
          <dd>{equipmentGradeEffect(equipmentGrade(instance.equipmentId, instance.level))}</dd>
        </div>
      </dl>
      <small>Click to select {room.code}</small>
    </aside>
  );
};
