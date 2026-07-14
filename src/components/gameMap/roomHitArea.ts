import type { IHitArea } from "pixi.js";
import type { RoomDrawModel } from "./roomGraphics";

export const roomHitArea = (model: RoomDrawModel): IHitArea => ({
  contains: (x, y) => {
    const insideShell =
      x >= -model.width / 2 &&
      x <= model.width / 2 &&
      y >= -model.height / 2 &&
      y <= model.height / 2;
    return (
      insideShell ||
      model.cells.some(
        (atmosphericCell) =>
          x >= atmosphericCell.left &&
          x <= atmosphericCell.left + atmosphericCell.size &&
          y >= atmosphericCell.top &&
          y <= atmosphericCell.top + atmosphericCell.size
      )
    );
  },
});
