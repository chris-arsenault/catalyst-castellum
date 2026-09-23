import type { GamePackSource } from "../definitionTypes";
import {
  DAMAGE_SOURCE_IDS,
  CONTROL_EFFECT_KINDS,
  TOWER_ATTACK_STRATEGIES,
  TOWER_UPGRADE_IDS,
  TOWER_MOUNT_FACES,
  TOWER_ORIENTATIONS,
  TOWER_TARGET_POLICIES,
  GAS_TYPES,
  LIQUID_TYPES,
} from "../identifiers";
import type { TowerChassisId, TowerDefinition } from "../types";
import type { EnemyAuthoringIssue } from "./enemyValidation";

type Issues = EnemyAuthoringIssue[];

interface TowerAuthoringSource {
  towers: Readonly<Partial<GamePackSource["towers"]>>;
  species: Readonly<Partial<GamePackSource["species"]>> | null;
  passiveTowers?: readonly TowerChassisId[];
}

// Leave numerical headroom for supply, vulnerability, and accumulated encounter telemetry.
const MAX_AUTHORED_ATTACK_DAMAGE = 1_000_000_000;

const bounded = (value: number, min: number, max: number, path: string, issues: Issues): void => {
  if (!Number.isFinite(value) || value < min || value > max)
    issues.push({ path, message: `Value must be finite and between ${min} and ${max}.` });
};

const positive = (value: number, path: string, issues: Issues): void => {
  if (!Number.isFinite(value) || value <= 0)
    issues.push({ path, message: "Value must be finite and positive." });
};

const integer = (value: number, path: string, issues: Issues): void => {
  if (!Number.isInteger(value)) issues.push({ path, message: "Value must be an integer." });
};

const choices = (
  values: readonly string[],
  allowed: readonly string[],
  path: string,
  issues: Issues
): void => {
  if (
    !values.length ||
    new Set(values).size !== values.length ||
    values.some((v) => !allowed.includes(v))
  )
    issues.push({ path, message: "Choose a nonempty list of unique supported values." });
};

const validateNumbers = (tower: TowerDefinition, path: string, issues: Issues): void => {
  positive(tower.buildCost, `${path}.buildCost`, issues);
  bounded(tower.recoveryRatio, 0, 1, `${path}.recoveryRatio`, issues);
  for (const [dimension, value] of Object.entries(tower.footprint)) {
    positive(value, `${path}.footprint.${dimension}`, issues);
    integer(value, `${path}.footprint.${dimension}`, issues);
  }
  positive(tower.range, `${path}.range`, issues);
  bounded(tower.minimumRange, 0, tower.range, `${path}.minimumRange`, issues);
  positive(tower.firingArc, `${path}.firingArc`, issues);
  bounded(tower.firingArc, 0, 360, `${path}.firingArc`, issues);
  positive(tower.cadence, `${path}.cadence`, issues);
  bounded(tower.cadence, 0, 10, `${path}.cadence`, issues);
  positive(tower.targetCap, `${path}.targetCap`, issues);
  integer(tower.targetCap, `${path}.targetCap`, issues);
};

const validateAttack = (
  tower: TowerDefinition,
  path: string,
  issues: Issues,
  passive: boolean
): void => {
  choices([tower.attack.strategy], TOWER_ATTACK_STRATEGIES, `${path}.strategy`, issues);
  bounded(tower.attack.projectileSpeed, 0, Number.MAX_VALUE, `${path}.projectileSpeed`, issues);
  bounded(tower.attack.radius, 0, Number.MAX_VALUE, `${path}.radius`, issues);
  if (!passive && !tower.attack.packets.length)
    issues.push({ path: `${path}.packets`, message: "Tower requires at least one damage packet." });
  tower.attack.packets.forEach((packet, index) => {
    if (!DAMAGE_SOURCE_IDS.includes(packet.sourceId))
      issues.push({ path: `${path}.packets.${index}.sourceId`, message: "Unknown damage source." });
    for (const channel of ["atmosphere", "corrosion", "heat", "pressure", "radiation"] as const)
      bounded(
        packet.channels[channel],
        0,
        Number.MAX_VALUE,
        `${path}.packets.${index}.${channel}`,
        issues
      );
  });
  tower.attack.controlEffects.forEach((effect, index) => {
    choices([effect.kind], CONTROL_EFFECT_KINDS, `${path}.controlEffects.${index}.kind`, issues);
    choices(
      [effect.stacking],
      ["strongest", "additive"],
      `${path}.controlEffects.${index}.stacking`,
      issues
    );
    choices(
      [effect.refresh],
      ["replace", "extend"],
      `${path}.controlEffects.${index}.refresh`,
      issues
    );
    bounded(
      effect.magnitude,
      0,
      Number.MAX_VALUE,
      `${path}.controlEffects.${index}.magnitude`,
      issues
    );
    positive(effect.duration, `${path}.controlEffects.${index}.duration`, issues);
    bounded(effect.floor, 0, 1, `${path}.controlEffects.${index}.floor`, issues);
  });
};

const validateUpgradeGraph = (tower: TowerDefinition, path: string, issues: Issues): void => {
  const upgrades = new Map(tower.upgrades.map((upgrade) => [upgrade.id, upgrade]));
  if (upgrades.size !== tower.upgrades.length)
    issues.push({ path, message: "Tower upgrade identifiers must be unique." });
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visiting.has(id)) {
      issues.push({ path, message: "Upgrade prerequisites contain a cycle." });
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    tower.upgrades.find((upgrade) => upgrade.id === id)?.requires.forEach(visit);
    visiting.delete(id);
    visited.add(id);
  };
  tower.upgrades.forEach((upgrade) => {
    if (upgrade.requires.some((id) => !upgrades.has(id)))
      issues.push({ path, message: "Upgrade prerequisite is not in this tree." });
    visit(upgrade.id);
  });
};

const validateUpgrades = (
  tower: TowerDefinition,
  path: string,
  owners: Map<string, string>,
  issues: Issues
): void => {
  tower.upgrades.forEach((upgrade, index) => {
    const upgradePath = `${path}.${index}`;
    choices([upgrade.id], TOWER_UPGRADE_IDS, `${upgradePath}.id`, issues);
    choices([upgrade.supplyMode], ["unchanged", "enabled"], `${upgradePath}.supplyMode`, issues);
    const owner = owners.get(upgrade.id);
    if (owner && owner !== tower.id)
      issues.push({ path: upgradePath, message: `Upgrade is already owned by ${owner}.` });
    owners.set(upgrade.id, tower.id);
    for (const key of ["cost", "damageMultiplier", "cadenceMultiplier"] as const)
      positive(upgrade[key], `${upgradePath}.${key}`, issues);
    for (const key of ["rangeDelta", "targetCapDelta", "arcDelta"] as const)
      bounded(upgrade[key], -Number.MAX_VALUE, Number.MAX_VALUE, `${upgradePath}.${key}`, issues);
    integer(upgrade.targetCapDelta, `${upgradePath}.targetCapDelta`, issues);
  });
  validateUpgradeGraph(tower, path, issues);
  validateEffectiveBounds(tower, path, issues);
};

// Bound every partial purchase set, including future trees with independent branches.
const validateEffectiveBounds = (tower: TowerDefinition, path: string, issues: Issues): void => {
  const cadence = tower.upgrades.reduce(
    (value, u) => value * Math.max(1, u.cadenceMultiplier),
    tower.cadence
  );
  bounded(cadence, 0, 10, `${path}.effectiveCadence`, issues);
  const minimumCadence = tower.upgrades.reduce(
    (value, u) => value * Math.min(1, u.cadenceMultiplier),
    tower.cadence
  );
  positive(1 / minimumCadence, `${path}.maximumCooldown`, issues);
  const damage = tower.upgrades.reduce((value, u) => value * Math.max(1, u.damageMultiplier), 1);
  positive(damage, `${path}.effectiveDamageMultiplier`, issues);
  const packetDamage = tower.attack.packets.reduce(
    (total, packet) =>
      total + Object.values(packet.channels).reduce((sum, value) => sum + value, 0),
    0
  );
  bounded(packetDamage * damage, 0, MAX_AUTHORED_ATTACK_DAMAGE, `${path}.effectiveDamage`, issues);
  for (const [base, key] of [
    [tower.range, "rangeDelta"],
    [tower.firingArc, "arcDelta"],
    [tower.targetCap, "targetCapDelta"],
  ] as const) {
    const lower = tower.upgrades.reduce((value, u) => value + Math.min(0, u[key]), base);
    const upper = tower.upgrades.reduce((value, u) => value + Math.max(0, u[key]), base);
    positive(lower, `${path}.${key}.minimum`, issues);
    bounded(upper, 0, Number.MAX_VALUE, `${path}.${key}.maximum`, issues);
    if (key === "rangeDelta" && lower < tower.minimumRange)
      issues.push({ path, message: "Upgrades must preserve minimum range." });
    if (key === "arcDelta") bounded(upper, 0, 360, `${path}.effectiveArc`, issues);
  }
};

const validateSupply = (
  source: TowerAuthoringSource,
  tower: TowerDefinition,
  path: string,
  issues: Issues
): void => {
  const supply = tower.supply;
  if (!supply) return;
  choices([supply.port], ["gas", "liquid"], `${path}.port`, issues);
  choices(
    [supply.insufficientFlow],
    ["pause", "reduced_cadence", "direct_mode"],
    `${path}.insufficientFlow`,
    issues
  );
  const species = source.species;
  const phaseSpecies = supply.port === "gas" ? GAS_TYPES : LIQUID_TYPES;
  const allowed = species ? Object.keys(species) : phaseSpecies;
  choices(supply.acceptedSpecies, allowed, `${path}.acceptedSpecies`, issues);
  if (species && supply.acceptedSpecies.some((id) => species[id]?.phase !== supply.port))
    issues.push({ path, message: "Supply species must match the authored port phase." });
  positive(supply.rate, `${path}.rate`, issues);
  positive(supply.localCapacity, `${path}.localCapacity`, issues);
};

export const validateTowerDefinitions = (source: TowerAuthoringSource): Issues => {
  const issues: Issues = [];
  const owners = new Map<string, string>();
  for (const [id, tower] of Object.entries(source.towers)) {
    const path = `towers.${id}`;
    if (id !== tower.id)
      issues.push({ path, message: "Tower identity must match its record key." });
    validateNumbers(tower, path, issues);
    choices(tower.mountFaces, TOWER_MOUNT_FACES, `${path}.mountFaces`, issues);
    choices(tower.orientations, TOWER_ORIENTATIONS, `${path}.orientations`, issues);
    choices(tower.targetPolicies, TOWER_TARGET_POLICIES, `${path}.targetPolicies`, issues);
    choices(tower.eligibleLayers, ["ground", "flying"], `${path}.eligibleLayers`, issues);
    validateAttack(
      tower,
      `${path}.attack`,
      issues,
      source.passiveTowers?.includes(tower.id) ?? false
    );
    validateUpgrades(tower, `${path}.upgrades`, owners, issues);
    validateSupply(source, tower, `${path}.supply`, issues);
  }
  return issues;
};
