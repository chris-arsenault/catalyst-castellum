import { EQUIPMENT_DEFINITIONS, equipmentGrade } from "../../presentation/defaultGame";
import type { GameState } from "../../game/types";
import type { EquipmentHover } from "./EquipmentLayer";
import { equipmentCopy } from "../../presentation/entityCopy";
import { dutyReactionSummaries } from "../../presentation/dutyCopy";
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
      {definition.operation &&
        (() => {
          const duty =
            definition.operation.duties.find((candidate) => candidate.medium === instance.medium) ??
            definition.operation.duties[0];
          if (!duty) return null;
          return (
            <div className="equipment-tooltip-duties">
              {dutyReactionSummaries(duty, translator).map((summary) => (
                <small key={summary.reactionId}>
                  {summary.name} · {summary.effect}
                </small>
              ))}
            </div>
          );
        })()}
      <small>{translator.text("ui.map.room.select", { room: room.code })}</small>
    </aside>
  );
};
