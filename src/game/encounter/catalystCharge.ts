import type { EnemyState } from "../types";
import type {
  CatalystState,
  ChargeAccount,
  ChargeLossReason,
  EnemyChargeState,
} from "./catalystTypes";
import type { CombatDefinition, EncounterContext, EncounterState, EncounterTower } from "./types";

export const emptyChargeAccount = (): ChargeAccount => ({
  input: 0,
  accepted: 0,
  overflow: 0,
  decay: 0,
  consumed: 0,
  death: 0,
  breach: 0,
  cleanup: 0,
});

export const createCatalystState = (combat: CombatDefinition): CatalystState | null =>
  combat.mechanics.kind === "legacy"
    ? null
    : {
        sources: {},
        chargeByEnemy: {},
        devices: {},
        accounting: emptyChargeAccount(),
        accountingBySource: {},
        damageByDevice: {},
        fieldByDevice: {},
        directBySource: {},
        pulses: [],
        nextPulseId: 1,
      };

export const ensureCatalystSource = (state: EncounterState, tower: EncounterTower): string => {
  const catalyst = state.catalyst;
  if (!catalyst) return tower.id;
  catalyst.sources[tower.id] ??= {
    id: tower.id,
    towerId: tower.id,
    chassisId: tower.chassisId,
    provenance: tower.provenance,
  };
  catalyst.accountingBySource[tower.id] ??= emptyChargeAccount();
  catalyst.directBySource[tower.id] ??= { damage: 0, kills: 0, shots: 0, overkill: 0 };
  return tower.id;
};

const chargeLedger = (state: EncounterState, enemyId: number): EnemyChargeState => {
  const catalyst = state.catalyst!;
  catalyst.chargeByEnemy[String(enemyId)] ??= {
    enemyId,
    amount: 0,
    contributions: {},
    lastInputTick: state.tick,
    lastDischargeTick: -1,
  };
  return catalyst.chargeByEnemy[String(enemyId)]!;
};

const chargeInput = (enemy: EnemyState, amount: number, context: EncounterContext): number => {
  if (context.combat.mechanics.kind !== "catalyst") return 0;
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Invalid charge input");
  const input = amount * (context.combat.mechanics.susceptibility[enemy.type] ?? 0);
  if (!Number.isFinite(input) || input < 0) throw new Error("Invalid susceptible charge input");
  return input;
};

/** Caller has already established a successful, non-shield-blocked impact on this survivor. */
export const addImpactCharge = (
  state: EncounterState,
  enemy: EnemyState,
  sourceId: string,
  authoredAmount: number,
  context: EncounterContext
): number => {
  if (!state.catalyst || context.combat.mechanics.kind !== "catalyst" || enemy.health <= 0)
    return 0;
  const source = state.catalyst.accountingBySource[sourceId];
  if (!source) throw new Error(`Charge input has no retained source ${sourceId}`);
  const input = chargeInput(enemy, authoredAmount, context);
  if (input <= 0) return 0;
  const ledger = chargeLedger(state, enemy.id);
  const accepted = Math.min(
    input,
    Math.max(0, context.combat.mechanics.rules.chargeCapacity - ledger.amount)
  );
  const overflow = input - accepted;
  for (const account of [source, state.catalyst.accounting]) {
    account.input += input;
    account.accepted += accepted;
    account.overflow += overflow;
  }
  ledger.amount += accepted;
  ledger.lastInputTick = state.tick;
  if (accepted > 0)
    ledger.contributions[sourceId] = (ledger.contributions[sourceId] ?? 0) + accepted;
  return accepted;
};

/** Stable source ordering assigns the floating remainder to the final contributor. */
export const removeEnemyCharge = (
  state: EncounterState,
  enemyId: number,
  requested: number,
  reason: ChargeLossReason
): Record<string, number> => {
  const catalyst = state.catalyst;
  const ledger = catalyst?.chargeByEnemy[String(enemyId)];
  if (!catalyst || !ledger || ledger.amount <= 0) return {};
  if (!Number.isFinite(requested) || requested < 0) throw new Error("Invalid charge removal");
  const amount = Math.min(ledger.amount, requested);
  const removed = removeContributions(catalyst, ledger, amount, reason);
  ledger.amount = Math.max(0, ledger.amount - amount);
  catalyst.accounting[reason] += amount;
  if (ledger.amount <= 0) ledger.contributions = {};
  return removed;
};

const removeContributions = (
  catalyst: CatalystState,
  ledger: EnemyChargeState,
  amount: number,
  reason: ChargeLossReason
): Record<string, number> => {
  const entries = Object.entries(ledger.contributions).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  let remaining = amount;
  const removed: Record<string, number> = {};
  for (const [index, [sourceId, contribution]] of entries.entries()) {
    const share =
      index === entries.length - 1 ? remaining : (amount * contribution) / ledger.amount;
    remaining -= share;
    removed[sourceId] = share;
    ledger.contributions[sourceId] = contribution - share;
    if (ledger.contributions[sourceId]! <= 0) delete ledger.contributions[sourceId];
    catalyst.accountingBySource[sourceId]![reason] += share;
  }
  return removed;
};

export const clearEnemyCharge = (
  state: EncounterState,
  enemyId: number,
  reason: "death" | "breach" | "cleanup"
): void => {
  const ledger = state.catalyst?.chargeByEnemy[String(enemyId)];
  if (!ledger) return;
  removeEnemyCharge(state, enemyId, ledger.amount, reason);
  delete state.catalyst!.chargeByEnemy[String(enemyId)];
};

export const cleanupCatalystCharge = (state: EncounterState): void => {
  for (const ledger of Object.values(state.catalyst?.chargeByEnemy ?? {}))
    clearEnemyCharge(state, ledger.enemyId, "cleanup");
};

export const beginCatalystTick = (state: EncounterState, context: EncounterContext): void => {
  if (!state.catalyst || context.combat.mechanics.kind !== "catalyst") return;
  const rules = context.combat.mechanics.rules;
  for (const ledger of Object.values(state.catalyst.chargeByEnemy)) {
    const sinceInput = (state.tick - ledger.lastInputTick) * context.combat.tickSeconds;
    if (sinceInput > rules.chargeDecayDelaySeconds + 1e-9)
      removeEnemyCharge(
        state,
        ledger.enemyId,
        rules.chargeDecayPerSecond * context.combat.tickSeconds,
        "decay"
      );
  }
  state.catalyst.pulses = state.catalyst.pulses.filter(
    (pulse) => state.elapsed - pulse.elapsed <= 0.4
  );
};

export const getEnemyChargePreview = (
  state: EncounterState,
  enemyId: number,
  context: EncounterContext
) => {
  if (context.combat.mechanics.kind !== "catalyst") return null;
  const ledger = state.catalyst?.chargeByEnemy[String(enemyId)];
  const rules = context.combat.mechanics.rules;
  return {
    amount: ledger?.amount ?? 0,
    capacity: rules.chargeCapacity,
    contributions: { ...ledger?.contributions },
    decayPerSecond: rules.chargeDecayPerSecond,
    decayIn: ledger
      ? Math.max(
          0,
          rules.chargeDecayDelaySeconds -
            (state.tick - ledger.lastInputTick) * context.combat.tickSeconds
        )
      : 0,
  };
};
