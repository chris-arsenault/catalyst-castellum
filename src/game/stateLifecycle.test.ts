import { describe, expect, it } from "vitest";
import { cloneGame, createScenarioGame, executeCommand, stepGame } from "./simulation";

const isObject = (value: unknown): value is object => typeof value === "object" && value !== null;

const deepFreeze = <Value>(value: Value): Value => {
  if (!isObject(value) || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
};

const expectNoSharedObjects = (source: unknown, clone: unknown, path = "game"): void => {
  // The map is immutable between edits and deliberately shared so the derived
  // geometry cache holds across clones (plan M2); an edit replaces the object.
  if (path === "game.map") return;
  if (!isObject(source) || !isObject(clone)) return;
  expect(clone, `${path} shares an object with its source`).not.toBe(source);
  if (Array.isArray(source) && Array.isArray(clone)) {
    source.forEach((value, index) =>
      expectNoSharedObjects(value, clone[index], `${path}.${index}`)
    );
    return;
  }
  for (const [key, value] of Object.entries(source)) {
    expectNoSharedObjects(value, Reflect.get(clone, key), `${path}.${key}`);
  }
};

describe("game-state snapshot lifecycle", () => {
  it("deep-clones every reference-valued branch", () => {
    const source = createScenarioGame("commissioning_exam");
    const clone = cloneGame(source);
    expect(clone).toEqual(source);
    expectNoSharedObjects(source, clone);
  });

  it("does not mutate a frozen source while stepping", () => {
    let source = executeCommand(createScenarioGame("flash_point"), { type: "begin_level" }).state;
    source = executeCommand(source, { type: "start_prime" }).state;
    deepFreeze(source);
    expect(() => stepGame(source, 0.1)).not.toThrow();
  });

  it("does not mutate a frozen source while applying a command", () => {
    const source = executeCommand(createScenarioGame("flash_point"), { type: "begin_level" }).state;
    deepFreeze(source);
    expect(() =>
      executeCommand(source, {
        type: "install_equipment",
        roomId: "furnace",
        socketId: "socket_a",
        equipmentId: "gas_agitator",
      })
    ).not.toThrow();
  });
});
