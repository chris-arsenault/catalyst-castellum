import type { EnemyType, EquipmentId, ReactionDefinition, ReactionId } from "../game/types";

export type EquipmentCategory = "atmosphere" | "contact" | "thermal" | "process";

export interface EquipmentManualEntry {
  category: EquipmentCategory;
  designation: string;
  flavor: string;
  image: string;
  operationalNotes: readonly string[];
  reactionIds: readonly ReactionId[];
}

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  atmosphere: "Atmosphere",
  contact: "Gas–liquid",
  thermal: "Thermal",
  process: "Process plant",
};

export const EQUIPMENT_MANUAL: Record<EquipmentId, EquipmentManualEntry> = {
  gas_agitator: {
    category: "atmosphere",
    designation: "GA-series chamber recirculator",
    flavor:
      "Old watch crews called it the Lung. Its opposed rotors keep a chamber’s two atmospheres arguing until both tell the same story.",
    image: "/manual/equipment/gas-agitator.webp",
    operationalNotes: [
      "Exchanges material between the upper and lower gas layers every simulation tick.",
      "Enables OX-1 ignition and reduces the combustible batch required for each flash.",
      "Multiplies eligible gas-reaction kinetics, including CL-2 hydrogen–chlorine recombination.",
    ],
    reactionIds: ["hydrogen_oxygen_combustion", "hydrogen_chlorine_recombination"],
  },
  wet_contactor: {
    category: "contact",
    designation: "WC-series packed contact tower",
    flavor:
      "The tower carries the scratches of three abandoned commissioning crews. The fourth crew learned to respect the sump sight glass.",
    image: "/manual/equipment/wet-contactor.webp",
    operationalNotes: [
      "Creates active gas–liquid contact in the lower chamber layer.",
      "Multiplies absorption, neutralization, hypochlorite formation, and chlorine-release kinetics.",
      "Liquid inventory still supplies the mixing factor and every reaction still requires its own reactants and headroom.",
    ],
    reactionIds: [
      "hydrogen_chloride_absorption",
      "acid_neutralization",
      "hypochlorite_formation",
      "acid_chlorine_release",
    ],
  },
  thermal_coil: {
    category: "thermal",
    designation: "TC-series resistance furnace",
    flavor:
      "The coil’s ceramic crowns came from the first Castellum switchgear. Their makers expected a century of darkness and built accordingly.",
    image: "/manual/equipment/thermal-coil.webp",
    operationalNotes: [
      "Raises the room body and both gas layers toward the installed grade’s rated temperature.",
      "Brings CL-2 above its 38°C activation point and toward full activation at 66°C.",
      "Hot gas also increases thermal exposure and can vaporize retained water above the boiling range.",
    ],
    reactionIds: ["hydrogen_chlorine_recombination"],
  },
  membrane_cell: {
    category: "process",
    designation: "MC-series divided electrolyzer",
    flavor:
      "Three colored lamps are the cell keeper’s entire creed: green for the anode, amber for the cathode, violet for the liquor line.",
    image: "/manual/equipment/membrane-cell.webp",
    operationalNotes: [
      "Consumes water and sodium chloride together through CL-1 cell current.",
      "Produces chlorine, hydrogen, and sodium hydroxide into three equipment-owned outlet buffers.",
      "The smallest reactant supply or outlet headroom sets the entire cell rate; uneven gas headers can cross-leak.",
    ],
    reactionIds: ["chlor_alkali_electrolysis"],
  },
};

export interface ReactionManualEntry {
  doctrine: string;
  flavor: string;
}

export const REACTION_MANUAL: Record<ReactionId, ReactionManualEntry> = {
  chlor_alkali_electrolysis: {
    doctrine: "Maintain balanced liquid feed and continuous space in all three product outlets.",
    flavor:
      "CL-1 was the process that made the buried works self-sufficient. Every later defense line begins at its bus bars.",
  },
  hydrogen_oxygen_combustion: {
    doctrine:
      "Build the combustible ratio in a mixed gas layer and time the flash around room occupancy.",
    flavor:
      "The first wardens called an OX-1 cycle ‘knocking on the gate.’ The gate usually answered with a pressure wave.",
  },
  hydrogen_chlorine_recombination: {
    doctrine: "Hold equal hydrogen and chlorine in a heated, actively mixed gas layer.",
    flavor:
      "CL-2 turned the old return duct into a weapon. The stone around R-02 still carries its sour iron stain.",
  },
  hydrogen_chloride_absorption: {
    doctrine:
      "Bring hydrogen chloride into contact with a liquid inventory and preserve product headroom.",
    flavor:
      "The P-1 pages are warped from generations of wet gloves. Operators trusted the tower and watched the liquor.",
  },
  acid_neutralization: {
    doctrine:
      "Treat shared acid and caustic inventory as a competing sink before planning downstream chemistry.",
    flavor:
      "CL-3 appears in the manual under losses, cleanup, and occasionally salvation. Context decides which heading applies.",
  },
  hypochlorite_formation: {
    doctrine: "Contact chlorine with a strong caustic pool to bank oxidizer for later transfer.",
    flavor:
      "CL-4 gave the Castellum a way to bottle a gas front in a room that enemies had yet to reach.",
  },
  acid_chlorine_release: {
    doctrine:
      "Deliver stored hypochlorite into an acid-rich contact room with available gas volume.",
    flavor:
      "CL-5 carries a red margin line in every surviving workbook. The line marks where the delayed weapon becomes immediate.",
  },
};

export const equipmentForReaction = (reactionId: ReactionId): EquipmentId[] =>
  (Object.entries(EQUIPMENT_MANUAL) as [EquipmentId, EquipmentManualEntry][]).flatMap(
    ([equipmentId, entry]) => (entry.reactionIds.includes(reactionId) ? [equipmentId] : [])
  );

const percent = (value: number): string => `${Math.round(value * 100)}%`;

export const reactionMechanics = (reaction: ReactionDefinition): string[] => {
  const behavior = reaction.behavior;
  switch (behavior.kind) {
    case "electrolysis":
      return [
        "Live rate follows the installed Membrane Cell grade.",
        `Each extent adds ${behavior.roomHeatPerExtent.toFixed(2)}°C-equivalent room heat.`,
        "Reactant availability and the smallest outlet headroom compete as rate limits.",
      ];
    case "flash":
      return [
        `Ignition requires at least ${percent(behavior.minimumHydrogenFraction)} H₂ and ${percent(
          behavior.minimumOxygenFraction
        )} O₂ in one agitated gas layer.`,
        `A flash consumes up to ${behavior.maximumExtent} extent and resets a ${behavior.cooldownSeconds.toFixed(
          1
        )}s layer cooldown.`,
        `Pressure impulse starts at ${behavior.pressurePulseBase} kPa-equivalent and gains ${behavior.pressurePulsePerExtent} per extent.`,
      ];
    case "gas_recombination":
      return [
        `Reaction begins above ${behavior.activationTemperature}°C and reaches full thermal activation at ${
          behavior.activationTemperature + behavior.activationRange
        }°C.`,
        `Base rate caps at ${behavior.maximumRate.toFixed(2)} extent/s before Gas Agitator multiplication.`,
        `Each extent adds ${behavior.gasHeatPerExtent.toFixed(1)}°C-equivalent gas heat.`,
      ];
    case "absorption":
      return [
        `Base rate caps at ${behavior.maximumRate.toFixed(2)} extent/s before Wet Contactor multiplication.`,
        `The solvent factor reaches full strength at ${behavior.solventInventoryScale} mol-eq of liquid inventory.`,
        `Product concentration approaches a ${percent(behavior.maximumProductFraction)} HCl(aq) ceiling.`,
      ];
    case "mixed_contact":
      return [
        `Base rate caps at ${behavior.maximumRate.toFixed(2)} extent/s before Wet Contactor multiplication.`,
        `The liquid mixing factor reaches full strength at ${behavior.mixingInventoryScale} mol-eq.`,
        `Each extent adds ${behavior.roomHeatPerExtent.toFixed(2)}°C-equivalent room heat.`,
      ];
  }
};

export const ENEMY_MANUAL_FLAVOR: Record<EnemyType, string> = {
  crawler:
    "The breach breeds these first. Their route discipline makes them predictable and their numbers make prediction useful.",
  skimmer:
    "A skimmer spends its life in one forward motion. Long pipes and late reactions are the openings it understands.",
  floater:
    "The sacs keep it above every pool and level with the upper atmosphere. Pressure reaches the whole body at once.",
  shell:
    "Its mineral coat treats bad air as weather. Strong liquid chemistry finds seams beneath the coat.",
  bellows:
    "A bellows carries a roomful of breath inside itself. Shock travels through that volume more readily than poison.",
};
