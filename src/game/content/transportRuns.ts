import type {
  ConduitDestinationKind,
  ConduitPhaseDefinition,
  TransportRunDefinition,
} from "../facilityTypes";
import type { RoomId, TransportRunId } from "../types";
import { CONDUIT_BLUEPRINTS } from "./facilityGeometry";

interface PhaseOptions {
  actuator: "fan" | "pump" | "passive";
  actuatorHead: number;
  buildCost: number;
  description: string;
  direction: readonly [RoomId, RoomId];
  maxFlow: number;
  name: string;
  phase: "gas" | "liquid";
  runId: TransportRunId;
  volumePerCell: number;
}

const phase = (
  options: PhaseOptions,
  destinationKind: ConduitDestinationKind = "room"
): ConduitPhaseDefinition => {
  const blueprint = CONDUIT_BLUEPRINTS[options.runId][options.phase];
  if (!blueprint) throw new Error(`${options.runId} has no ${options.phase} conduit blueprint`);
  return {
    name: options.name,
    description: options.description,
    direction: options.direction,
    destinationKind,
    actuator: options.actuator,
    actuatorHead: options.actuatorHead,
    maxFlow: options.maxFlow,
    volumePerCell: options.volumePerCell,
    buildCost: options.buildCost,
    blueprint,
  };
};

export const TRANSPORT_RUNS: Record<TransportRunId, TransportRunDefinition> = {
  core_furnace: {
    id: "core_furnace",
    rooms: ["core", "furnace"],
    gas: phase({
      runId: "core_furnace",
      phase: "gas",
      name: "Core–R-02 gas duct",
      description: "One shared fan moves the complete Core starter-header mixture into R-02.",
      direction: ["core", "furnace"],
      actuator: "fan",
      actuatorHead: 2.2,
      maxFlow: 2.2,
      volumePerCell: 0.22,
      buildCost: 10,
    }),
    liquid: null,
  },
  cell_furnace: {
    id: "cell_furnace",
    rooms: ["lower_intake", "furnace"],
    gas: phase({
      runId: "cell_furnace",
      phase: "gas",
      name: "R-05–R-02 gas duct",
      description:
        "Moves the complete unfiltered R-05 gas-junction mixture toward the hot chamber.",
      direction: ["lower_intake", "furnace"],
      actuator: "fan",
      actuatorHead: 1.8,
      maxFlow: 1.15,
      volumePerCell: 0.24,
      buildCost: 8,
    }),
    liquid: null,
  },
  core_cell: {
    id: "core_cell",
    rooms: ["core", "lower_intake"],
    gas: phase(
      {
        runId: "core_cell",
        phase: "gas",
        name: "R-05 recovery duct",
        description:
          "Pulls the whole R-05 junction mixture into the Core vent; it is not H2-selective.",
        direction: ["lower_intake", "core"],
        actuator: "fan",
        actuatorHead: 1.45,
        maxFlow: 0.8,
        volumePerCell: 0.2,
        buildCost: 7,
      },
      "gas_vent"
    ),
    liquid: phase({
      runId: "core_cell",
      phase: "liquid",
      name: "Core–R-05 feed pipe",
      description: "One pump carries the mixed water-and-brine stock to the cell room.",
      direction: ["core", "lower_intake"],
      actuator: "pump",
      actuatorHead: 34,
      maxFlow: 1.55,
      volumePerCell: 0.26,
      buildCost: 10,
    }),
  },
  cell_absorber: {
    id: "cell_absorber",
    rooms: ["lower_intake", "reservoir"],
    gas: phase({
      runId: "cell_absorber",
      phase: "gas",
      name: "R-05–R-03 gas duct",
      description: "Carries every gas present in the R-05 junction into the absorber room.",
      direction: ["lower_intake", "reservoir"],
      actuator: "fan",
      actuatorHead: 1.55,
      maxFlow: 1.05,
      volumePerCell: 0.22,
      buildCost: 7,
    }),
    liquid: phase({
      runId: "cell_absorber",
      phase: "liquid",
      name: "R-05–R-03 liquor pipe",
      description: "Pumps the whole unfiltered cell-liquor junction mixture into R-03.",
      direction: ["lower_intake", "reservoir"],
      actuator: "pump",
      actuatorHead: 24,
      maxFlow: 0.85,
      volumePerCell: 0.25,
      buildCost: 8,
    }),
  },
  furnace_return: {
    id: "furnace_return",
    rooms: ["furnace", "gallery"],
    gas: phase({
      runId: "furnace_return",
      phase: "gas",
      name: "R-02–R-04 return duct",
      description: "Pulls the complete R-02 atmosphere into the return chamber.",
      direction: ["furnace", "gallery"],
      actuator: "fan",
      actuatorHead: 1.5,
      maxFlow: 1.2,
      volumePerCell: 0.24,
      buildCost: 7,
    }),
    liquid: null,
  },
  return_final: {
    id: "return_final",
    rooms: ["gallery", "washlock"],
    gas: phase({
      runId: "return_final",
      phase: "gas",
      name: "R-04–R-06 gas duct",
      description: "Delivers the entire return mixture into the final contact room.",
      direction: ["gallery", "washlock"],
      actuator: "fan",
      actuatorHead: 1.35,
      maxFlow: 1.15,
      volumePerCell: 0.23,
      buildCost: 6,
    }),
    liquid: null,
  },
  return_outer: {
    id: "return_outer",
    rooms: ["gallery", "switchyard"],
    gas: phase({
      runId: "return_outer",
      phase: "gas",
      name: "R-04–R-01 outer duct",
      description: "Moves the same unfiltered return mixture toward the outer corridor.",
      direction: ["gallery", "switchyard"],
      actuator: "fan",
      actuatorHead: 1.5,
      maxFlow: 0.9,
      volumePerCell: 0.2,
      buildCost: 8,
    }),
    liquid: null,
  },
  core_final: {
    id: "core_final",
    rooms: ["core", "washlock"],
    gas: phase(
      {
        runId: "core_final",
        phase: "gas",
        name: "R-06 recovery duct",
        description: "Exhausts the complete R-06 atmosphere into Core recovery.",
        direction: ["washlock", "core"],
        actuator: "fan",
        actuatorHead: 1.4,
        maxFlow: 0.95,
        volumePerCell: 0.21,
        buildCost: 9,
      },
      "gas_vent"
    ),
    liquid: phase({
      runId: "core_final",
      phase: "liquid",
      name: "Core–R-06 solvent pipe",
      description: "Pumps the whole Core liquid-stock mixture into R-06.",
      direction: ["core", "washlock"],
      actuator: "pump",
      actuatorHead: 24,
      maxFlow: 0.75,
      volumePerCell: 0.24,
      buildCost: 10,
    }),
  },
  absorber_final: {
    id: "absorber_final",
    rooms: ["reservoir", "washlock"],
    gas: null,
    liquid: phase({
      runId: "absorber_final",
      phase: "liquid",
      name: "R-03–R-06 transfer pipe",
      description: "Moves the whole stored R-03 liquid mixture to the final room.",
      direction: ["reservoir", "washlock"],
      actuator: "pump",
      actuatorHead: 24,
      maxFlow: 1.05,
      volumePerCell: 0.23,
      buildCost: 6,
    }),
  },
  core_absorber: {
    id: "core_absorber",
    rooms: ["core", "reservoir"],
    gas: null,
    liquid: phase(
      {
        runId: "core_absorber",
        phase: "liquid",
        name: "R-03 recovery pipe",
        description: "Recovers the complete R-03 liquid mixture at Core.",
        direction: ["reservoir", "core"],
        actuator: "pump",
        actuatorHead: 22,
        maxFlow: 0.7,
        volumePerCell: 0.22,
        buildCost: 9,
      },
      "liquid_recovery"
    ),
  },
};
