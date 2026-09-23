import { emptyChargeAccount } from "../encounter/catalystCharge";
import type { EncounterState } from "../encounter/types";

/** Previous results own their immutable reports; the next wave starts fresh ledgers. */
export const resetWaveAccounting = (encounter: EncounterState): void => {
  const catalyst = encounter.catalyst;
  if (!catalyst) return;
  if (Object.keys(catalyst.chargeByEnemy).length || encounter.pendingAttacks.length)
    throw new Error("Wave accounting requires settled charge and attacks");
  catalyst.accounting = emptyChargeAccount();
  catalyst.accountingBySource = Object.fromEntries(
    Object.keys(catalyst.sources).map((id) => [id, emptyChargeAccount()])
  );
  catalyst.directBySource = Object.fromEntries(
    Object.keys(catalyst.sources).map((id) => [id, { damage: 0, kills: 0, shots: 0, overkill: 0 }])
  );
  catalyst.damageByDevice = {};
  catalyst.fieldByDevice = {};
  catalyst.pulses = [];
};
