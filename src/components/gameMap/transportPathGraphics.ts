import type { Graphics } from "pixi.js";
import type { Point } from "../../game/types";

export interface PathSample {
  point: Point;
  angle: number;
}

export const samplePath = (points: readonly Point[], progress: number): PathSample => {
  const lengths = points.slice(1).map((point, index) => {
    const previous = points[index] as Point;
    return Math.hypot(point.x - previous.x, point.y - previous.y);
  });
  let remaining = lengths.reduce((total, length) => total + length, 0) * progress;
  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index] as number;
    const from = points[index] as Point;
    const to = points[index + 1] as Point;
    if (remaining <= length) {
      const ratio = length > 0 ? remaining / length : 0;
      return {
        point: { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio },
        angle: Math.atan2(to.y - from.y, to.x - from.x),
      };
    }
    remaining -= length;
  }
  const last = points.at(-1) ?? { x: 0, y: 0 };
  const previous = points.at(-2) ?? last;
  return { point: last, angle: Math.atan2(last.y - previous.y, last.x - previous.x) };
};

export const drawArrow = (
  graphics: Graphics,
  sample: PathSample,
  size: number,
  color: number,
  alpha: number,
  hollow: boolean
): void => {
  const directionX = Math.cos(sample.angle);
  const directionY = Math.sin(sample.angle);
  const normalX = -directionY;
  const normalY = directionX;
  const backX = sample.point.x - directionX * size;
  const backY = sample.point.y - directionY * size;
  const wing = size * 0.52;
  const left = { x: backX + normalX * wing, y: backY + normalY * wing };
  const right = { x: backX - normalX * wing, y: backY - normalY * wing };
  if (!hollow) {
    graphics
      .moveTo(backX - directionX * size * 0.65, backY - directionY * size * 0.65)
      .lineTo(sample.point.x, sample.point.y);
  }
  graphics.moveTo(left.x, left.y).lineTo(sample.point.x, sample.point.y).lineTo(right.x, right.y);
  graphics.stroke({ color, width: hollow ? 1.25 : 1.75, alpha });
};

export const drawClosedMarkers = (graphics: Graphics, points: readonly Point[]): void => {
  for (const progress of [0.22, 0.5, 0.78]) {
    const sample = samplePath(points, progress);
    const normalX = -Math.sin(sample.angle);
    const normalY = Math.cos(sample.angle);
    const radius = 5;
    graphics.circle(sample.point.x, sample.point.y, radius + 2).fill({
      color: 0x170907,
      alpha: 0.94,
    });
    graphics
      .moveTo(sample.point.x - normalX * radius, sample.point.y - normalY * radius)
      .lineTo(sample.point.x + normalX * radius, sample.point.y + normalY * radius)
      .stroke({ color: 0xff795e, width: 2.4, alpha: 1 });
  }
};

export const drawOpenMarkers = (
  graphics: Graphics,
  points: readonly Point[],
  color: number
): void => {
  for (const progress of [0.24, 0.5, 0.76]) {
    drawArrow(graphics, samplePath(points, progress), 6, color, 0.94, false);
  }
};

export const drawStopMarker = (graphics: Graphics, points: readonly Point[]): void => {
  const { point } = samplePath(points, 0.5);
  graphics.circle(point.x, point.y, 6).fill({ color: 0x170b09, alpha: 0.92 });
  graphics
    .moveTo(point.x - 4, point.y - 4)
    .lineTo(point.x + 4, point.y + 4)
    .moveTo(point.x + 4, point.y - 4)
    .lineTo(point.x - 4, point.y + 4)
    .stroke({ color: 0xf6644c, width: 1.5, alpha: 0.95 });
};
