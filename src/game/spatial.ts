import type { GridCell, WorldPoint } from "./types";

export const cell = (column: number, elevation: number): GridCell => ({ column, elevation });

export const cellKey = ({ column, elevation }: GridCell): string => `${column}:${elevation}`;

export const gridCellToWorldPoint = ({ column, elevation }: GridCell): WorldPoint => ({
  x: column + 0.5,
  elevation: elevation + 0.5,
});

export const worldPointToGridCell = ({ x, elevation }: WorldPoint): GridCell => ({
  column: Math.floor(x),
  elevation: Math.floor(elevation),
});

export const gridPathToWorldPath = (path: readonly GridCell[]): WorldPoint[] =>
  path.map(gridCellToWorldPoint);

/** Expand orthogonal waypoints into the exact grid cells a route occupies. */
export const orthogonalGridPath = (...waypoints: readonly GridCell[]): GridCell[] => {
  const first = waypoints[0];
  if (!first) return [];
  const result: GridCell[] = [{ ...first }];
  let current = { ...first };
  for (const target of waypoints.slice(1)) {
    if (current.column !== target.column && current.elevation !== target.elevation) {
      throw new Error(`Routes must be orthogonal: ${cellKey(current)} -> ${cellKey(target)}`);
    }
    const columnStep = Math.sign(target.column - current.column);
    const elevationStep = Math.sign(target.elevation - current.elevation);
    while (current.column !== target.column || current.elevation !== target.elevation) {
      current = {
        column: current.column + columnStep,
        elevation: current.elevation + elevationStep,
      };
      result.push(current);
    }
  }
  return result;
};
