import type { IHitArea } from "pixi.js";
import type { RoomDrawModel } from "./roomGraphics";

export const roomHitArea = (model: RoomDrawModel): IHitArea => ({
  contains: (x, y) => {
    const coreMargin = model.structure === "core" ? 24 : 0;
    const insideShell =
      x >= -model.width / 2 - coreMargin &&
      x <= model.width / 2 + coreMargin &&
      y >= -model.height / 2 - coreMargin &&
      y <= model.height / 2 + coreMargin;
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
