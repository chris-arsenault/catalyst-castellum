import type { GameDefinition } from "../definitionTypes";
import type { CommandDecision, CommandResult, GameCommand, GameState } from "../types";
import { acceptCommand } from "./commandResult";
import { cloneGame } from "./gameState";
import { freshRoomState } from "./scenarioState";
import { graftParentJoint, plannedGraft } from "../world/graft";
import { withoutGraft } from "../world/mapEdits";
import { worldCatalogsForMap } from "../world/catalogs";
import { hullPlanningMap } from "../world/hullFragment";
import { replaceStateMap } from "./mapEditState";

export const graftModuleCommand = (
  source: GameState,
  command: GameCommand & { type: "graft_module" },
  decision: CommandDecision,
  definition: GameDefinition
): CommandResult => {
  const state = cloneGame(source);
  const plan = plannedGraft(
    definition,
    state.encounter.map,
    command.hostRoomId,
    command.graftSlotId,
    command.moduleId
  );
  if (!plan) throw new Error(`Graft plan vanished for ${command.hostRoomId}.`);
  replaceStateMap(state, plan.map);
  state.encounter.world = worldCatalogsForMap(state.encounter.map);
  state.encounter.process.rooms[plan.room.id] = freshRoomState(
    plan.room.id,
    definition,
    state.encounter.map
  );
  state.encounter.process.gasJunctions[plan.room.id] = {
    gas: emptyGasRecord(state),
    temperature: 22,
  };
  state.encounter.process.liquidJunctions[plan.room.id] = { liquid: emptyLiquidRecord(state) };
  state.encounter.portalStates[plan.joint.id] = {
    open: true,
    sealed: false,
    lastGasFlow: 0,
    lastLiquidFlow: 0,
  };
  state.encounter.matter -= decision.cost;
  return acceptCommand(state);
};

/** Species records match the state's existing record shapes without importing content. */
const emptyGasRecord = (
  state: GameState
): GameState["encounter"]["process"]["gasJunctions"][string]["gas"] => {
  const sample = Object.values(state.encounter.process.gasJunctions)[0]?.gas ?? {};
  return Object.fromEntries(
    Object.keys(sample).map((species) => [species, 0])
  ) as GameState["encounter"]["process"]["gasJunctions"][string]["gas"];
};

const emptyLiquidRecord = (
  state: GameState
): GameState["encounter"]["process"]["liquidJunctions"][string]["liquid"] => {
  const sample = Object.values(state.encounter.process.liquidJunctions)[0]?.liquid ?? {};
  return Object.fromEntries(
    Object.keys(sample).map((species) => [species, 0])
  ) as GameState["encounter"]["process"]["liquidJunctions"][string]["liquid"];
};

export const dismantleModuleCommand = (
  source: GameState,
  command: GameCommand & { type: "dismantle_module" },
  decision: CommandDecision
): CommandResult => {
  const state = cloneGame(source);
  const parentJoint = graftParentJoint(state.encounter.map, command.roomId);
  if (!parentJoint) throw new Error(`Graft ${command.roomId} lost its parent joint.`);
  replaceStateMap(
    state,
    hullPlanningMap(withoutGraft(state.encounter.map, command.roomId, parentJoint.id))
  );
  delete state.encounter.process.rooms[command.roomId];
  delete state.encounter.process.gasJunctions[command.roomId];
  delete state.encounter.process.liquidJunctions[command.roomId];
  delete state.encounter.portalStates[parentJoint.id];
  state.encounter.matter += decision.refund;
  return acceptCommand(state);
};
