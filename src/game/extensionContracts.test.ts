import { describe, expect, it } from "vitest";
import { equipmentGradeEffect } from "../presentation/equipmentCopy";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "./definition";
import { createEquipmentInstance, roomGasMixingRate } from "./engine/equipment";
import { roomHazards } from "./engine/physics";
import { simulateEquipmentOperations } from "./engine/equipmentOperations";
import { createScenarioGame as createScenarioGameForDefinition } from "./engine/scenarioState";
import { createScenarioGame } from "./simulation";
import { roomState } from "./world/instances";

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
    roomState(state, "furnace").equipment.socket_a = {
      equipmentId: "gas_agitator",
      level: 1,
      enabled: true,
      operation: null,
    };

    expect(roomGasMixingRate(roomState(state, "furnace"), definition)).toBe(9);
    expect(equipmentGradeEffect(grade)).toBe("9 layer exchange · 4× gas kinetics");
  });

  it("adds or removes species hazard policy without a physics branch", () => {
    const state = createScenarioGame("flash_point");
    roomState(state, "furnace").gas.lower.chlorine = 20;
    const hazardous = roomHazards(
      roomState(state, "furnace"),
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
    const inert = roomHazards(roomState(state, "furnace"), true, true, "lower", definition);

    expect(hazardous.atmosphere + hazardous.corrosion).toBeGreaterThan(0);
    expect(inert.atmosphere + inert.corrosion).toBe(0);
  });

  it("saturates species damage at its authored effective-excess bound", () => {
    const moderate = createScenarioGame("flash_point");
    roomState(moderate, "furnace").gas.lower.chlorine = 20;
    const concentrated = createScenarioGame("flash_point");
    roomState(concentrated, "furnace").gas.lower.chlorine = 60;

    const moderateHazard = roomHazards(
      roomState(moderate, "furnace"),
      true,
      true,
      "lower",
      DEFAULT_GAME_DEFINITION
    );
    const concentratedHazard = roomHazards(
      roomState(concentrated, "furnace"),
      true,
      true,
      "lower",
      DEFAULT_GAME_DEFINITION
    );

    expect(concentratedHazard.atmosphere).toBeCloseTo(moderateHazard.atmosphere, 8);
    expect(concentratedHazard.corrosion).toBeCloseTo(moderateHazard.corrosion, 8);
  });
});

describe("powered equipment extension contracts", () => {
  it("routes powered-reaction products through the installed equipment's authored ports", () => {
    const baseEquipment = DEFAULT_GAME_DEFINITION.equipment.membrane_cell;
    const operation = baseEquipment.operation;
    if (!operation) throw new Error("Membrane cell operation missing.");
    const definition = deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "equipment-output-extension",
      equipment: {
        ...DEFAULT_GAME_DEFINITION.equipment,
        membrane_cell: {
          ...baseEquipment,
          operation: {
            ...operation,
            outputs: operation.outputs.map((output) => {
              if (output.speciesId === "chlorine")
                return { ...output, id: "cathode_header", limitCode: "cathode_headroom" };
              if (output.speciesId === "hydrogen")
                return { ...output, id: "anode_header", limitCode: "anode_headroom" };
              return output;
            }),
            separatorBackflow: null,
          },
        },
      },
    });
    const state = createScenarioGameForDefinition("morrow_pocket", [], definition);
    roomState(state, "lower_intake").equipment.socket_a = createEquipmentInstance(
      { equipmentId: "membrane_cell", level: 1, enabled: true },
      definition
    );
    roomState(state, "lower_intake").liquid.water = 10;
    roomState(state, "lower_intake").liquid.sodium_chloride = 10;
    simulateEquipmentOperations(state, 0.5, definition);

    const instance = roomState(state, "lower_intake").equipment.socket_a;
    const cathode = instance?.operation?.outputs.cathode_header;
    const anode = instance?.operation?.outputs.anode_header;
    expect(cathode?.phase === "gas" ? cathode.gas.chlorine : 0).toBeGreaterThan(0);
    expect(anode?.phase === "gas" ? anode.gas.chlorine : 0).toBe(0);
  });
});
