export const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

export const round = (value: number, precision = 0): number => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export const sumRecord = <T extends string>(
  values: Record<T, number>,
  keys: readonly T[]
): number => keys.reduce((total, key) => total + values[key], 0);
