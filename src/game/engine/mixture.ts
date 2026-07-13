export type Mixture<Species extends string> = Record<Species, number>;

export const emptyMixture = <Species extends string>(
  speciesIds: readonly Species[]
): Mixture<Species> =>
  Object.fromEntries(speciesIds.map((speciesId) => [speciesId, 0])) as Mixture<Species>;

export const mixtureTotal = <Species extends string>(
  mixture: Mixture<Species>,
  speciesIds: readonly Species[]
): number => speciesIds.reduce((total, speciesId) => total + mixture[speciesId], 0);

export const addMixture = <Species extends string>(
  target: Mixture<Species>,
  addition: Mixture<Species>,
  speciesIds: readonly Species[]
): void => {
  for (const speciesId of speciesIds) target[speciesId] += addition[speciesId];
};

export const subtractMixture = <Species extends string>(
  target: Mixture<Species>,
  subtraction: Mixture<Species>,
  speciesIds: readonly Species[]
): void => {
  for (const speciesId of speciesIds)
    target[speciesId] = Math.max(0, target[speciesId] - subtraction[speciesId]);
};

export const proportionalMixture = <Species extends string>(
  source: Mixture<Species>,
  amount: number,
  speciesIds: readonly Species[]
): Mixture<Species> => {
  const total = mixtureTotal(source, speciesIds);
  const actual = Math.min(total, Math.max(0, amount));
  const packet = emptyMixture(speciesIds);
  if (total <= 0 || actual <= 0) return packet;
  for (const speciesId of speciesIds) packet[speciesId] = actual * (source[speciesId] / total);
  return packet;
};

export const takeMixture = <Species extends string>(
  source: Mixture<Species>,
  amount: number,
  speciesIds: readonly Species[]
): Mixture<Species> => {
  const packet = proportionalMixture(source, amount, speciesIds);
  subtractMixture(source, packet, speciesIds);
  return packet;
};
