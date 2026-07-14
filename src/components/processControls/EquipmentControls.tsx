import { ChevronRight, Plus, Trash2, Wrench } from "lucide-react";
import { useCallback } from "react";
import { EQUIPMENT_DEFINITIONS } from "../../game/config";
import { commandDecision as evaluateCommand } from "../../presentation/selectors";
import { useGameStore } from "../../application/store";
import {
  type EquipmentInstance,
  type EquipmentId,
  type EquipmentSocketId,
  type GameState,
  type RoomId,
} from "../../game/types";
import { BinaryControl } from "./ActuatorControls";
import { TUTORIAL_ANCHORS, type TutorialAnchorId } from "../../tutorial/anchors";

const socketLabel = (socketId: EquipmentSocketId): string =>
  socketId === "socket_a" ? "SOCKET A" : "SOCKET B";

const equipmentToggleTutorialAnchor = (
  roomId: RoomId,
  equipmentId: EquipmentId
): TutorialAnchorId | null =>
  roomId === "furnace" && equipmentId === "gas_agitator"
    ? TUTORIAL_ANCHORS.furnaceAgitatorToggle
    : null;

const emptySocketTutorialAnchor = (game: GameState, roomId: RoomId): TutorialAnchorId | null => {
  if (roomId === "lower_intake" && game.campaign.levelId === "make_the_reagent")
    return TUTORIAL_ANCHORS.lowerIntakeMembraneCell;
  if (roomId !== "furnace") return null;
  if (game.campaign.levelId === "flash_point") return TUTORIAL_ANCHORS.furnaceAgitator;
  if (game.campaign.levelId === "acid_line") {
    const thermalInstalled = Object.values(game.rooms.furnace.equipment).some(
      (instance) => instance?.equipmentId === "thermal_coil"
    );
    return thermalInstalled
      ? TUTORIAL_ANCHORS.furnaceAgitator
      : TUTORIAL_ANCHORS.furnaceThermalCoil;
  }
  return null;
};

const EmptyEquipmentSocket = ({
  roomId,
  socketId,
}: {
  roomId: RoomId;
  socketId: EquipmentSocketId;
}) => {
  const game = useGameStore((state) => state.game);
  const openEquipmentBuild = useGameStore((state) => state.openEquipmentBuild);
  return (
    <article className="equipment-socket empty">
      <button
        className="equipment-socket-build"
        type="button"
        data-testid={`open-equipment-build-${roomId}-${socketId}`}
        data-tutorial-anchor={emptySocketTutorialAnchor(game, roomId) ?? undefined}
        onClick={() => openEquipmentBuild(roomId, socketId)}
      >
        <i>
          <Plus size={17} />
        </i>
        <span>
          <small>{socketLabel(socketId)}</small>
          <strong>Install equipment</strong>
          <em>Open build catalog</em>
        </span>
        <ChevronRight size={16} />
      </button>
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
        tutorialAnchor={equipmentToggleTutorialAnchor(roomId, instance.equipmentId)}
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
