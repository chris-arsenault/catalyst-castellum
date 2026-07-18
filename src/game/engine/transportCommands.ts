import { emptyGas, emptyLiquid } from "../materials";
import type { GameDefinition } from "../definitionTypes";
import type {
  CommandDecision,
  CommandResult,
  GameCommand,
  GameState,
  GasConduitState,
  GridCell,
  LiquidConduitState,
} from "../types";
import { acceptCommand } from "./commandResult";
import { cloneGame } from "./roomState";
import { conduitState } from "../world/instances";
import { isProcessLine, processLineId, type ProcessLineConnection } from "../world/map";
import { withConnection } from "../world/mapEdits";
import { plannedLineConnection, withoutConnection } from "../world/processLineEdits";
import { worldCatalogsForMap } from "../world/catalogs";

export const setConduitCommand = (
  source: GameState,
  command: GameCommand & { type: "set_conduit" }
): CommandResult => {
  const state = cloneGame(source);
  conduitState(state, command.connectionId).enabled = command.enabled;
  return acceptCommand(state);
};

const newGasConduit = (route: readonly GridCell[]): GasConduitState => ({
  enabled: false,
  route: route.map((cell) => ({ ...cell })),
  gas: emptyGas(),
  temperature: 22,
  lastFlow: 0,
  lastSpeciesFlow: emptyGas(),
  blocked: false,
  flowCause: "idle",
});

const newLiquidConduit = (route: readonly GridCell[]): LiquidConduitState => ({
  enabled: false,
  route: route.map((cell) => ({ ...cell })),
  liquid: emptyLiquid(),
  lastFlow: 0,
  lastSpeciesFlow: emptyLiquid(),
  blocked: false,
  flowCause: "idle",
});

/** A minting build is a map edit: new frozen map, bumped revision, grown catalogs. */
const appendLine = (state: GameState, line: ProcessLineConnection): void => {
  state.map = withConnection(state.map, line);
  state.mapRevision += 1;
  state.world = worldCatalogsForMap(state.map);
  if (line.kind === "gas_line") state.gasConduits[line.id] = newGasConduit(line.route);
  else state.liquidConduits[line.id] = newLiquidConduit(line.route);
};

export const buildConnectionCommand = (
  source: GameState,
  command: GameCommand & { type: "build_connection" },
  decision: CommandDecision,
  definition: GameDefinition
): CommandResult => {
  const state = cloneGame(source);
  const connectionId = processLineId(command.kind, command.fromRoomId, command.toRoomId);
  if (connectionId in state.map.connections)
    throw new Error(`Build attempted for existing connection ${connectionId}.`);
  const line = plannedLineConnection(
    definition,
    state.map,
    command.kind,
    command.fromRoomId,
    command.toRoomId
  );
  if (!line) throw new Error(`No legal route for ${connectionId}.`);
  appendLine(state, line);
  state.matter -= decision.cost;
  return acceptCommand(state);
};

export const dismantleConnectionCommand = (
  source: GameState,
  command: GameCommand & { type: "dismantle_connection" },
  decision: CommandDecision
): CommandResult => {
  const state = cloneGame(source);
  const line = state.map.connections[command.connectionId];
  if (!line || !isProcessLine(line))
    throw new Error(`Dismantle attempted for unknown connection ${command.connectionId}.`);
  state.map = withoutConnection(state.map, command.connectionId);
  state.mapRevision += 1;
  state.world = worldCatalogsForMap(state.map);
  if (line.kind === "gas_line") delete state.gasConduits[command.connectionId];
  else delete state.liquidConduits[command.connectionId];
  state.matter += decision.refund;
  return acceptCommand(state);
};
