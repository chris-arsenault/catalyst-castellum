import type { CombatDefinition, EncounterState } from "../encounter/types";
import { towerDefinition } from "../encounter/catalogs";
import type { CommandDecision, CommandRejectionCode, GameCommand } from "../types";
import { resolveTowerPlacement, towerPlacementIssue, towerRoomId } from "./towerPlacement";

const allow = (
  values: Partial<Pick<CommandDecision, "cost" | "refund">> = {}
): CommandDecision => ({
  allowed: true,
  code: null,
  parameters: {},
  amount: 0,
  cost: values.cost ?? 0,
  refund: values.refund ?? 0,
});

const reject = (
  code: CommandRejectionCode,
  values: Partial<Pick<CommandDecision, "cost" | "refund">> = {}
): CommandDecision => ({ ...allow(values), allowed: false, code, parameters: values });

const phaseAllowed = (state: EncounterState): CommandDecision | null =>
  state.phase === "build" || state.phase === "assault" ? null : reject("invalid_phase");

const placementDecision = (
  state: EncounterState,
  command: Extract<GameCommand, { type: "place_tower" | "move_tower" }>,
  definition: Pick<CombatDefinition, "towers">
): CommandDecision | null => {
  const chassisId =
    command.type === "place_tower" ? command.chassisId : state.towers[command.towerId]?.chassisId;
  if (!chassisId) return reject("not_installed");
  const placement = resolveTowerPlacement(
    chassisId,
    command.anchor,
    command.mountFace,
    command.orientation,
    definition
  );
  const issue = towerPlacementIssue(
    state,
    chassisId,
    placement,
    definition,
    command.type === "move_tower" ? command.towerId : null
  );
  if (!issue) return null;
  const code = issue === "route_obstruction" ? "route_unavailable" : "placement";
  return reject(code);
};

const evaluatePlace = (
  state: EncounterState,
  command: Extract<GameCommand, { type: "place_tower" }>,
  definition: Pick<CombatDefinition, "towers">
): CommandDecision => {
  const phase = phaseAllowed(state);
  if (phase) return phase;
  const chassis = definition.towers[command.chassisId];
  if (!chassis || !state.availability.towers.includes(command.chassisId))
    return reject("unavailable");
  const placement = placementDecision(state, command, definition);
  if (placement) return placement;
  if (state.matter < chassis.buildCost)
    return reject("insufficient_matter", { cost: chassis.buildCost });
  return allow({ cost: chassis.buildCost });
};

const evaluateMove = (
  state: EncounterState,
  command: Extract<GameCommand, { type: "move_tower" }>,
  definition: Pick<CombatDefinition, "towers">
): CommandDecision => {
  const phase = phaseAllowed(state);
  if (phase) return phase;
  if (!state.towers[command.towerId]) return reject("not_installed");
  return placementDecision(state, command, definition) ?? allow();
};

const evaluateRotate = (
  state: EncounterState,
  command: Extract<GameCommand, { type: "rotate_tower" }>,
  definition: Pick<CombatDefinition, "towers">
): CommandDecision => {
  const phase = phaseAllowed(state);
  if (phase) return phase;
  const tower = state.towers[command.towerId];
  if (!tower) return reject("not_installed");
  const move: Extract<GameCommand, { type: "move_tower" }> = {
    type: "move_tower",
    towerId: tower.id,
    anchor: tower.placement.anchor,
    mountFace: tower.placement.mountFace,
    orientation: command.orientation,
  };
  return evaluateMove(state, move, definition);
};

const evaluateTargeting = (
  state: EncounterState,
  command: Extract<GameCommand, { type: "set_tower_targeting" }>,
  definition: Pick<CombatDefinition, "towers">
): CommandDecision => {
  const phase = phaseAllowed(state);
  if (phase) return phase;
  const tower = state.towers[command.towerId];
  if (!tower) return reject("not_installed");
  return towerDefinition(definition, tower.chassisId).targetPolicies.includes(command.policy)
    ? allow()
    : reject("unavailable");
};

const evaluateUpgrade = (
  state: EncounterState,
  command: Extract<GameCommand, { type: "upgrade_tower" }>,
  definition: Pick<CombatDefinition, "towers">
): CommandDecision => {
  const phase = phaseAllowed(state);
  if (phase) return phase;
  const tower = state.towers[command.towerId];
  if (!tower) return reject("not_installed");
  if (tower.upgrades.includes(command.upgradeId)) return reject("already_complete");
  const upgrade = towerDefinition(definition, tower.chassisId).upgrades.find(
    (candidate) => candidate.id === command.upgradeId
  );
  if (!upgrade || !upgrade.requires.every((required) => tower.upgrades.includes(required)))
    return reject("unavailable");
  if (state.matter < upgrade.cost) return reject("insufficient_matter", { cost: upgrade.cost });
  return allow({ cost: upgrade.cost });
};

const evaluateDismantle = (
  state: EncounterState,
  command: Extract<GameCommand, { type: "dismantle_tower" }>,
  definition: Pick<CombatDefinition, "towers">
): CommandDecision => {
  const phase = phaseAllowed(state);
  if (phase) return phase;
  const tower = state.towers[command.towerId];
  if (!tower) return reject("not_installed");
  const ratio = towerDefinition(definition, tower.chassisId).recoveryRatio;
  if (
    state.process?.towerResources[tower.id] &&
    !state.process.rooms[towerRoomId(state, tower) ?? ""]
  )
    return reject("unavailable");
  return allow({ refund: Math.floor(tower.totalMatterSpent * ratio) });
};

export const evaluateTowerCommand = (
  state: EncounterState,
  command: Extract<
    GameCommand,
    {
      type:
        | "place_tower"
        | "move_tower"
        | "rotate_tower"
        | "set_tower_targeting"
        | "upgrade_tower"
        | "dismantle_tower";
    }
  >,
  definition: Pick<CombatDefinition, "towers">
): CommandDecision => {
  if (command.type === "place_tower") return evaluatePlace(state, command, definition);
  if (command.type === "move_tower") return evaluateMove(state, command, definition);
  if (command.type === "rotate_tower") return evaluateRotate(state, command, definition);
  if (command.type === "set_tower_targeting") return evaluateTargeting(state, command, definition);
  if (command.type === "upgrade_tower") return evaluateUpgrade(state, command, definition);
  return evaluateDismantle(state, command, definition);
};
