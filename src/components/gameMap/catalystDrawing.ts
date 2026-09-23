import type { Graphics } from "pixi.js";
import {
  enemyWorldPosition,
  type DischargePreview,
  type EncounterState,
  type FieldRouteArrow,
} from "../../game/tactical";
import { mapViewFor, colorNumber, type MapView } from "./mapGeometry";

export const drawPendingAttacks = (g: Graphics, state: EncounterState): void => {
  const view = mapViewFor(state.map);
  for (const attack of state.pendingAttacks) {
    const point = view.worldToMapPoint(attack.position);
    g.circle(point.x, point.y, attack.strategy === "lobbed" ? 5 : 3).fill({
      color: colorNumber(attack.source.color),
      alpha: 0.95,
    });
  }
};

export const drawDischargePulses = (g: Graphics, state: EncounterState): void => {
  const view = mapViewFor(state.map);
  for (const pulse of state.catalyst?.pulses ?? []) {
    const age = state.elapsed - pulse.elapsed;
    if (age < 0 || age > 0.25) continue;
    const origin = view.worldToMapPoint(pulse.origin);
    g.moveTo(origin.x, origin.y);
    for (const target of pulse.targets) {
      const point = view.worldToMapPoint(target.position);
      g.lineTo(point.x, point.y);
    }
    g.stroke({ color: 0xd6ccff, width: 4, alpha: 1 - age / 0.25 });
  }
};

export const drawFieldArrows = (
  g: Graphics,
  arrows: readonly FieldRouteArrow[],
  view: MapView,
  alpha: number
): void => {
  for (const arrow of arrows) {
    const start = view.worldToMapPoint(arrow.origin);
    const length = 1.2 * arrow.multiplier;
    const end = view.worldToMapPoint({
      x: arrow.origin.x + arrow.tangent.x * length,
      elevation: arrow.origin.elevation + arrow.tangent.elevation * length,
    });
    const color = arrow.multiplier > 1 ? 0xf8bc6c : 0x8dc9ff;
    g.circle(start.x, start.y, 5).stroke({ color, width: 1.5, alpha });
    g.moveTo(start.x, start.y).lineTo(end.x, end.y).stroke({ color, width: 2.5, alpha });
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    g.moveTo(end.x - 6 * Math.cos(angle - 0.55), end.y - 6 * Math.sin(angle - 0.55))
      .lineTo(end.x, end.y)
      .lineTo(end.x - 6 * Math.cos(angle + 0.55), end.y - 6 * Math.sin(angle + 0.55))
      .stroke({ color, width: 2, alpha });
  }
};

const enemyPoint = (state: EncounterState, id: number) => {
  const enemy = state.enemies.find((candidate) => candidate.id === id);
  return enemy ? mapViewFor(state.map).worldToMapPoint(enemyWorldPosition(enemy)) : null;
};

export const drawDischargePreview = (
  g: Graphics,
  state: EncounterState,
  preview: DischargePreview
): void => {
  const tower = state.towers[preview.sourceId];
  if (!tower) return;
  let previous = mapViewFor(state.map).worldToMapPoint(tower.placement.firingOrigin);
  for (const id of preview.chainEnemyIds) {
    const point = enemyPoint(state, id);
    if (!point) continue;
    g.moveTo(previous.x, previous.y)
      .lineTo(point.x, point.y)
      .stroke({ color: 0xd6ccff, width: 2, alpha: 0.65 });
    g.circle(point.x, point.y, id === preview.seedEnemyId ? 11 : 8).stroke({
      color: 0xd6ccff,
      width: 2,
    });
    previous = point;
  }
  drawBlockedLinks(g, state, preview);
};

const drawBlockedLinks = (g: Graphics, state: EncounterState, preview: DischargePreview): void => {
  for (const link of preview.blockedLinks) {
    const from = enemyPoint(state, link.fromEnemyId),
      to = enemyPoint(state, link.toEnemyId);
    if (!from || !to) continue;
    const x = (from.x + to.x) / 2,
      y = (from.y + to.y) / 2;
    g.moveTo(x - 5, y - 5)
      .lineTo(x + 5, y + 5)
      .moveTo(x - 5, y + 5)
      .lineTo(x + 5, y - 5)
      .stroke({ color: 0xed806b, width: 2 });
  }
};
