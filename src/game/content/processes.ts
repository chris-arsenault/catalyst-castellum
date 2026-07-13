import type { ProcessDefinition, ProcessId } from "../types";

export const PROCESS_DEFINITIONS: Record<ProcessId, ProcessDefinition> = {
  chlor_alkali_cell: {
    id: "chlor_alkali_cell",
    name: "Membrane chlor-alkali cell",
    description:
      "Cell current consumes equal NaCl and water feed. Cl₂, H₂, and NaOH leave through isolated headers; a blocked outlet limits the entire cell.",
    reactionId: "chlor_alkali_electrolysis",
    equipmentId: "membrane_cell",
    executor: "electrolysis",
    outputs: [
      {
        phase: "gas",
        speciesId: "chlorine",
        bufferId: "anode_header",
        limitCode: "anode_headroom",
      },
      {
        phase: "gas",
        speciesId: "hydrogen",
        bufferId: "cathode_header",
        limitCode: "cathode_headroom",
      },
      {
        phase: "liquid",
        speciesId: "sodium_hydroxide",
        bufferId: "cell_liquor",
        limitCode: "outlet_headroom",
      },
    ],
    separatorBackflow: {
      leftBufferId: "anode_header",
      rightBufferId: "cathode_header",
      leftSpeciesId: "chlorine",
      rightSpeciesId: "hydrogen",
      activationDifference: 0.48,
      flowOffset: 0.42,
      rate: 0.16,
    },
    accent: "#c5f540",
  },
};
