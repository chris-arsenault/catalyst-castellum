import type { CommandDecision, GameCommand, GameState } from "../game/types";

export type SimulationControl = Extract<
  GameCommand,
  { type: "toggle_pause" | "set_pause" | "set_speed" }
>;

export const isSimulationControl = (command: GameCommand): command is SimulationControl =>
  command.type === "toggle_pause" || command.type === "set_pause" || command.type === "set_speed";

export const simulationControlDecision = (game: GameState): CommandDecision => ({
  allowed: game.phase === "assault",
  code: game.phase === "assault" ? null : "invalid_phase",
  parameters: {},
  cost: 0,
  refund: 0,
  amount: 0,
});

export const INITIAL_SIMULATION_CLOCK = {
  paused: false,
  speed: 1 as const,
  simulationRemainder: 0,
};

/** Wall time belongs to the application. Only whole fixed ticks reach the kernel. */
export const accumulateSimulationTicks = (remainder: number, elapsed: number, speed: 1 | 2) => {
  const accumulated = remainder + Math.min(elapsed, 0.5) * speed;
  const ticks = Math.floor(accumulated / 0.1 + 1e-9);
  return { ticks, remainder: Math.max(0, accumulated - ticks * 0.1) };
};
