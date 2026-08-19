import type { Graphics } from "pixi.js";
import type { TowerAttackEvent, TowerChassisId, TowerOrientation } from "../../game/types";

interface Point {
  x: number;
  y: number;
}

export const towerDirection = (orientation: TowerOrientation): Point => {
  if (orientation === "left") return { x: -1, y: 0 };
  if (orientation === "right") return { x: 1, y: 0 };
  if (orientation === "up") return { x: 0, y: -1 };
  return { x: 0, y: 1 };
};

const pointAt = (center: Point, direction: Point, forward: number, side = 0): Point => ({
  x: center.x + direction.x * forward - direction.y * side,
  y: center.y + direction.y * forward + direction.x * side,
});

const line = (
  graphics: Graphics,
  from: Point,
  to: Point,
  color: number,
  width: number,
  alpha: number
): void => {
  graphics.moveTo(from.x, from.y).lineTo(to.x, to.y).stroke({ color, width, alpha, cap: "round" });
};

const shell = (
  graphics: Graphics,
  center: Point,
  color: number,
  selected: boolean,
  alpha: number
): void => {
  graphics
    .circle(center.x, center.y, 10)
    .fill({ color: 0x0b1713, alpha: 0.98 * alpha })
    .stroke({ color, width: selected ? 3 : 2, alpha: 0.96 * alpha });
};

const drawFlashChamber = (
  graphics: Graphics,
  center: Point,
  origin: Point,
  direction: Point,
  color: number,
  selected: boolean,
  alpha: number
): void => {
  shell(graphics, center, color, selected, alpha);
  graphics.circle(center.x, center.y, 6).stroke({ color, width: 2, alpha });
  graphics.circle(center.x, center.y, 2.5).fill({ color, alpha });
  line(graphics, pointAt(center, direction, 7), pointAt(origin, direction, 13), color, 6, alpha);
  graphics.circle(origin.x, origin.y, 4).stroke({ color: 0xf8ebbd, width: 1.5, alpha });
};

const drawCausticJet = (
  graphics: Graphics,
  center: Point,
  origin: Point,
  direction: Point,
  color: number,
  alpha: number
): void => {
  for (const side of [-5, 5]) {
    const tank = pointAt(center, direction, -1, side);
    graphics
      .circle(tank.x, tank.y, 5)
      .fill({ color: 0x0b1713, alpha })
      .stroke({ color, width: 2, alpha });
    line(graphics, tank, pointAt(origin, direction, -2), color, 1.5, alpha * 0.75);
  }
  const nozzleBase = pointAt(origin, direction, -5);
  const nozzleTip = pointAt(origin, direction, 9);
  graphics
    .poly([
      pointAt(nozzleBase, direction, 0, -5).x,
      pointAt(nozzleBase, direction, 0, -5).y,
      pointAt(nozzleBase, direction, 0, 5).x,
      pointAt(nozzleBase, direction, 0, 5).y,
      nozzleTip.x,
      nozzleTip.y,
    ])
    .fill({ color, alpha: 0.72 * alpha })
    .stroke({ color: 0xf4b778, width: 1, alpha });
};

const drawCarbonBurner = (
  graphics: Graphics,
  center: Point,
  origin: Point,
  direction: Point,
  color: number,
  alpha: number
): void => {
  const rear = pointAt(center, direction, -8);
  const throat = pointAt(origin, direction, 4);
  graphics
    .poly([
      pointAt(rear, direction, 0, -7).x,
      pointAt(rear, direction, 0, -7).y,
      pointAt(rear, direction, 0, 7).x,
      pointAt(rear, direction, 0, 7).y,
      pointAt(throat, direction, 0, 4).x,
      pointAt(throat, direction, 0, 4).y,
      pointAt(throat, direction, 0, -4).x,
      pointAt(throat, direction, 0, -4).y,
    ])
    .fill({ color: 0x17130d, alpha })
    .stroke({ color, width: 2, alpha });
  line(
    graphics,
    pointAt(center, direction, -5),
    pointAt(origin, direction, 10),
    0xffd078,
    3,
    alpha
  );
  for (const side of [-7, 7]) {
    const intake = pointAt(center, direction, -7, side);
    graphics.circle(intake.x, intake.y, 2.5).fill({ color, alpha: 0.8 * alpha });
  }
};

const drawAcidPot = (
  graphics: Graphics,
  center: Point,
  origin: Point,
  direction: Point,
  color: number,
  alpha: number
): void => {
  graphics
    .ellipse(center.x, center.y, 13, 9)
    .fill({ color: 0x10170d, alpha })
    .stroke({ color, width: 2.5, alpha });
  graphics.ellipse(center.x, center.y - 6, 8, 3).stroke({ color: 0xc9d89a, width: 1.5, alpha });
  const elbow = pointAt(center, direction, 7, -7);
  line(graphics, pointAt(center, direction, 2, -4), elbow, color, 4, alpha);
  line(graphics, elbow, pointAt(origin, direction, 8), color, 4, alpha);
  graphics.circle(center.x, center.y + 1, 3).fill({ color, alpha: 0.55 * alpha });
};

const drawQuenchCoil = (
  graphics: Graphics,
  center: Point,
  direction: Point,
  color: number,
  alpha: number
): void => {
  shell(graphics, center, color, false, alpha);
  for (const forward of [-5, 0, 5]) {
    const coil = pointAt(center, direction, forward);
    graphics.circle(coil.x, coil.y, 6).stroke({ color, width: 2, alpha });
  }
  const terminal = pointAt(center, direction, 10);
  line(
    graphics,
    pointAt(terminal, direction, 0, -7),
    pointAt(terminal, direction, 0, 7),
    color,
    2,
    alpha
  );
};

const drawWashHead = (
  graphics: Graphics,
  center: Point,
  origin: Point,
  direction: Point,
  color: number,
  alpha: number
): void => {
  shell(graphics, center, color, false, alpha);
  line(graphics, pointAt(center, direction, 4), pointAt(origin, direction, 2), color, 4, alpha);
  const head = pointAt(origin, direction, 4);
  line(
    graphics,
    pointAt(head, direction, 0, -10),
    pointAt(head, direction, 0, 10),
    color,
    5,
    alpha
  );
  for (const side of [-7, -2.5, 2.5, 7]) {
    const nozzle = pointAt(head, direction, 3, side);
    graphics.circle(nozzle.x, nozzle.y, 1.8).fill({ color: 0xdccdf5, alpha });
  }
};

const drawCarbonylMarker = (
  graphics: Graphics,
  center: Point,
  origin: Point,
  direction: Point,
  color: number,
  alpha: number
): void => {
  const rear = pointAt(center, direction, -8);
  const front = pointAt(center, direction, 8);
  const left = pointAt(center, direction, 0, -7);
  const right = pointAt(center, direction, 0, 7);
  graphics
    .poly([rear.x, rear.y, left.x, left.y, front.x, front.y, right.x, right.y], true)
    .fill({ color: 0x0b1713, alpha })
    .stroke({ color, width: 2, alpha });
  graphics.circle(center.x, center.y, 4).fill({ color, alpha: 0.66 * alpha });
  line(graphics, front, pointAt(origin, direction, 13), color, 2, alpha);
};

export const drawTowerApparatus = (
  graphics: Graphics,
  chassisId: TowerChassisId,
  center: Point,
  origin: Point,
  direction: Point,
  color: number,
  selected: boolean,
  alpha: number
): void => {
  if (chassisId === "flash_chamber")
    drawFlashChamber(graphics, center, origin, direction, color, selected, alpha);
  else if (chassisId === "caustic_jet")
    drawCausticJet(graphics, center, origin, direction, color, alpha);
  else if (chassisId === "carbon_burner")
    drawCarbonBurner(graphics, center, origin, direction, color, alpha);
  else if (chassisId === "acid_pot") drawAcidPot(graphics, center, origin, direction, color, alpha);
  else if (chassisId === "quench_coil") drawQuenchCoil(graphics, center, direction, color, alpha);
  else if (chassisId === "wash_head")
    drawWashHead(graphics, center, origin, direction, color, alpha);
  else drawCarbonylMarker(graphics, center, origin, direction, color, alpha);
};

const drawFlashAttack = (
  graphics: Graphics,
  source: Point,
  target: Point,
  color: number,
  alpha: number
) => {
  line(graphics, source, target, 0xfff3bd, 4, alpha);
  line(graphics, source, target, color, 1.5, alpha);
  graphics.circle(target.x, target.y, 8).stroke({ color, width: 2, alpha });
};

const drawCausticAttack = (
  graphics: Graphics,
  source: Point,
  target: Point,
  color: number,
  alpha: number
) => {
  line(graphics, source, target, color, 2, alpha * 0.65);
  for (const progress of [0.35, 0.6, 0.85]) {
    const x = source.x + (target.x - source.x) * progress;
    const y = source.y + (target.y - source.y) * progress;
    graphics.circle(x, y, 2.5).fill({ color, alpha });
  }
};

const drawBurnerAttack = (
  graphics: Graphics,
  source: Point,
  target: Point,
  color: number,
  alpha: number
) => {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const side = { x: (-dy / length) * 16, y: (dx / length) * 16 };
  graphics
    .poly(
      [
        source.x,
        source.y,
        target.x + side.x,
        target.y + side.y,
        target.x - side.x,
        target.y - side.y,
      ],
      true
    )
    .fill({ color, alpha: 0.16 * alpha });
  line(graphics, source, target, 0xffd078, 4, alpha * 0.75);
};

const drawAcidAttack = (
  graphics: Graphics,
  source: Point,
  target: Point,
  color: number,
  alpha: number,
  progress: number
): void => {
  const points: number[] = [];
  for (let index = 0; index <= 8; index += 1) {
    const t = index / 8;
    points.push(
      source.x + (target.x - source.x) * t,
      source.y + (target.y - source.y) * t - Math.sin(Math.PI * t) * 28
    );
  }
  graphics.poly(points, false).stroke({ color, width: 2, alpha: 0.65 * alpha });
  const shot = {
    x: source.x + (target.x - source.x) * progress,
    y: source.y + (target.y - source.y) * progress - Math.sin(Math.PI * progress) * 28,
  };
  graphics.circle(shot.x, shot.y, 5).fill({ color, alpha });
  graphics.ellipse(target.x, target.y + 3, 20, 8).fill({ color, alpha: 0.16 * alpha });
};

const drawQuenchAttack = (
  graphics: Graphics,
  source: Point,
  target: Point,
  color: number,
  alpha: number
) => {
  line(graphics, source, target, color, 2, alpha * 0.5);
  graphics.circle(target.x, target.y, 22).stroke({ color, width: 3, alpha });
  for (let index = 0; index < 6; index += 1) {
    const angle = (index * Math.PI) / 3;
    line(
      graphics,
      { x: target.x + Math.cos(angle) * 8, y: target.y + Math.sin(angle) * 8 },
      { x: target.x + Math.cos(angle) * 20, y: target.y + Math.sin(angle) * 20 },
      color,
      1.5,
      alpha
    );
  }
};

const drawWashAttack = (
  graphics: Graphics,
  source: Point,
  target: Point,
  color: number,
  alpha: number
) => {
  line(graphics, source, target, color, 6, alpha * 0.16);
  for (const offset of [-8, -3, 3, 8]) {
    graphics
      .circle(target.x + offset, target.y - Math.abs(offset) * 0.35, 2.5)
      .fill({ color, alpha });
  }
  graphics.ellipse(target.x, target.y + 4, 18, 6).stroke({ color, width: 2, alpha });
};

const drawMarkerAttack = (
  graphics: Graphics,
  source: Point,
  target: Point,
  color: number,
  alpha: number
) => {
  line(graphics, source, target, color, 1.5, alpha);
  graphics.circle(target.x, target.y, 13).stroke({ color, width: 1.5, alpha });
  line(
    graphics,
    { x: target.x - 17, y: target.y },
    { x: target.x - 7, y: target.y },
    color,
    1.5,
    alpha
  );
  line(
    graphics,
    { x: target.x + 7, y: target.y },
    { x: target.x + 17, y: target.y },
    color,
    1.5,
    alpha
  );
};

export const drawTowerAttack = (
  graphics: Graphics,
  attack: TowerAttackEvent,
  chassisId: TowerChassisId,
  source: Point,
  target: Point,
  color: number,
  alpha: number,
  elapsed: number
): void => {
  const duration = Math.max(0.001, attack.expiresAt - attack.startedAt);
  const progress = Math.max(0, Math.min(1, (elapsed - attack.startedAt) / duration));
  if (chassisId === "flash_chamber") drawFlashAttack(graphics, source, target, color, alpha);
  else if (chassisId === "caustic_jet") drawCausticAttack(graphics, source, target, color, alpha);
  else if (chassisId === "carbon_burner") drawBurnerAttack(graphics, source, target, color, alpha);
  else if (chassisId === "acid_pot")
    drawAcidAttack(graphics, source, target, color, alpha, progress);
  else if (chassisId === "quench_coil") drawQuenchAttack(graphics, source, target, color, alpha);
  else if (chassisId === "wash_head") drawWashAttack(graphics, source, target, color, alpha);
  else drawMarkerAttack(graphics, source, target, color, alpha);
};
