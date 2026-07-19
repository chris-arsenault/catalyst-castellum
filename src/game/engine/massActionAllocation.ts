export interface SharedReactantProposal {
  consumption: ReadonlyMap<string, number>;
  scale: number;
}

const requestedByKey = (proposals: readonly SharedReactantProposal[]): Map<string, number> => {
  const requested = new Map<string, number>();
  for (const proposal of proposals) {
    for (const [key, amount] of proposal.consumption) {
      requested.set(key, (requested.get(key) ?? 0) + amount * proposal.scale);
    }
  }
  return requested;
};

const scaleRequestsForCapacity = (
  proposals: SharedReactantProposal[],
  requested: ReadonlyMap<string, number>,
  available: ReadonlyMap<string, number>
): boolean => {
  let changed = false;
  for (const [key, total] of requested) {
    const capacity = available.get(key) ?? 0;
    if (total <= capacity + 1e-10) continue;
    const ratio = capacity / Math.max(total, 1e-12);
    for (const proposal of proposals) {
      if (!proposal.consumption.has(key)) continue;
      proposal.scale *= ratio;
      changed = true;
    }
  }
  return changed;
};

/** Proportionally allocates shared reactants across plans made from one room snapshot. */
export const allocateSharedReactants = (
  proposals: SharedReactantProposal[],
  available: ReadonlyMap<string, number>
): void => {
  for (let iteration = 0; iteration < 6; iteration += 1) {
    const changed = scaleRequestsForCapacity(proposals, requestedByKey(proposals), available);
    if (!changed) break;
  }
};
