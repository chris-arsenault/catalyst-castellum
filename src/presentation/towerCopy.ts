import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import type {
  TowerChassisId,
  TowerMountFace,
  TowerOrientation,
  TowerTargetPolicy,
  TowerUpgradeId,
} from "../game/types";

export const chassisKey = (id: TowerChassisId) => {
  switch (id) {
    case "bolt_caster":
      return "tower.chassis.bolt_caster" as const;
    case "repeater":
      return "tower.chassis.repeater" as const;
    case "line_projector":
      return "tower.chassis.line_projector" as const;
    case "mortar":
      return "tower.chassis.mortar" as const;
    case "snare_emitter":
      return "tower.chassis.snare_emitter" as const;
    case "flak_nest":
      return "tower.chassis.flak_nest" as const;
    case "relay":
      return "tower.chassis.relay" as const;
  }
};

export const roleKey = (
  role: (typeof DEFAULT_GAME_RUNTIME.definition.towers)[TowerChassisId]["role"]
) => {
  switch (role) {
    case "single_target":
      return "tower.role.single_target" as const;
    case "rapid_service":
      return "tower.role.rapid_service" as const;
    case "area":
      return "tower.role.area" as const;
    case "control":
      return "tower.role.control" as const;
    case "upper":
      return "tower.role.upper" as const;
    case "support":
      return "tower.role.support" as const;
  }
};

export const mountKey = (mount: TowerMountFace) => {
  switch (mount) {
    case "floor":
      return "tower.mount.floor" as const;
    case "left_wall":
      return "tower.mount.left_wall" as const;
    case "right_wall":
      return "tower.mount.right_wall" as const;
    case "ceiling":
      return "tower.mount.ceiling" as const;
  }
};

export const orientationKey = (orientation: TowerOrientation) => {
  switch (orientation) {
    case "left":
      return "tower.orientation.left" as const;
    case "right":
      return "tower.orientation.right" as const;
    case "up":
      return "tower.orientation.up" as const;
    case "down":
      return "tower.orientation.down" as const;
  }
};

export const policyKey = (policy: TowerTargetPolicy) => {
  switch (policy) {
    case "first":
      return "tower.policy.first" as const;
    case "last":
      return "tower.policy.last" as const;
    case "nearest":
      return "tower.policy.nearest" as const;
    case "strongest":
      return "tower.policy.strongest" as const;
    case "weakest":
      return "tower.policy.weakest" as const;
    case "armored":
      return "tower.policy.armored" as const;
    case "flying":
      return "tower.policy.flying" as const;
    case "support":
      return "tower.policy.support" as const;
  }
};

export const upgradeKey = (upgrade: TowerUpgradeId) =>
  `tower.upgrade.${upgrade}` as
    | "tower.upgrade.bolt_calibration"
    | "tower.upgrade.bolt_piercing"
    | "tower.upgrade.repeater_feed"
    | "tower.upgrade.repeater_tracking"
    | "tower.upgrade.projector_focus"
    | "tower.upgrade.projector_fan"
    | "tower.upgrade.mortar_payload"
    | "tower.upgrade.mortar_radius"
    | "tower.upgrade.snare_duration"
    | "tower.upgrade.snare_field"
    | "tower.upgrade.flak_burst"
    | "tower.upgrade.flak_ceiling"
    | "tower.upgrade.relay_range"
    | "tower.upgrade.relay_service";

export const defaultPlacement = (chassisId: TowerChassisId) => {
  const tower = DEFAULT_GAME_RUNTIME.definition.towers[chassisId];
  return {
    chassisId,
    mountFace: tower.mountFaces[0]!,
    orientation: tower.orientations[0]!,
  };
};

export const towerColorClass = (chassisId: TowerChassisId): string => `tower-color-${chassisId}`;

export const packetDamage = (chassisId: TowerChassisId): number =>
  DEFAULT_GAME_RUNTIME.definition.towers[chassisId].attack.packets.reduce(
    (total, packet) =>
      total + Object.values(packet.channels).reduce((sum, amount) => sum + amount, 0),
    0
  );

export const idleKey = (reason: "none" | "no_target" | "cooldown" | "supply") =>
  `tower.panel.idle.${reason}` as
    | "tower.panel.idle.none"
    | "tower.panel.idle.no_target"
    | "tower.panel.idle.cooldown"
    | "tower.panel.idle.supply";
