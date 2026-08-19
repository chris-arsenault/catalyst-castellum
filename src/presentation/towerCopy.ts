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
    case "flash_chamber":
      return "tower.chassis.flash_chamber" as const;
    case "caustic_jet":
      return "tower.chassis.caustic_jet" as const;
    case "carbon_burner":
      return "tower.chassis.carbon_burner" as const;
    case "acid_pot":
      return "tower.chassis.acid_pot" as const;
    case "quench_coil":
      return "tower.chassis.quench_coil" as const;
    case "wash_head":
      return "tower.chassis.wash_head" as const;
    case "carbonyl_marker":
      return "tower.chassis.carbonyl_marker" as const;
  }
};

export const chassisProcessKey = (id: TowerChassisId) =>
  `tower.chassis.${id}.process` as
    | "tower.chassis.flash_chamber.process"
    | "tower.chassis.caustic_jet.process"
    | "tower.chassis.carbon_burner.process"
    | "tower.chassis.acid_pot.process"
    | "tower.chassis.quench_coil.process"
    | "tower.chassis.wash_head.process"
    | "tower.chassis.carbonyl_marker.process";

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
    | "tower.upgrade.flash_calibration"
    | "tower.upgrade.flash_breach"
    | "tower.upgrade.caustic_manifold"
    | "tower.upgrade.caustic_split"
    | "tower.upgrade.burner_focus"
    | "tower.upgrade.burner_fan"
    | "tower.upgrade.acid_charge"
    | "tower.upgrade.acid_spread"
    | "tower.upgrade.quench_duration"
    | "tower.upgrade.quench_field"
    | "tower.upgrade.wash_burst"
    | "tower.upgrade.wash_column"
    | "tower.upgrade.marker_range"
    | "tower.upgrade.marker_service";

const PREFERRED_MOUNT_ORIENTATION: Record<TowerMountFace, TowerOrientation> = {
  floor: "right",
  left_wall: "right",
  right_wall: "left",
  ceiling: "down",
};

export const preferredOrientationForMount = (
  orientations: readonly TowerOrientation[],
  mountFace: TowerMountFace
): TowerOrientation => {
  const preferred = PREFERRED_MOUNT_ORIENTATION[mountFace];
  return orientations.includes(preferred) ? preferred : orientations[0]!;
};

export const defaultOrientationForMount = (
  chassisId: TowerChassisId,
  mountFace: TowerMountFace
): TowerOrientation => {
  const orientations = DEFAULT_GAME_RUNTIME.definition.towers[chassisId].orientations;
  return preferredOrientationForMount(orientations, mountFace);
};

export const defaultPlacement = (chassisId: TowerChassisId) => {
  const tower = DEFAULT_GAME_RUNTIME.definition.towers[chassisId];
  const mountFace = tower.mountFaces[0]!;
  return {
    chassisId,
    mountFace,
    orientation: defaultOrientationForMount(chassisId, mountFace),
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
