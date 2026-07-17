import type { GridCell } from "../game/types";

export type HullStrokeTool = "platform" | "ladder" | "erase";

export const hullStrokeCells = (
  tool: HullStrokeTool,
  start: GridCell,
  current: GridCell
): GridCell[] => {
  const vertical =
    tool === "ladder" ||
    (tool === "erase" &&
      Math.abs(current.elevation - start.elevation) > Math.abs(current.column - start.column));
  const from = vertical ? start.elevation : start.column;
  const to = vertical ? current.elevation : current.column;
  const low = Math.min(from, to);
  const high = Math.max(from, to);
  return Array.from({ length: high - low + 1 }, (_, index) =>
    vertical
      ? { column: start.column, elevation: low + index }
      : { column: low + index, elevation: start.elevation }
  );
};
