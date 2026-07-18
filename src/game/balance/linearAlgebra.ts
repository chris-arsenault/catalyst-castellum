export type Vector = number[];
export type Matrix = number[][];

const rectangularWidth = (matrix: Matrix): number => {
  const width = matrix[0]?.length ?? 0;
  if (matrix.some((row) => row.length !== width)) throw new Error("Matrix must be rectangular.");
  return width;
};

export const transpose = (matrix: Matrix): Matrix => {
  const width = rectangularWidth(matrix);
  return Array.from({ length: width }, (_, column) => matrix.map((row) => row[column] ?? 0));
};

export const multiplyMatrixVector = (matrix: Matrix, vector: Vector): Vector => {
  const width = rectangularWidth(matrix);
  if (width !== vector.length) throw new Error("Matrix and vector dimensions do not match.");
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index]!, 0));
};

export const multiplyMatrices = (left: Matrix, right: Matrix): Matrix => {
  const leftWidth = rectangularWidth(left);
  const rightWidth = rectangularWidth(right);
  if (leftWidth !== right.length) throw new Error("Matrix dimensions do not match.");
  return left.map((row) =>
    Array.from({ length: rightWidth }, (_, column) =>
      row.reduce((sum, value, index) => sum + value * (right[index]?.[column] ?? 0), 0)
    )
  );
};

export const subtractVectors = (left: Vector, right: Vector): Vector => {
  if (left.length !== right.length) throw new Error("Vector dimensions do not match.");
  return left.map((value, index) => value - right[index]!);
};

export const vectorNorm = (vector: Vector): number =>
  Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

const pivotRow = (augmented: Matrix, pivot: number): number => {
  let best = pivot;
  for (let row = pivot + 1; row < augmented.length; row += 1) {
    const candidate = Math.abs(augmented[row]?.[pivot] ?? 0);
    const incumbent = Math.abs(augmented[best]?.[pivot] ?? 0);
    if (candidate > incumbent) best = row;
  }
  return best;
};

const normalizePivot = (augmented: Matrix, pivot: number): void => {
  const divisor = augmented[pivot]?.[pivot] ?? 1;
  for (let column = pivot; column <= augmented.length; column += 1) {
    augmented[pivot]![column] = (augmented[pivot]?.[column] ?? 0) / divisor;
  }
};

const eliminateRow = (augmented: Matrix, pivot: number, row: number): void => {
  if (row === pivot) return;
  const factor = augmented[row]?.[pivot] ?? 0;
  if (Math.abs(factor) < 1e-15) return;
  for (let column = pivot; column <= augmented.length; column += 1) {
    augmented[row]![column] =
      (augmented[row]?.[column] ?? 0) - factor * (augmented[pivot]?.[column] ?? 0);
  }
};

const eliminatePivot = (augmented: Matrix, pivot: number): void => {
  for (let row = 0; row < augmented.length; row += 1) eliminateRow(augmented, pivot, row);
};

/** Gaussian elimination with partial pivoting for the small dense balance systems. */
export const solveLinearSystem = (matrix: Matrix, target: Vector): Vector => {
  const size = matrix.length;
  if (rectangularWidth(matrix) !== size || target.length !== size) {
    throw new Error("Linear solve requires a square matrix and matching target.");
  }
  const augmented = matrix.map((row, index) => [...row, target[index] ?? 0]);
  for (let pivot = 0; pivot < size; pivot += 1) {
    const best = pivotRow(augmented, pivot);
    if (Math.abs(augmented[best]?.[pivot] ?? 0) < 1e-12) {
      throw new Error(
        "Balance matrix is singular; add an independent constraint or regularization."
      );
    }
    [augmented[pivot], augmented[best]] = [augmented[best]!, augmented[pivot]!];
    normalizePivot(augmented, pivot);
    eliminatePivot(augmented, pivot);
  }
  return augmented.map((row) => row[size] ?? 0);
};

/** Optional weights, ridge/prior, physical bounds, and iteration limit for a numerical solve. */
export type LeastSquaresOptions = Partial<{
  weights: Vector;
  ridge: number;
  prior: Vector;
  minimum: number | Vector;
  maximum: number | Vector;
  iterations: number;
}>;

export interface LeastSquaresResult {
  solution: Vector;
  predicted: Vector;
  residual: Vector;
  residualNorm: number;
}

const accumulateNormalRow = (
  matrix: Matrix,
  normalTarget: Vector,
  coefficients: Vector,
  target: number,
  weight: number
): void => {
  for (let left = 0; left < matrix.length; left += 1) {
    const leftValue = coefficients[left] ?? 0;
    normalTarget[left] = (normalTarget[left] ?? 0) + weight * leftValue * target;
    for (let right = 0; right < matrix.length; right += 1) {
      matrix[left]![right] =
        (matrix[left]?.[right] ?? 0) + weight * leftValue * (coefficients[right] ?? 0);
    }
  }
};

const addRidge = (matrix: Matrix, target: Vector, prior: Vector, ridge: number): void => {
  for (let index = 0; index < matrix.length; index += 1) {
    matrix[index]![index] = (matrix[index]?.[index] ?? 0) + ridge;
    target[index] = (target[index] ?? 0) + ridge * (prior[index] ?? 0);
  }
};

// Dimension guards and numerical defaults are kept beside the normal-equation construction.
/* eslint-disable complexity */
const normalSystem = (
  coefficients: Matrix,
  target: Vector,
  options: LeastSquaresOptions
): { matrix: Matrix; target: Vector } => {
  const columns = rectangularWidth(coefficients);
  if (coefficients.length !== target.length) throw new Error("Coefficient and target rows differ.");
  const weights = options.weights ?? target.map(() => 1);
  if (weights.length !== target.length) throw new Error("Weight and target rows differ.");
  const prior = options.prior ?? Array.from({ length: columns }, () => 0);
  if (prior.length !== columns) throw new Error("Prior and coefficient columns differ.");
  const ridge = options.ridge ?? 1e-8;
  const matrix = Array.from({ length: columns }, () => Array.from({ length: columns }, () => 0));
  const normalTarget = Array.from({ length: columns }, () => 0);
  for (let row = 0; row < coefficients.length; row += 1) {
    accumulateNormalRow(
      matrix,
      normalTarget,
      coefficients[row] ?? [],
      target[row] ?? 0,
      weights[row] ?? 1
    );
  }
  addRidge(matrix, normalTarget, prior, ridge);
  return { matrix, target: normalTarget };
};
/* eslint-enable complexity */

const boundAt = (bound: number | Vector | undefined, index: number, fallback: number): number =>
  Array.isArray(bound) ? (bound[index] ?? fallback) : (bound ?? fallback);

const projectBound = (value: number, index: number, options: LeastSquaresOptions): number =>
  Math.min(
    boundAt(options.maximum, index, Number.POSITIVE_INFINITY),
    Math.max(boundAt(options.minimum, index, Number.NEGATIVE_INFINITY), value)
  );

const pinBoundViolations = (
  solution: Vector,
  pinned: Map<number, number>,
  options: LeastSquaresOptions
): boolean => {
  let changed = false;
  for (let index = 0; index < solution.length; index += 1) {
    const bounded = projectBound(solution[index] ?? 0, index, options);
    if (Math.abs(bounded - (solution[index] ?? 0)) > 1e-10 && !pinned.has(index)) {
      pinned.set(index, bounded);
      changed = true;
    }
    solution[index] = bounded;
  }
  return changed;
};

const solveFreeVariables = (
  matrix: Matrix,
  target: Vector,
  solution: Vector,
  pinned: Map<number, number>
): boolean => {
  const free = solution.map((_, index) => index).filter((index) => !pinned.has(index));
  if (free.length === 0) return false;
  const reducedMatrix = free.map((row) => free.map((column) => matrix[row]?.[column] ?? 0));
  const reducedTarget = free.map((row) => {
    let value = target[row] ?? 0;
    for (const [column, pinnedValue] of pinned) {
      value -= (matrix[row]?.[column] ?? 0) * pinnedValue;
    }
    return value;
  });
  const reducedSolution = solveLinearSystem(reducedMatrix, reducedTarget);
  free.forEach((index, position) => {
    solution[index] = reducedSolution[position] ?? 0;
  });
  for (const [index, value] of pinned) solution[index] = value;
  return true;
};

/** Weighted ridge least squares with an active-set projection for physical bounds. */
export const solveLeastSquares = (
  coefficients: Matrix,
  target: Vector,
  options: LeastSquaresOptions = {}
): LeastSquaresResult => {
  const columns = rectangularWidth(coefficients);
  if (columns === 0) throw new Error("Least-squares system needs at least one variable.");
  const { matrix, target: normalTarget } = normalSystem(coefficients, target, options);
  const solution = solveLinearSystem(matrix, normalTarget);
  const pinned = new Map<number, number>();
  for (let pass = 0; pass < (options.iterations ?? columns + 1); pass += 1) {
    if (!pinBoundViolations(solution, pinned, options)) break;
    if (!solveFreeVariables(matrix, normalTarget, solution, pinned)) break;
  }
  const predicted = multiplyMatrixVector(coefficients, solution);
  const residual = subtractVectors(target, predicted);
  return { solution, predicted, residual, residualNorm: vectorNorm(residual) };
};

const coverageGradient = (
  coefficients: Matrix,
  target: Vector,
  weights: Vector,
  predicted: Vector,
  solution: Vector,
  prior: Vector,
  ridge: number
): { gradient: Vector; lipschitz: number } => {
  const gradient = solution.map((value, column) => ridge * (value - (prior[column] ?? 0)));
  let lipschitz = ridge;
  for (let row = 0; row < coefficients.length; row += 1) {
    const shortfall = Math.max(0, (target[row] ?? 0) - (predicted[row] ?? 0));
    if (shortfall <= 0) continue;
    const weight = weights[row] ?? 1;
    const rowCoefficients = coefficients[row] ?? [];
    lipschitz += weight * rowCoefficients.reduce((sum, value) => sum + value * value, 0);
    for (let column = 0; column < solution.length; column += 1) {
      gradient[column] =
        (gradient[column] ?? 0) - weight * shortfall * (rowCoefficients[column] ?? 0);
    }
  }
  return { gradient, lipschitz };
};

const takeCoverageStep = (
  solution: Vector,
  gradient: Vector,
  lipschitz: number,
  options: LeastSquaresOptions
): number => {
  const step = 0.9 / Math.max(lipschitz, 1e-9);
  let largestStep = 0;
  for (let column = 0; column < solution.length; column += 1) {
    const next = projectBound(
      (solution[column] ?? 0) - step * (gradient[column] ?? 0),
      column,
      options
    );
    largestStep = Math.max(largestStep, Math.abs(next - (solution[column] ?? 0)));
    solution[column] = next;
  }
  return largestStep;
};

/**
 * Convex one-sided least squares for minimum combat coverage:
 * min 1/2 Σ wᵢ max(0, bᵢ - Aᵢx)² + λ/2 ||x - prior||².
 */
// Dimension guards and convergence control are part of this numerical kernel.
/* eslint-disable complexity */
export const solveMinimumCoverage = (
  coefficients: Matrix,
  target: Vector,
  options: LeastSquaresOptions = {}
): LeastSquaresResult => {
  const columns = rectangularWidth(coefficients);
  if (columns === 0 || coefficients.length !== target.length) {
    throw new Error("Coverage system dimensions do not match.");
  }
  const weights = options.weights ?? target.map(() => 1);
  const prior = options.prior ?? Array.from({ length: columns }, () => 0);
  if (weights.length !== target.length || prior.length !== columns) {
    throw new Error("Coverage weights or prior dimensions do not match.");
  }
  const ridge = options.ridge ?? 0.02;
  const solution = prior.map((value, index) => projectBound(value, index, options));
  for (let iteration = 0; iteration < (options.iterations ?? 20_000); iteration += 1) {
    const predicted = multiplyMatrixVector(coefficients, solution);
    const gradient = coverageGradient(
      coefficients,
      target,
      weights,
      predicted,
      solution,
      prior,
      ridge
    );
    if (takeCoverageStep(solution, gradient.gradient, gradient.lipschitz, options) < 1e-10) break;
  }
  const predicted = multiplyMatrixVector(coefficients, solution);
  const residual = subtractVectors(target, predicted);
  const shortfall = residual.map((value) => Math.max(0, value));
  return { solution, predicted, residual, residualNorm: vectorNorm(shortfall) };
};
/* eslint-enable complexity */
