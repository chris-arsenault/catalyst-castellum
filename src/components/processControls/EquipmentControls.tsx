import { ChevronRight, Plus, Trash2, Wrench } from "lucide-react";
import { useCallback } from "react";
import { EQUIPMENT_DEFINITIONS } from "../../presentation/defaultGame";
import { useGameStore } from "../../application/store";
import { useGamePresentation } from "../../application/presentationContext";
import type { Translator } from "../../localization/translator";
import {
  type EquipmentInstance,
  type EquipmentId,
  type EquipmentSocketId,
  type GameState,
  type RoomId,
} from "../../game/types";
import { BinaryControl } from "./ActuatorControls";
import { TUTORIAL_ANCHORS, type TutorialAnchorId } from "../../tutorial/anchors";
import { equipmentCopy } from "../../presentation/entityCopy";
import { roomState } from "../../game/world/instances";

const socketLabel = (socketId: EquipmentSocketId, translator: Translator): string =>
  translator.text(socketId === "socket_a" ? "ui.process.socket.a" : "ui.process.socket.b");

const equipmentToggleTutorialAnchor = (
  roomId: RoomId,
  equipmentId: EquipmentId
): TutorialAnchorId | null => {
  if (equipmentId !== "gas_agitator") return null;
  if (roomId === "furnace") return TUTORIAL_ANCHORS.furnaceAgitatorToggle;
  if (roomId === "gallery") return TUTORIAL_ANCHORS.galleryAgitatorToggle;
  return null;
};

const equipmentUpgradeTutorialAnchor = (
  roomId: RoomId,
  equipmentId: EquipmentId
): TutorialAnchorId | null =>
  roomId === "furnace" && equipmentId === "gas_agitator"
    ? TUTORIAL_ANCHORS.furnaceAgitatorUpgrade
    : null;

const emptySocketTutorialAnchor = (game: GameState, roomId: RoomId): TutorialAnchorId | null => {
  if (roomId === "lower_intake" && game.campaign.levelId === "make_the_reagent")
    return TUTORIAL_ANCHORS.lowerIntakeMembraneCell;
  if (roomId === "gallery" && game.campaign.levelId === "flash_point")
    return TUTORIAL_ANCHORS.galleryAgitator;
  if (roomId !== "furnace") return null;
  if (game.campaign.levelId === "flash_point") return TUTORIAL_ANCHORS.furnaceAgitator;
  if (game.campaign.levelId === "acid_line") {
    const thermalInstalled = Object.values(roomState(game, "furnace").equipment).some(
      (instance) => instance?.equipmentId === "thermal_coil"
    );
    return thermalInstalled
      ? TUTORIAL_ANCHORS.furnaceAgitator
      : TUTORIAL_ANCHORS.furnaceThermalCoil;
  }
  return null;
};

const equipmentActionCommands = (
  instance: EquipmentInstance,
  roomId: RoomId,
  socketId: EquipmentSocketId
) => ({
  toggle: {
    type: "toggle_equipment",
    roomId,
    socketId,
    enabled: !instance.enabled,
  } as const,
  upgrade: { type: "upgrade_equipment", roomId, socketId } as const,
  dismantle: { type: "dismantle_equipment", roomId, socketId } as const,
});

const EmptyEquipmentSocket = ({
  roomId,
  socketId,
}: {
  roomId: RoomId;
  socketId: EquipmentSocketId;
}) => {
  const { translator } = useGamePresentation();
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
          <small>{socketLabel(socketId, translator)}</small>
          <strong>{translator.text("ui.process.install")}</strong>
          <em>{translator.text("ui.process.openCatalog")}</em>
        </span>
        <ChevronRight size={16} />
      </button>
    </article>
  );
};

const UpgradeButton = ({
  disabled,
  label,
  onUpgrade,
  roomId,
  socketId,
  title,
  tutorialAnchor,
}: {
  disabled: boolean;
  label: string;
  onUpgrade: () => void;
  roomId: RoomId;
  socketId: EquipmentSocketId;
  title: string | undefined;
  tutorialAnchor: TutorialAnchorId | null;
}) => (
  <button
    type="button"
    disabled={disabled}
    title={title}
    data-testid={`equipment-upgrade-${roomId}-${socketId}`}
    data-tutorial-anchor={tutorialAnchor ?? undefined}
    onClick={onUpgrade}
  >
    <Wrench size={13} /> {label}
  </button>
);

const EquipmentActions = ({
  instance,
  roomId,
  socketId,
}: {
  instance: EquipmentInstance;
  roomId: RoomId;
  socketId: EquipmentSocketId;
}) => {
  const { commandCopy, selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const definition = EQUIPMENT_DEFINITIONS[instance.equipmentId];
  const commands = equipmentActionCommands(instance, roomId, socketId);
  const toggleDecision = selectors.commandDecision(game, commands.toggle);
  const upgradeDecision = selectors.commandDecision(game, commands.upgrade);
  const dismantleDecision = selectors.commandDecision(game, commands.dismantle);
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
  const upgradeLabel =
    instance.level >= 3
      ? translator.text("ui.process.max")
      : translator.text("ui.process.upgrade", { cost: upgradeDecision.cost });
  return (
    <div className="equipment-actions">
      <BinaryControl
        active={instance.enabled}
        activeLabel={translator.text("ui.process.on")}
        disabled={!toggleDecision.allowed}
        inactiveLabel={translator.text("ui.process.off")}
        testId={`equipment-toggle-${roomId}-${socketId}`}
        tutorialAnchor={equipmentToggleTutorialAnchor(roomId, instance.equipmentId)}
        onClick={toggle}
      />
      <UpgradeButton
        disabled={!upgradeDecision.allowed}
        label={upgradeLabel}
        onUpgrade={upgrade}
        roomId={roomId}
        socketId={socketId}
        title={commandCopy(upgradeDecision) ?? undefined}
        tutorialAnchor={equipmentUpgradeTutorialAnchor(roomId, instance.equipmentId)}
      />
      <button
        type="button"
        disabled={!dismantleDecision.allowed}
        title={commandCopy(dismantleDecision) ?? undefined}
        aria-label={translator.text("ui.process.dismantle", {
          name: equipmentCopy(definition, translator).name,
        })}
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
  const { translator } = useGamePresentation();
  const definition = EQUIPMENT_DEFINITIONS[instance.equipmentId];
  return (
    <article
      className={`equipment-socket installed ${instance.enabled ? "active" : "offline"}`}
      style={{ "--equipment-accent": definition.accent }}
    >
      <header>
        <span>{socketLabel(socketId, translator)}</span>
        <strong>
          {translator.text("ui.process.grade", {
            name: equipmentCopy(definition, translator).name,
            grade: instance.level,
          })}
        </strong>
        <em>{translator.text(instance.enabled ? "ui.process.running" : "ui.process.offline")}</em>
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
  const instance = roomState(game, roomId).equipment[socketId];
  if (!instance) return <EmptyEquipmentSocket roomId={roomId} socketId={socketId} />;
  return <InstalledEquipmentSocket instance={instance} roomId={roomId} socketId={socketId} />;
};
