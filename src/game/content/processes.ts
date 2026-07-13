import type { ProcessDefinition, ProcessId } from "../types";

export const PROCESS_DEFINITIONS: Record<ProcessId, ProcessDefinition> = {
  chlor_alkali_cell: {
    id: "chlor_alkali_cell",
    name: "Membrane chlor-alkali cell",
    description:
      "Cell current consumes equal NaCl and water feed. Cl₂, H₂, and NaOH leave through isolated headers; a blocked outlet limits the entire cell.",
    reactionId: "chlor_alkali_electrolysis",
    equipmentId: "membrane_cell",
    accent: "#b4dc45",
  },
};
