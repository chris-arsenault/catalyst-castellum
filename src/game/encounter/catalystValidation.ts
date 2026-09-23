import type {
  CatalystDeviceDefinition,
  ChargeAccount,
  EnemyChargeState,
  CatalystPulse,
} from "./catalystTypes";
import type { EncounterContext, EncounterState } from "./types";
import { close, total, bounds } from "./catalystValidationValues";
export { validateCatalystDefinition } from "./catalystDefinitionValidation";

const validateAccount = (
  account: ChargeAccount,
  stored: number,
  path: string,
  issues: string[]
): void => {
  for (const [key, value] of Object.entries(account))
    bounds(value, 0, Number.MAX_VALUE, `${path}.${key}`, issues);
  if (!close(account.input, account.accepted + account.overflow))
    issues.push(`${path}: input differs from accepted plus overflow`);
  const output =
    stored + account.decay + account.consumed + account.death + account.breach + account.cleanup;
  if (!close(account.accepted, output))
    issues.push(`${path}: accepted charge differs from stored charge plus recorded outcomes`);
};

const validateLedger = (
  state: EncounterState,
  ledger: EnemyChargeState,
  context: EncounterContext,
  issues: string[]
): void => {
  if (context.combat.mechanics.kind !== "catalyst") return;
  bounds(
    ledger.amount,
    0,
    context.combat.mechanics.rules.chargeCapacity,
    `charge.${ledger.enemyId}`,
    issues
  );
  if (!state.enemies.some((enemy) => enemy.id === ledger.enemyId))
    issues.push(`charge.${ledger.enemyId}: enemy is missing`);
  if (!close(ledger.amount, total(ledger.contributions)))
    issues.push(`charge.${ledger.enemyId}: contribution sum differs from stored charge`);
  for (const [sourceId, amount] of Object.entries(ledger.contributions)) {
    if (!state.catalyst!.sources[sourceId])
      issues.push(`charge.${ledger.enemyId}: source ${sourceId} is missing`);
    bounds(
      amount,
      0,
      context.combat.mechanics.rules.chargeCapacity,
      `charge.${ledger.enemyId}.${sourceId}`,
      issues
    );
  }
  validateLedgerTicks(state.tick, ledger, issues);
};

const validateLedgerTicks = (tick: number, ledger: EnemyChargeState, issues: string[]): void => {
  for (const key of ["lastInputTick", "lastDischargeTick"] as const)
    if (
      !Number.isSafeInteger(ledger[key]) ||
      ledger[key] < (key === "lastInputTick" ? 0 : -1) ||
      ledger[key] > tick
    )
      issues.push(`charge.${ledger.enemyId}.${key}: invalid tick`);
};

const validateSources = (
  state: EncounterState,
  context: EncounterContext,
  issues: string[]
): void => {
  const catalyst = state.catalyst!;
  for (const [id, source] of Object.entries(catalyst.sources)) {
    if (source.id !== id || source.towerId !== id || !context.combat.towers[source.chassisId])
      issues.push(`sources.${id}: invalid installation identity`);
    if (!catalyst.directBySource[id]) issues.push(`sources.${id}: missing direct damage account`);
    const account = catalyst.accountingBySource[id];
    if (!account) {
      issues.push(`sources.${id}: missing charge account`);
      continue;
    }
    const stored = Object.values(catalyst.chargeByEnemy).reduce(
      (sum, ledger) => sum + (ledger.contributions[id] ?? 0),
      0
    );
    validateAccount(account, stored, `accountingBySource.${id}`, issues);
  }
  for (const id of [
    ...Object.keys(catalyst.accountingBySource),
    ...Object.keys(catalyst.directBySource),
    ...Object.keys(catalyst.damageByDevice),
    ...Object.keys(catalyst.fieldByDevice),
  ])
    if (!catalyst.sources[id]) issues.push(`accounting.${id}: missing source identity`);
  validateLiveSources(state, issues);
  validateSourceRoles(state, context, issues);
  validateSourceSequences(state, context, issues);
};

const validateSourceSequences = (
  state: EncounterState,
  context: EncounterContext,
  issues: string[]
): void => {
  const prefix = `tower:${context.definition.instanceNamespace}:`;
  for (const id of Object.keys(state.catalyst!.sources)) {
    if (!id.startsWith(prefix)) continue;
    const sequence = Number(id.slice(prefix.length));
    if (!Number.isSafeInteger(sequence) || sequence < 0 || sequence >= state.nextTowerSequence)
      issues.push(`sources.${id}: historical installation sequence is not below nextTowerSequence`);
  }
};

const validateSourceRoles = (
  state: EncounterState,
  context: EncounterContext,
  issues: string[]
): void => {
  const mechanics = context.combat.mechanics;
  if (mechanics.kind !== "catalyst") return;
  const catalyst = state.catalyst!;
  for (const [id, source] of Object.entries(catalyst.sources)) {
    const role = mechanics.devices[source.chassisId]?.kind;
    if (role !== "weapon" && (catalyst.accountingBySource[id]?.input ?? 0) > 0)
      issues.push(`sources.${id}: support device produced charge`);
    if (role !== "discharge" && catalyst.damageByDevice[id])
      issues.push(`sources.${id}: discharge account belongs to another role`);
  }
};

const validateLiveSources = (state: EncounterState, issues: string[]): void => {
  for (const tower of Object.values(state.towers)) {
    const source = state.catalyst!.sources[tower.id];
    if (!source) issues.push(`devices.${tower.id}: missing installation source`);
    else if (tower.chassisId !== source.chassisId)
      issues.push(`sources.${tower.id}: live installation differs from source snapshot`);
  }
};

const validateDevices = (
  state: EncounterState,
  context: EncounterContext,
  issues: string[]
): void => {
  if (context.combat.mechanics.kind !== "catalyst") return;
  for (const [id, status] of Object.entries(state.catalyst!.devices)) {
    const tower = state.towers[id];
    const device = tower ? context.combat.mechanics.devices[tower.chassisId] : null;
    if (!device || device.kind !== status.kind)
      issues.push(`devices.${id}: missing or mismatched installation`);
    validateDeviceDeadline(state, id, status, device ?? null, issues);
    if (status.kind === "field" && !["attract", "repel"].includes(status.mode))
      issues.push(`devices.${id}.mode: unsupported field mode`);
  }
  validateInstalledDevices(state, context, issues);
};

const validateDeviceDeadline = (
  state: EncounterState,
  id: string,
  status: NonNullable<EncounterState["catalyst"]>["devices"][string],
  device: CatalystDeviceDefinition | null,
  issues: string[]
): void => {
  if (status.kind === "field" && device?.kind === "field")
    bounds(
      status.activatesAt,
      0,
      state.elapsed + device.activationSeconds + 1e-9,
      `devices.${id}.deadline`,
      issues
    );
  if (status.kind === "discharge" && device?.kind === "discharge")
    bounds(
      status.readyAt,
      0,
      state.elapsed + device.cooldownSeconds + 1e-9,
      `devices.${id}.deadline`,
      issues
    );
};

const validateInstalledDevices = (
  state: EncounterState,
  context: EncounterContext,
  issues: string[]
): void => {
  if (context.combat.mechanics.kind !== "catalyst") return;
  for (const tower of Object.values(state.towers)) {
    const device = context.combat.mechanics.devices[tower.chassisId];
    if (device?.kind !== "weapon" && !state.catalyst!.devices[tower.id])
      issues.push(`devices.${tower.id}: missing device state`);
  }
};

const validateDamageAccounts = (state: EncounterState, issues: string[]): void => {
  const catalyst = state.catalyst!;
  for (const [id, account] of [
    ...Object.entries(catalyst.directBySource),
    ...Object.entries(catalyst.damageByDevice),
  ]) {
    for (const [key, amount] of Object.entries(account))
      bounds(amount, 0, Number.MAX_VALUE, `damage.${id}.${key}`, issues);
    if (!Number.isSafeInteger(account.kills)) issues.push(`damage.${id}.kills: expected integer`);
    if ("shots" in account && !Number.isSafeInteger(account.shots))
      issues.push(`damage.${id}.shots: expected integer`);
  }
};

const validateFieldAccounts = (
  state: EncounterState,
  context: EncounterContext,
  issues: string[]
): void => {
  const mechanics = context.combat.mechanics;
  if (mechanics.kind !== "catalyst") return;
  const catalyst = state.catalyst!;
  for (const [id, account] of Object.entries(catalyst.fieldByDevice)) {
    const source = catalyst.sources[id];
    const device = source ? mechanics.devices[source.chassisId] : null;
    if (device?.kind !== "field") {
      issues.push(`fieldByDevice.${id}: missing field source`);
      continue;
    }
    bounds(
      account.activeSeconds,
      0,
      state.elapsed + 1e-7,
      `fieldByDevice.${id}.activeSeconds`,
      issues
    );
    bounds(
      account.servicedEnemySeconds,
      0,
      account.activeSeconds * device.targetCap + 1e-7,
      `fieldByDevice.${id}.servicedEnemySeconds`,
      issues
    );
  }
};

const validatePulse = (
  state: EncounterState,
  pulse: CatalystPulse,
  context: EncounterContext,
  issues: string[]
): void => {
  const catalyst = state.catalyst!;
  const source = catalyst.sources[pulse.sourceId];
  const mechanics = context.combat.mechanics;
  const device =
    mechanics.kind === "catalyst" && source ? mechanics.devices[source.chassisId] : null;
  if (device?.kind !== "discharge") {
    issues.push(`pulse.${pulse.id}: missing discharge source`);
    return;
  }
  bounds(pulse.elapsed, 0, state.elapsed + 1e-9, `pulse.${pulse.id}.elapsed`, issues);
  validatePulseIdentity(pulse, catalyst.nextPulseId, device.targetCap, issues);
  validatePulseTargets(state, pulse, device, issues);
};

const validatePulseIdentity = (
  pulse: CatalystPulse,
  nextPulseId: number,
  cap: number,
  issues: string[]
): void => {
  if (!Number.isSafeInteger(pulse.id) || pulse.id < 1 || pulse.id >= nextPulseId)
    issues.push(`pulse.${pulse.id}: invalid pulse sequence`);
  if (
    !pulse.targets.length ||
    pulse.targets.length > cap ||
    new Set(pulse.targets.map((target) => target.enemyId)).size !== pulse.targets.length
  )
    issues.push(`pulse.${pulse.id}: invalid target set`);
};

const validatePulseTargets = (
  state: EncounterState,
  pulse: CatalystPulse,
  device: Extract<CatalystDeviceDefinition, { kind: "discharge" }>,
  issues: string[]
): void => {
  for (const target of pulse.targets) {
    if (
      !Number.isSafeInteger(target.enemyId) ||
      target.enemyId < 1 ||
      target.enemyId >= state.nextEnemyId
    )
      issues.push(`pulse.${pulse.id}: invalid historical enemy identity`);
    bounds(target.consumed, 0, device.consumeCap, `pulse.${pulse.id}.consumed`, issues);
    bounds(target.damage, 0, Number.MAX_VALUE, `pulse.${pulse.id}.damage`, issues);
    if (!close(target.consumed, total(target.contributions)))
      issues.push(`pulse.${pulse.id}: consumed amount differs from source shares`);
    for (const [id, amount] of Object.entries(target.contributions)) {
      if (!state.catalyst!.sources[id])
        issues.push(`pulse.${pulse.id}: contribution source is missing`);
      bounds(amount, 0, target.consumed, `pulse.${pulse.id}.contributions.${id}`, issues);
    }
  }
};

const validatePulses = (
  state: EncounterState,
  context: EncounterContext,
  issues: string[]
): void => {
  const catalyst = state.catalyst!;
  if (!Number.isSafeInteger(catalyst.nextPulseId) || catalyst.nextPulseId < 1)
    issues.push("nextPulseId: invalid sequence");
  if (
    catalyst.pulses.length > 64 ||
    new Set(catalyst.pulses.map((pulse) => pulse.id)).size !== catalyst.pulses.length
  )
    issues.push("pulses: duplicate or excessive records");
  for (const pulse of catalyst.pulses) validatePulse(state, pulse, context, issues);
};

export const validateCatalystState = (
  state: EncounterState,
  context: EncounterContext
): string[] => {
  const issues: string[] = [];
  if (context.combat.mechanics.kind === "legacy")
    return state.catalyst ? ["Legacy encounter contains catalyst state"] : [];
  const catalyst = state.catalyst;
  if (!catalyst) return ["Catalyst encounter is missing catalyst state"];
  for (const [id, ledger] of Object.entries(catalyst.chargeByEnemy)) {
    if (id !== String(ledger.enemyId))
      issues.push(`charge.${id}: enemy identity differs from record key`);
    validateLedger(state, ledger, context, issues);
  }
  const stored = Object.values(catalyst.chargeByEnemy).reduce(
    (sum, ledger) => sum + ledger.amount,
    0
  );
  validateAccount(catalyst.accounting, stored, "accounting", issues);
  validateSources(state, context, issues);
  validateDevices(state, context, issues);
  validateDamageAccounts(state, issues);
  validateFieldAccounts(state, context, issues);
  validatePulses(state, context, issues);
  for (const key of Object.keys(catalyst.accounting) as (keyof ChargeAccount)[]) {
    const sum = Object.values(catalyst.accountingBySource).reduce(
      (amount, account) => amount + account[key],
      0
    );
    if (!close(sum, catalyst.accounting[key]))
      issues.push(`accounting.${key}: source accounts differ from total`);
  }
  return issues;
};
