import { describe, expect, it } from "vitest";
import { createScenarioGame, executeCommand } from "../../game/simulation";
import { DEFAULT_GAME_DEFINITION } from "../../game/definition";
import { cellOutletAssemblyModel } from "./cellOutletRenderModel";

describe("membrane-cell outlet rendering", () => {
  it("renders the outlet assembly only in the installed cell room", () => {
    const initial = executeCommand(createScenarioGame("cordon_41"), {
      type: "begin_level",
    }).state;
    const round = DEFAULT_GAME_DEFINITION.levels.cordon_41.rounds.at(-1)!;
    initial.campaign.roundIndex = DEFAULT_GAME_DEFINITION.levels.cordon_41.rounds.length - 1;
    initial.availability = {
      towers: [...round.availability.towers],
      equipment: [...round.availability.equipment],
      gasLines: [...round.availability.gasLines],
      liquidLines: [...round.availability.liquidLines],
    };
    initial.matter = 999;
    expect(cellOutletAssemblyModel(initial)).toBeNull();

    const installed = executeCommand(initial, {
      type: "install_equipment",
      roomId: "switchyard",
      socketId: "socket_a",
      equipmentId: "membrane_cell",
    });
    expect(installed.accepted, installed.code ?? undefined).toBe(true);
    const model = cellOutletAssemblyModel(installed.state);

    expect(model?.roomId).toBe("switchyard");
    expect(model?.header).toBe("C41-1 CELL OUTPUTS");
    expect(model?.outlets.map((outlet) => outlet.formula)).toEqual(["Cl₂", "H₂", "NaOH(aq)"]);
  });
});
