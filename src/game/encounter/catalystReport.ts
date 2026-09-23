import type { CatalystReport } from "./catalystTypes";
import type { EncounterState } from "./types";

export const catalystReport = (state: EncounterState): CatalystReport | null => {
  if (!state.catalyst) return null;
  const {
    sources,
    accounting,
    accountingBySource,
    directBySource,
    damageByDevice,
    fieldByDevice,
    chargeByEnemy,
  } = state.catalyst;
  return structuredClone({
    sources,
    accounting,
    accountingBySource,
    directBySource,
    damageByDevice,
    fieldByDevice,
    remainingCharge: Object.values(chargeByEnemy).reduce(
      (total, ledger) => total + ledger.amount,
      0
    ),
  });
};
