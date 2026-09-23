export const close = (left: number, right: number): boolean =>
  Math.abs(left - right) <= 1e-7 * Math.max(1, Math.abs(left), Math.abs(right));
export const total = (values: Record<string, number>): number =>
  Object.values(values).reduce((sum, value) => sum + value, 0);

export const bounds = (
  value: number,
  min: number,
  max: number,
  path: string,
  issues: string[]
): void => {
  if (!Number.isFinite(value) || value < min || value > max)
    issues.push(`${path}: expected finite value between ${min} and ${max}`);
};
