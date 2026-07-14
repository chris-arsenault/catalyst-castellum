import { describe, expect, it } from "vitest";
import { equipmentGradeEffect } from "../presentation/equipmentCopy";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "./definition";
import { roomGasMixingRate } from "./engine/equipment";
import { roomHazards } from "./engine/physics";
import { simulateProcesses } from "./engine/processExecutor";
import { createScenarioGame as createScenarioGameForDefinition } from "./engine/scenarioState";
import { createScenarioGame } from "./simulation";

describe("definition extension contracts", () => {
  it("drives engine behavior and copy from one equipment-grade definition", () => {
    const baseEquipment = DEFAULT_GAME_DEFINITION.equipment.gas_agitator;
    const grade = {
      ...baseEquipment.grades[0]!,
      behavior: { kind: "gas_agitator" as const, layerExchangeRate: 9, reactionMultiplier: 4 },
    };
    const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "equipment-extension",
      equipment: {
        ...DEFAULT_GAME_DEFINITION.equipment,
        gas_agitator: {
          ...baseEquipment,
          grades: [grade, baseEquipment.grades[1], baseEquipment.grades[2]],
        },
      },
    });
    const state = createScenarioGameForDefinition("flash_point", [], definition);
    state.rooms.furnace.equipment.socket_a = {
      equipmentId: "gas_agitator",
      level: 1,
      enabled: true,
    };

    expect(roomGasMixingRate(state.rooms.furnace, definition)).toBe(9);
    expect(equipmentGradeEffect(grade)).toBe("9 layer exchange · 4× gas kinetics");
  });

  it("adds or removes species hazard policy without a physics branch", () => {
    const state = createScenarioGame("flash_point");
    state.rooms.furnace.gas.lower.chlorine = 20;
    const hazardous = roomHazards(
      state.rooms.furnace,
      true,
      true,
      "lower",
      DEFAULT_GAME_DEFINITION
    );
    const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "hazard-extension",
      species: {
        ...DEFAULT_GAME_DEFINITION.species,
        chlorine: { ...DEFAULT_GAME_DEFINITION.species.chlorine, hazards: [] },
      },
    });
    const inert = roomHazards(state.rooms.furnace, true, true, "lower", definition);

    expect(hazardous.atmosphere + hazardous.corrosion).toBeGreaterThan(0);
    expect(inert.atmosphere + inert.corrosion).toBe(0);
  });

  it("routes process products through declared dependencies instead of fixed buffer IDs", () => {
    const baseProcess = DEFAULT_GAME_DEFINITION.processes.chlor_alkali_cell;
    const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "process-output-extension",
      processes: {
        chlor_alkali_cell: {
          ...baseProcess,
          outputs: baseProcess.outputs.map((output) =>
            output.speciesId === "chlorine"
              ? { ...output, bufferId: "cathode_header", limitCode: "cathode_headroom" }
              : output
          ),
          separatorBackflow: null,
        },
      },
    });
    const state = createScenarioGameForDefinition("commissioning_exam", [], definition);
    state.rooms.lower_intake.liquid.water = 10;
    state.rooms.lower_intake.liquid.sodium_chloride = 10;
    simulateProcesses(state, 0.5, definition);

    expect(state.gasBuffers.cathode_header.gas.chlorine).toBeGreaterThan(0);
    expect(state.gasBuffers.anode_header.gas.chlorine).toBe(0);
  });
});
