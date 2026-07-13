import { Plus, Trash2, Wrench } from "lucide-react";
import { useCallback } from "react";
import {
  EQUIPMENT_DEFINITIONS,
  ROOM_DEFINITIONS,
  equipmentGrade,
  roomRing,
} from "../../game/config";
import { equipmentDismantleRefund } from "../../game/simulation";
import { useGameStore } from "../../game/store";
import {
  EQUIPMENT_IDS,
  type EquipmentId,
  type EquipmentInstance,
  type EquipmentSocketId,
  type RoomId,
} from "../../game/types";
import { BinaryControl } from "./ActuatorControls";

const socketLabel = (socketId: EquipmentSocketId): string =>
  socketId === "socket_a" ? "SOCKET A" : "SOCKET B";

const availableEquipment = (roomId: RoomId, unlocked: EquipmentId[]): EquipmentId[] => {
  const room = ROOM_DEFINITIONS[roomId];
  return EQUIPMENT_IDS.filter((equipmentId) => {
    const definition = EQUIPMENT_DEFINITIONS[equipmentId];
    const featureAvailable =
      !definition.requiredFeature || room.features.includes(definition.requiredFeature);
    return (
      unlocked.includes(equipmentId) &&
      definition.allowedRings.includes(roomRing(roomId)) &&
      featureAvailable
    );
  });
};

const EquipmentChoice = ({
  equipmentId,
  planning,
  roomId,
  socketId,
}: {
  equipmentId: EquipmentId;
  planning: boolean;
  roomId: RoomId;
  socketId: EquipmentSocketId;
}) => {
  const matter = useGameStore((state) => state.game.matter);
  const dispatch = useGameStore((state) => state.dispatch);
  const definition = EQUIPMENT_DEFINITIONS[equipmentId];
  const install = useCallback(
    () => dispatch({ type: "install_equipment", roomId, socketId, equipmentId }),
    [dispatch, equipmentId, roomId, socketId]
  );
  return (
    <button
      type="button"
      disabled={!planning || matter < definition.buildCost}
      data-testid={`install-${roomId}-${socketId}-${equipmentId}`}
      onClick={install}
    >
      <Plus size={13} />
      <span>{definition.name}</span>
      <strong>{definition.buildCost} M</strong>
    </button>
  );
};

const EmptyEquipmentSocket = ({
  planning,
  roomId,
  socketId,
}: {
  planning: boolean;
  roomId: RoomId;
  socketId: EquipmentSocketId;
}) => {
  const unlocked = useGameStore((state) => state.game.availability.equipment);
  return (
    <article className="equipment-socket empty">
      <header>
        <span>{socketLabel(socketId)}</span>
        <strong>Empty generic socket</strong>
      </header>
      <div className="equipment-picker">
        {availableEquipment(roomId, unlocked).map((equipmentId) => (
          <EquipmentChoice
            key={equipmentId}
            equipmentId={equipmentId}
            planning={planning}
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
  operatingUnlocked,
  planning,
  roomId,
  socketId,
}: {
  instance: EquipmentInstance;
  operatingUnlocked: boolean;
  planning: boolean;
  roomId: RoomId;
  socketId: EquipmentSocketId;
}) => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const definition = EQUIPMENT_DEFINITIONS[instance.equipmentId];
  const upgradeCost = instance.level < 3 ? definition.upgradeCosts[instance.level - 1] : null;
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
  const upgradeLabel = upgradeCost === null ? "MAX" : `UPGRADE · ${upgradeCost} M`;
  return (
    <div className="equipment-actions">
      <BinaryControl
        active={instance.enabled}
        activeLabel="ON"
        disabled={!operatingUnlocked}
        inactiveLabel="OFF"
        testId={`equipment-toggle-${roomId}-${socketId}`}
        onClick={toggle}
      />
      <button
        type="button"
        disabled={!planning || upgradeCost === null || game.matter < (upgradeCost ?? 0)}
        data-testid={`equipment-upgrade-${roomId}-${socketId}`}
        onClick={upgrade}
      >
        <Wrench size={13} /> {upgradeLabel}
      </button>
      <button
        type="button"
        disabled={!planning}
        aria-label={`Dismantle ${definition.name}`}
        onClick={dismantle}
      >
        <Trash2 size={13} /> +{equipmentDismantleRefund(instance)} M
      </button>
    </div>
  );
};

const InstalledEquipmentSocket = ({
  instance,
  operatingUnlocked,
  planning,
  roomId,
  socketId,
}: {
  instance: EquipmentInstance;
  operatingUnlocked: boolean;
  planning: boolean;
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
        <span>{grade.effect}</span>
        <small>{grade.occupiedVolume} room volume</small>
      </div>
      <EquipmentActions
        instance={instance}
        operatingUnlocked={operatingUnlocked}
        planning={planning}
        roomId={roomId}
        socketId={socketId}
      />
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
  const planning = game.phase === "build";
  const operatingUnlocked = planning || game.phase === "prime";
  if (!instance)
    return <EmptyEquipmentSocket planning={planning} roomId={roomId} socketId={socketId} />;
  return (
    <InstalledEquipmentSocket
      instance={instance}
      operatingUnlocked={operatingUnlocked}
      planning={planning}
      roomId={roomId}
      socketId={socketId}
    />
  );
};
