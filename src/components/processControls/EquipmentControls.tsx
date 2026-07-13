import { Plus, Trash2, Wrench } from "lucide-react";
import { useCallback } from "react";
import { EQUIPMENT_DEFINITIONS, equipmentGrade } from "../../game/config";
import { commandDecision as evaluateCommand } from "../../presentation/selectors";
import { useGameStore } from "../../application/store";
import { equipmentGradeEffect } from "../../presentation/equipmentCopy";
import {
  EQUIPMENT_IDS,
  type EquipmentInstance,
  type EquipmentId,
  type EquipmentSocketId,
  type GameCommand,
  type GameState,
  type RoomId,
} from "../../game/types";
import { BinaryControl } from "./ActuatorControls";
import { TUTORIAL_ANCHORS } from "../../tutorial/anchors";

const socketLabel = (socketId: EquipmentSocketId): string =>
  socketId === "socket_a" ? "SOCKET A" : "SOCKET B";

const installCommand = (
  roomId: RoomId,
  socketId: EquipmentSocketId,
  equipmentId: EquipmentId
): Extract<GameCommand, { type: "install_equipment" }> => ({
  type: "install_equipment",
  roomId,
  socketId,
  equipmentId,
});

const equipmentVisibleForSocket = (
  game: GameState,
  roomId: RoomId,
  socketId: EquipmentSocketId,
  equipmentId: EquipmentId
): boolean => {
  const decision = evaluateCommand(game, installCommand(roomId, socketId, equipmentId));
  return (
    decision.allowed || decision.code === "insufficient_matter" || decision.code === "capacity"
  );
};

const EquipmentChoice = ({
  equipmentId,
  roomId,
  socketId,
}: {
  equipmentId: EquipmentId;
  roomId: RoomId;
  socketId: EquipmentSocketId;
}) => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const definition = EQUIPMENT_DEFINITIONS[equipmentId];
  const command = installCommand(roomId, socketId, equipmentId);
  const decision = evaluateCommand(game, command);
  const install = useCallback(
    () => dispatch({ type: "install_equipment", roomId, socketId, equipmentId }),
    [dispatch, equipmentId, roomId, socketId]
  );
  return (
    <button
      type="button"
      disabled={!decision.allowed}
      title={decision.reason ?? undefined}
      data-testid={`install-${roomId}-${socketId}-${equipmentId}`}
      data-tutorial-anchor={
        roomId === "furnace" && equipmentId === "gas_agitator"
          ? TUTORIAL_ANCHORS.furnaceAgitator
          : undefined
      }
      onClick={install}
    >
      <Plus size={13} />
      <span>{definition.name}</span>
      <strong>{definition.buildCost} M</strong>
    </button>
  );
};

const EmptyEquipmentSocket = ({
  roomId,
  socketId,
}: {
  roomId: RoomId;
  socketId: EquipmentSocketId;
}) => {
  const game = useGameStore((state) => state.game);
  const available = EQUIPMENT_IDS.filter((equipmentId) =>
    equipmentVisibleForSocket(game, roomId, socketId, equipmentId)
  );
  return (
    <article className="equipment-socket empty">
      <header>
        <span>{socketLabel(socketId)}</span>
        <strong>Open equipment socket</strong>
      </header>
      <div className="equipment-picker">
        {available.map((equipmentId) => (
          <EquipmentChoice
            key={equipmentId}
            equipmentId={equipmentId}
            roomId={roomId}
            socketId={socketId}
          />
        ))}
      </div>
    </article>
  );
};

const EquipmentActions = ({
  instance,
  roomId,
  socketId,
}: {
  instance: EquipmentInstance;
  roomId: RoomId;
  socketId: EquipmentSocketId;
}) => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const definition = EQUIPMENT_DEFINITIONS[instance.equipmentId];
  const toggleCommand = {
    type: "toggle_equipment",
    roomId,
    socketId,
    enabled: !instance.enabled,
  } as const;
  const upgradeCommand = { type: "upgrade_equipment", roomId, socketId } as const;
  const dismantleCommand = { type: "dismantle_equipment", roomId, socketId } as const;
  const toggleDecision = evaluateCommand(game, toggleCommand);
  const upgradeDecision = evaluateCommand(game, upgradeCommand);
  const dismantleDecision = evaluateCommand(game, dismantleCommand);
  const toggle = useCallback(
    () =>
      dispatch({
        type: "toggle_equipment",
        roomId,
        socketId,
        enabled: !instance.enabled,
      }),
    [dispatch, instance.enabled, roomId, socketId]
  );
  const upgrade = useCallback(
    () => dispatch({ type: "upgrade_equipment", roomId, socketId }),
    [dispatch, roomId, socketId]
  );
  const dismantle = useCallback(
    () => dispatch({ type: "dismantle_equipment", roomId, socketId }),
    [dispatch, roomId, socketId]
  );
  const upgradeLabel = instance.level >= 3 ? "MAX" : `UPGRADE · ${upgradeDecision.cost} M`;
  return (
    <div className="equipment-actions">
      <BinaryControl
        active={instance.enabled}
        activeLabel="ON"
        disabled={!toggleDecision.allowed}
        inactiveLabel="OFF"
        testId={`equipment-toggle-${roomId}-${socketId}`}
        tutorialAnchor={null}
        onClick={toggle}
      />
      <button
        type="button"
        disabled={!upgradeDecision.allowed}
        title={upgradeDecision.reason ?? undefined}
        data-testid={`equipment-upgrade-${roomId}-${socketId}`}
        onClick={upgrade}
      >
        <Wrench size={13} /> {upgradeLabel}
      </button>
      <button
        type="button"
        disabled={!dismantleDecision.allowed}
        title={dismantleDecision.reason ?? undefined}
        aria-label={`Dismantle ${definition.name}`}
        onClick={dismantle}
      >
        <Trash2 size={13} /> +{dismantleDecision.refund} M
      </button>
    </div>
  );
};

const InstalledEquipmentSocket = ({
  instance,
  roomId,
  socketId,
}: {
  instance: EquipmentInstance;
  roomId: RoomId;
  socketId: EquipmentSocketId;
}) => {
  const definition = EQUIPMENT_DEFINITIONS[instance.equipmentId];
  const grade = equipmentGrade(instance.equipmentId, instance.level);
  return (
    <article
      className={`equipment-socket installed ${instance.enabled ? "active" : "offline"}`}
      style={{ "--equipment-accent": definition.accent }}
    >
      <header>
        <span>{socketLabel(socketId)}</span>
        <strong>
          {definition.name} · Grade {instance.level}
        </strong>
        <em>{instance.enabled ? "RUNNING" : "OFFLINE"}</em>
      </header>
      <p>{definition.description}</p>
      <div className="equipment-rating">
        <span>{equipmentGradeEffect(grade)}</span>
        <small>{grade.occupiedVolume} room volume</small>
      </div>
      <EquipmentActions instance={instance} roomId={roomId} socketId={socketId} />
    </article>
  );
};

export const EquipmentSocket = ({
  roomId,
  socketId,
}: {
  roomId: RoomId;
  socketId: EquipmentSocketId;
}) => {
  const game = useGameStore((state) => state.game);
  const instance = game.rooms[roomId].equipment[socketId];
  if (!instance) return <EmptyEquipmentSocket roomId={roomId} socketId={socketId} />;
  return <InstalledEquipmentSocket instance={instance} roomId={roomId} socketId={socketId} />;
};
