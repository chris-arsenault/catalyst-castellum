import type { GameDefinition } from "../definitionTypes";
import type { CommandDecision, CommandResult, GameCommand, GameState } from "../types";
import { acceptCommand } from "./commandResult";
import { cloneGame } from "./roomState";
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
    state.map,
    command.hostRoomId,
    command.hardpointId,
    command.moduleId
  );
  if (!plan) throw new Error(`Graft plan vanished for ${command.hostRoomId}.`);
  replaceStateMap(state, plan.map);
  state.world = worldCatalogsForMap(state.map);
  state.rooms[plan.room.id] = freshRoomState(plan.room.id, definition, state.map);
  state.gasJunctions[plan.room.id] = { gas: emptyGasRecord(state), temperature: 22 };
  state.liquidJunctions[plan.room.id] = { liquid: emptyLiquidRecord(state) };
  state.portalStates[plan.joint.id] = {
    open: true,
    sealed: false,
    lastGasFlow: 0,
    lastLiquidFlow: 0,
  };
  state.matter -= decision.cost;
  return acceptCommand(state);
};

/** Species records match the state's existing record shapes without importing content. */
const emptyGasRecord = (state: GameState): GameState["gasJunctions"][string]["gas"] => {
  const sample = Object.values(state.gasJunctions)[0]?.gas ?? {};
  return Object.fromEntries(
    Object.keys(sample).map((species) => [species, 0])
  ) as GameState["gasJunctions"][string]["gas"];
};

const emptyLiquidRecord = (state: GameState): GameState["liquidJunctions"][string]["liquid"] => {
  const sample = Object.values(state.liquidJunctions)[0]?.liquid ?? {};
  return Object.fromEntries(
    Object.keys(sample).map((species) => [species, 0])
  ) as GameState["liquidJunctions"][string]["liquid"];
};

export const dismantleModuleCommand = (
  source: GameState,
  command: GameCommand & { type: "dismantle_module" },
  decision: CommandDecision
): CommandResult => {
  const state = cloneGame(source);
  const parentJoint = graftParentJoint(state.map, command.roomId);
  if (!parentJoint) throw new Error(`Graft ${command.roomId} lost its parent joint.`);
  replaceStateMap(state, hullPlanningMap(withoutGraft(state.map, command.roomId, parentJoint.id)));
  delete state.rooms[command.roomId];
  delete state.gasJunctions[command.roomId];
  delete state.liquidJunctions[command.roomId];
  delete state.portalStates[parentJoint.id];
  state.matter += decision.refund;
  return acceptCommand(state);
};
