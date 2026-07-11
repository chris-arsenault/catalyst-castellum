import { describe, expect, it } from "vitest";
import { createInitialGame, enemyRoomId, executeCommand, gasPercent, stepGame } from "./simulation";
import type { DeviceKey, GameState, RoomId } from "./types";

const tryCommand = (state: GameState, roomId: RoomId, device: DeviceKey): GameState => {
  const result = executeCommand(state, { type: "activate_device", roomId, device });
  return result.accepted ? result.state : state;
};

const occupancy = (state: GameState, roomId: RoomId): number =>
  state.enemies.filter((enemy) => enemyRoomId(enemy) === roomId).length;

const ensureGas = (
  state: GameState,
  roomId: RoomId,
  gas: "toxic_gas" | "fuel_gas",
  minimum: number,
  device: DeviceKey
): GameState =>
  gasPercent(state.rooms[roomId], gas) < minimum ? tryCommand(state, roomId, device) : state;

const ensureLiquid = (
  state: GameState,
  roomId: RoomId,
  liquid: "acid" | "sludge" | "water",
  minimum: number,
  device: DeviceKey
): GameState =>
  state.rooms[roomId].liquid[liquid] < minimum ? tryCommand(state, roomId, device) : state;

const installOpeningPlan = (state: GameState): GameState => {
  const plan: Array<[RoomId, DeviceKey]> = [
    ["gallery", "gas_toxic"],
    ["reservoir", "liquid_sludge"],
    ["furnace", "door"],
    ["switchyard", "fan"],
  ];
  return plan.reduce((current, [roomId, device]) => {
    const result = executeCommand(current, { type: "install_device", roomId, device });
    return result.accepted ? result.state : current;
  }, state);
};

const preparePrimeTick = (source: GameState): GameState => {
  let state = ensureGas(source, "switchyard", "toxic_gas", 0.48, "gas_toxic");
  state = ensureGas(state, "furnace", "fuel_gas", 0.34, "gas_fuel");
  state = ensureLiquid(state, "reservoir", "acid", 34, "liquid_acid");
  state = ensureLiquid(state, "reservoir", "sludge", 18, "liquid_sludge");
  return ensureGas(state, "gallery", "toxic_gas", 0.42, "gas_toxic");
};

const primeBase = (source: GameState): GameState => {
  let state = executeCommand(source, { type: "start_prime" }).state;
  for (let tick = 0; tick < 180; tick += 1) {
    if (tick % 10 === 0) state = preparePrimeTick(state);
    state = stepGame(state, 0.1);
  }
  return executeCommand(state, { type: "start_assault" }).state;
};

type RoomOperator = (state: GameState, inside: number) => GameState;

const operateSwitchyard: RoomOperator = (source, inside) => {
  const state = inside >= 2 ? tryCommand(source, "switchyard", "door") : source;
  return ensureGas(state, "switchyard", "toxic_gas", 0.43, "gas_toxic");
};

const operateFurnace: RoomOperator = (source, inside) => {
  let state = inside >= 2 ? tryCommand(source, "furnace", "door") : source;
  state = ensureGas(state, "furnace", "fuel_gas", 0.18, "gas_fuel");
  return gasPercent(state.rooms.furnace, "fuel_gas") >= 0.16
    ? tryCommand(state, "furnace", "igniter")
    : state;
};

const operateReservoir: RoomOperator = (source) => {
  const state = ensureLiquid(source, "reservoir", "acid", 25, "liquid_acid");
  return ensureLiquid(state, "reservoir", "sludge", 15, "liquid_sludge");
};

const operateGallery: RoomOperator = (source, inside) => {
  const state = inside >= 2 ? tryCommand(source, "gallery", "door") : source;
  return ensureGas(state, "gallery", "toxic_gas", 0.38, "gas_toxic");
};

const operateWashlock: RoomOperator = (source) => {
  const state = ensureLiquid(source, "washlock", "water", 4, "liquid_water");
  return state.rooms.washlock.liquid.water >= 4 ? tryCommand(state, "washlock", "boiler") : state;
};

const DEFENSE_ROOMS: Array<[RoomId, RoomOperator]> = [
  ["switchyard", operateSwitchyard],
  ["furnace", operateFurnace],
  ["reservoir", operateReservoir],
  ["gallery", operateGallery],
  ["washlock", operateWashlock],
];

const operateDefense = (source: GameState): GameState => {
  let state = source;
  for (const [roomId, operate] of DEFENSE_ROOMS) {
    const inside = occupancy(state, roomId);
    if (inside > 0) state = operate(state, inside);
  }
  return stepGame(state, 0.1);
};

describe("campaign balance smoke test", () => {
  it("allows a mixed, occupancy-timed defense to survive all five cycles", () => {
    let state = installOpeningPlan(createInitialGame());
    let safety = 0;

    while (state.phase !== "victory" && state.phase !== "defeat" && safety < 12_000) {
      if (state.phase === "build") state = primeBase(state);
      else if (state.phase === "assault") state = operateDefense(state);
      else state = stepGame(state, 0.1);
      safety += 1;
    }

    expect(
      state.phase,
      `campaign stopped at cycle ${state.cycle} with ${state.coreIntegrity}% core`
    ).toBe("victory");
    expect(state.coreIntegrity).toBeGreaterThan(0);
    expect(safety).toBeLessThan(12_000);
  });
});
