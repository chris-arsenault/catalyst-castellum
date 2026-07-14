import { describe, expect, it } from "vitest";
import { createScenarioGame, executeCommand } from "../../game/simulation";
import { cellOutletAssemblyModel } from "./cellOutletRenderModel";

describe("membrane-cell outlet rendering", () => {
  it("renders the outlet assembly only in the installed cell room", () => {
    const initial = executeCommand(createScenarioGame("make_the_reagent"), {
      type: "begin_level",
    }).state;
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
    expect(model?.header).toBe("R-01 CELL OUTPUTS");
    expect(model?.outlets.map((outlet) => outlet.formula)).toEqual(["Cl₂", "H₂", "NaOH"]);
  });
});
