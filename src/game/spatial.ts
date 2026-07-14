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
