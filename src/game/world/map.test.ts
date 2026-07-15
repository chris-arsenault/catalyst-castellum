import { describe, expect, it } from "vitest";
import { isArchitectural, isProcessLine, processLineId } from "./map";
import type { ArchitecturalConnection, ProcessLineConnection } from "./map";

describe("canonical process-line ids", () => {
  it("yields the same id regardless of room argument order", () => {
    expect(processLineId("gas_line", "core", "furnace")).toBe(
      processLineId("gas_line", "furnace", "core")
    );
    expect(processLineId("gas_line", "core", "furnace")).toBe("gas:core__furnace");
  });

  it("keeps gas and liquid lines on the same pair distinct", () => {
    expect(processLineId("gas_line", "core", "washlock")).not.toBe(
      processLineId("liquid_line", "core", "washlock")
    );
    expect(processLineId("liquid_line", "washlock", "core")).toBe("liquid:core__washlock");
  });
});

describe("connection kind predicates", () => {
  const line: ProcessLineConnection = {
    id: processLineId("gas_line", "core", "furnace"),
    kind: "gas_line",
    rooms: ["core", "furnace"],
    direction: ["core", "furnace"],
    destinationKind: "room",
    actuator: "fan",
    actuatorHead: 2,
    maxFlow: 2,
    volumePerCell: 0.2,
    buildCost: 10,
    route: [
      { column: 0, elevation: 0 },
      { column: 1, elevation: 0 },
    ],
  };
  const portal: ArchitecturalConnection = {
    id: "entry_to_switchyard",
    kind: "passage",
    rooms: ["west_intake", "switchyard"],
    connectorCells: [{ column: 5, elevation: 4 }],
    endpoints: [
      { column: 4, elevation: 4 },
      { column: 6, elevation: 4 },
    ],
    orientation: "horizontal",
    sillElevation: 4,
    aperture: 1,
    gasConductance: 0.2,
    liquidConductance: 0.2,
    liquidMode: "spill",
    defaultOpen: true,
    defaultSealed: false,
    sealGroupId: null,
    hostRoomId: "west_intake",
  };

  it("separates process lines from architectural connections", () => {
    expect(isProcessLine(line)).toBe(true);
    expect(isArchitectural(line)).toBe(false);
    expect(isProcessLine(portal)).toBe(false);
    expect(isArchitectural(portal)).toBe(true);
  });
});
