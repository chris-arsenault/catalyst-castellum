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
import { processLineId, type ProcessLineConnection } from "../world/map";
import { plannedLineConnection, withConnection } from "../world/mapEdits";

export const setConduitCommand = (
  source: GameState,
  command: GameCommand & { type: "set_conduit" }
): CommandResult => {
  const state = cloneGame(source);
  conduitState(state, command.connectionId).enabled = command.enabled;
  return acceptCommand(state);
};

const newGasConduit = (route: readonly GridCell[]): GasConduitState => ({
  installed: false,
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
  installed: false,
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
  state.world = {
    rooms: state.world.rooms,
    connections: [...state.world.connections, line.id],
  };
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
  if (!(connectionId in state.map.connections)) {
    const line = plannedLineConnection(
      definition,
      state.map,
      command.kind,
      command.fromRoomId,
      command.toRoomId
    );
    if (!line) throw new Error(`No legal route for ${connectionId}.`);
    appendLine(state, line);
  }
  state.matter -= decision.cost;
  const next = conduitState(state, connectionId);
  next.installed = true;
  next.enabled = false;
  return acceptCommand(state);
};

export const dismantleConnectionCommand = (
  source: GameState,
  command: GameCommand & { type: "dismantle_connection" },
  decision: CommandDecision
): CommandResult => {
  const state = cloneGame(source);
  const next = conduitState(state, command.connectionId);
  next.installed = false;
  next.enabled = false;
  state.matter += decision.refund;
  return acceptCommand(state);
};
