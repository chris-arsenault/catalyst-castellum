import { DAMAGE_SOURCE_IDS } from "../identifiers";
import type { CatalystDeviceDefinition } from "./catalystTypes";
import type { CombatDefinition } from "./types";
import { bounds } from "./catalystValidationValues";

const validateDevice = (
  id: string,
  device: CatalystDeviceDefinition,
  combat: CombatDefinition,
  issues: string[]
): void => {
  if (!["weapon", "field", "discharge"].includes(device.kind)) {
    issues.push(`${id}.kind: unsupported device role`);
    return;
  }
  if (device.kind === "weapon") {
    bounds(device.chargePerHit, 0, 1e9, `${id}.chargePerHit`, issues);
    if (device.lobHeight !== undefined) bounds(device.lobHeight, 0, 1e6, `${id}.lobHeight`, issues);
    if (device.projectileRadius !== undefined)
      bounds(device.projectileRadius, 0, 10, `${id}.projectileRadius`, issues);
    return;
  }
  validateLayeredDevice(id, device, issues);
  if (device.kind === "field") {
    bounds(device.strength, 0, 10, `${id}.strength`, issues);
    bounds(device.activationSeconds, 0.1, 1000, `${id}.activationSeconds`, issues);
    if (!["attract", "repel"].includes(device.defaultMode))
      issues.push(`${id}.defaultMode: unsupported field mode`);
  } else validateDischarge(id, device, combat, issues);
};

const validateLayeredDevice = (
  id: string,
  device: Exclude<CatalystDeviceDefinition, { kind: "weapon" }>,
  issues: string[]
): void => {
  bounds(device.radius, 0.001, 1e6, `${id}.radius`, issues);
  bounds(device.targetCap, 1, 64, `${id}.targetCap`, issues);
  if (!Number.isInteger(device.targetCap)) issues.push(`${id}.targetCap: expected integer`);
  if (
    !device.eligibleLayers.length ||
    new Set(device.eligibleLayers).size !== device.eligibleLayers.length ||
    device.eligibleLayers.some((layer) => !["ground", "flying"].includes(layer))
  )
    issues.push(`${id}.eligibleLayers: expected unique supported layers`);
};

const validateDischarge = (
  id: string,
  device: Extract<CatalystDeviceDefinition, { kind: "discharge" }>,
  combat: CombatDefinition,
  issues: string[]
): void => {
  const capacity = combat.mechanics.kind === "catalyst" ? combat.mechanics.rules.chargeCapacity : 0;
  for (const key of ["seedThreshold", "secondaryThreshold", "consumeCap"] as const)
    bounds(device[key], 0.001, capacity, `${id}.${key}`, issues);
  if (device.secondaryThreshold > device.seedThreshold)
    issues.push(`${id}: secondary threshold exceeds seed threshold`);
  bounds(device.linkDistance, 0.001, 1e6, `${id}.linkDistance`, issues);
  bounds(device.damagePerCharge, 0, 1e6, `${id}.damagePerCharge`, issues);
  bounds(device.cooldownSeconds, 0.1, 1000, `${id}.cooldownSeconds`, issues);
  if (!["heat", "corrosion", "radiation", "atmosphere", "pressure"].includes(device.channel))
    issues.push(`${id}.channel: unsupported damage channel`);
  if (!DAMAGE_SOURCE_IDS.includes(device.sourceId))
    issues.push(`${id}.sourceId: unsupported damage source`);
  const policies =
    Object.values(combat.towers).find((tower) => tower.id === id)?.targetPolicies ?? [];
  if (policies.some((policy) => !["first", "strongest"].includes(policy)))
    issues.push(`${id}.targetPolicies: discharge supports first and strongest`);
};

export const validateCatalystDefinition = (combat: CombatDefinition): string[] => {
  const issues: string[] = [];
  const mechanics = combat.mechanics;
  if (mechanics.kind === "legacy") return issues;
  if (mechanics.kind !== "catalyst") return ["mechanics.kind: unsupported mechanics"];
  const rules = mechanics.rules;
  bounds(rules.chargeCapacity, 0.001, 1e9, "chargeCapacity", issues);
  bounds(rules.chargeDecayPerSecond, 0, 1e9, "chargeDecayPerSecond", issues);
  bounds(rules.chargeDecayDelaySeconds, 0, 1000, "chargeDecayDelaySeconds", issues);
  bounds(rules.movementFloor, 0.001, 1, "movementFloor", issues);
  bounds(rules.movementCeiling, 1, 10, "movementCeiling", issues);
  for (const [id, tower] of Object.entries(combat.towers)) {
    const device = mechanics.devices[tower.id];
    if (!device) issues.push(`devices.${id}: missing device role`);
    else validateDevice(id, device, combat, issues);
  }
  validateCatalogReferences(combat, issues);
  return issues;
};

const validateCatalogReferences = (combat: CombatDefinition, issues: string[]): void => {
  const mechanics = combat.mechanics;
  if (mechanics.kind !== "catalyst") return;
  for (const enemy of Object.values(combat.enemies))
    bounds(
      mechanics.susceptibility[enemy.type] ?? NaN,
      0,
      10,
      `susceptibility.${enemy.type}`,
      issues
    );
  for (const id of Object.keys(mechanics.devices))
    if (!Object.hasOwn(combat.towers, id)) issues.push(`devices.${id}: unknown chassis`);
  for (const id of Object.keys(mechanics.susceptibility))
    if (!Object.hasOwn(combat.enemies, id)) issues.push(`susceptibility.${id}: unknown enemy`);
};
