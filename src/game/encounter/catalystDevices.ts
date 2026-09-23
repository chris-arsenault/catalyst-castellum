import { ensureCatalystSource } from "./catalystCharge";
import type { FieldMode } from "./catalystTypes";
import type { EncounterContext, EncounterState, EncounterTower } from "./types";

export const initializeCatalystDevice = (
  state: EncounterState,
  tower: EncounterTower,
  context: EncounterContext
): void => {
  if (!state.catalyst || context.combat.mechanics.kind !== "catalyst") return;
  ensureCatalystSource(state, tower);
  const device = context.combat.mechanics.devices[tower.chassisId];
  if (!device || device.kind === "weapon" || state.catalyst.devices[tower.id]) return;
  state.catalyst.devices[tower.id] =
    device.kind === "field"
      ? {
          kind: "field",
          mode: device.defaultMode,
          activatesAt: state.elapsed + device.activationSeconds,
        }
      : { kind: "discharge", readyAt: state.elapsed };
};

export const initializeCatalystDevices = (
  state: EncounterState,
  context: EncounterContext
): void => {
  for (const tower of Object.values(state.towers)) initializeCatalystDevice(state, tower, context);
};

export const suspendCatalystField = (
  state: EncounterState,
  towerId: string,
  context: EncounterContext
): void => {
  if (!state.catalyst || context.combat.mechanics.kind !== "catalyst") return;
  const tower = state.towers[towerId];
  if (!tower) return;
  const definition = context.combat.mechanics.devices[tower.chassisId];
  const device = state.catalyst.devices[towerId];
  if (definition?.kind === "field" && device?.kind === "field")
    device.activatesAt = state.elapsed + definition.activationSeconds;
};

export const setCatalystFieldMode = (
  state: EncounterState,
  towerId: string,
  mode: FieldMode,
  context: EncounterContext
): void => {
  const device = state.catalyst?.devices[towerId];
  if (device?.kind !== "field") throw new Error(`Field device ${towerId} is unavailable`);
  device.mode = mode;
  suspendCatalystField(state, towerId, context);
};

export const removeCatalystDevice = (state: EncounterState, towerId: string): void => {
  const catalyst = state.catalyst;
  if (!catalyst) return;
  delete catalyst.devices[towerId];
  if (state.towers[towerId] || sourceHasOutcome(state, towerId) || sourceHasEffect(state, towerId))
    return;
  delete catalyst.sources[towerId];
  delete catalyst.accountingBySource[towerId];
  delete catalyst.directBySource[towerId];
  delete catalyst.damageByDevice[towerId];
  delete catalyst.fieldByDevice[towerId];
};

const sourceHasOutcome = (state: EncounterState, id: string): boolean => {
  const catalyst = state.catalyst!;
  const accounts = [
    catalyst.accountingBySource[id],
    catalyst.directBySource[id],
    catalyst.damageByDevice[id],
    catalyst.fieldByDevice[id],
  ];
  return accounts.some((account) => Object.values(account ?? {}).some((value) => value > 0));
};

const sourceHasEffect = (state: EncounterState, id: string): boolean => {
  const catalyst = state.catalyst!;
  if (state.pendingAttacks.some((attack) => attack.source.sourceId === id)) return true;
  if (state.towerAttacks.some((attack) => attack.towerId === id)) return true;
  if (state.enemies.some((enemy) => enemy.effects.some((effect) => effect.sourceTowerId === id)))
    return true;
  if (
    Object.values(catalyst.chargeByEnemy).some((ledger) => Object.hasOwn(ledger.contributions, id))
  )
    return true;
  return catalyst.pulses.some(
    (pulse) =>
      pulse.sourceId === id ||
      pulse.targets.some((target) => Object.hasOwn(target.contributions, id))
  );
};
