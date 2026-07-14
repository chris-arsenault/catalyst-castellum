export const MANUAL_MESSAGES = {
  "manual.categories.atmosphere": "Atmosphere",
  "manual.categories.contact": "Gas–liquid",
  "manual.categories.thermal": "Thermal",
  "manual.categories.process": "Process plant",
  "manual.equipment.gas_agitator.designation": "GA-series chamber recirculator",
  "manual.equipment.gas_agitator.flavor":
    "Old watch crews called it the Lung. Its opposed rotors keep a chamber’s two atmospheres arguing until both tell the same story.",
  "manual.equipment.gas_agitator.note.1":
    "Exchanges material between the upper and lower gas layers every simulation tick.",
  "manual.equipment.gas_agitator.note.2":
    "Enables OX-1 ignition and reduces the combustible batch required for each flash.",
  "manual.equipment.gas_agitator.note.3":
    "Multiplies eligible gas-reaction kinetics, including CL-2 hydrogen–chlorine recombination.",
  "manual.equipment.wet_contactor.designation": "WC-series packed contact tower",
  "manual.equipment.wet_contactor.flavor":
    "The tower carries the scratches of three abandoned commissioning crews. The fourth crew learned to respect the sump sight glass.",
  "manual.equipment.wet_contactor.note.1":
    "Creates active gas–liquid contact in the lower chamber layer.",
  "manual.equipment.wet_contactor.note.2":
    "Multiplies absorption, neutralization, hypochlorite formation, and chlorine-release kinetics.",
  "manual.equipment.wet_contactor.note.3":
    "Liquid inventory supplies the mixing factor, and every reaction requires its reactants and headroom.",
  "manual.equipment.thermal_coil.designation": "TC-series resistance furnace",
  "manual.equipment.thermal_coil.flavor":
    "The coil’s ceramic crowns came from the first Castellum switchgear. Their makers expected a century of darkness and built accordingly.",
  "manual.equipment.thermal_coil.note.1":
    "Raises the room body and both gas layers toward the installed grade’s rated temperature.",
  "manual.equipment.thermal_coil.note.2":
    "Brings CL-2 above its 38°C activation point and toward full activation at 66°C.",
  "manual.equipment.thermal_coil.note.3":
    "Hot gas also increases thermal exposure and can vaporize retained water above the boiling range.",
  "manual.equipment.membrane_cell.designation": "MC-series divided electrolyzer",
  "manual.equipment.membrane_cell.flavor":
    "Three colored lamps are the cell keeper’s entire creed: green for the anode, amber for the cathode, violet for the liquor line.",
  "manual.equipment.membrane_cell.note.1":
    "Consumes water and sodium chloride together through CL-1 cell current.",
  "manual.equipment.membrane_cell.note.2":
    "Produces chlorine, hydrogen, and sodium hydroxide into three equipment-owned outlet buffers.",
  "manual.equipment.membrane_cell.note.3":
    "The smallest reactant supply or outlet headroom sets the entire cell rate; uneven gas headers can cross-leak.",
  "manual.reactions.chlor_alkali_electrolysis.doctrine":
    "Maintain balanced liquid feed and continuous space in all three product outlets.",
  "manual.reactions.chlor_alkali_electrolysis.flavor":
    "CL-1 was the process that made the buried works self-sufficient. Every later defense line begins at its bus bars.",
  "manual.reactions.hydrogen_oxygen_combustion.doctrine":
    "Build the combustible ratio in a mixed gas layer and time the flash around room occupancy.",
  "manual.reactions.hydrogen_oxygen_combustion.flavor":
    "The first wardens called an OX-1 cycle ‘knocking on the gate.’ The gate usually answered with a pressure wave.",
  "manual.reactions.hydrogen_chlorine_recombination.doctrine":
    "Hold equal hydrogen and chlorine in a heated, actively mixed gas layer.",
  "manual.reactions.hydrogen_chlorine_recombination.flavor":
    "CL-2 turned the old return duct into a weapon. The stone around R-02 still carries its sour iron stain.",
  "manual.reactions.hydrogen_chloride_absorption.doctrine":
    "Bring hydrogen chloride into contact with a liquid inventory and preserve product headroom.",
  "manual.reactions.hydrogen_chloride_absorption.flavor":
    "The P-1 pages are warped from generations of wet gloves. Operators trusted the tower and watched the liquor.",
  "manual.reactions.acid_neutralization.doctrine":
    "Treat shared acid and caustic inventory as a competing sink before planning downstream chemistry.",
  "manual.reactions.acid_neutralization.flavor":
    "CL-3 appears in the manual under losses, cleanup, and occasionally salvation. Context decides which heading applies.",
  "manual.reactions.hypochlorite_formation.doctrine":
    "Contact chlorine with a strong caustic pool to bank oxidizer for later transfer.",
  "manual.reactions.hypochlorite_formation.flavor":
    "CL-4 gave the Castellum a way to bottle a gas front in a room that enemies had yet to reach.",
  "manual.reactions.acid_chlorine_release.doctrine":
    "Deliver stored hypochlorite into an acid-rich contact room with available gas volume.",
  "manual.reactions.acid_chlorine_release.flavor":
    "CL-5 carries a red margin line in every surviving workbook. The line marks where the delayed weapon becomes immediate.",
  "manual.enemies.crawler.flavor":
    "The breach breeds these first. Their route discipline makes them predictable and their numbers make prediction useful.",
  "manual.enemies.skimmer.flavor":
    "A skimmer spends its life in one forward motion. Long pipes and late reactions are the openings it understands.",
  "manual.enemies.floater.flavor":
    "The sacs keep it above every pool and level with the upper atmosphere. Pressure reaches the whole body at once.",
  "manual.enemies.shell.flavor":
    "Its mineral coat treats bad air as weather. Strong liquid chemistry finds seams beneath the coat.",
  "manual.enemies.bellows.flavor":
    "A bellows carries a roomful of breath inside itself. Shock travels through that volume more readily than poison.",
  "manual.mechanics.electrolysis.rate": "Live rate follows the installed Membrane Cell grade.",
  "manual.mechanics.electrolysis.heat": "Each extent adds {heat}°C-equivalent room heat.",
  "manual.mechanics.electrolysis.limits":
    "Reactant availability and the smallest outlet headroom compete as rate limits.",
  "manual.mechanics.flash.ignition":
    "Ignition requires at least {hydrogen}% H₂ and {oxygen}% O₂ in one agitated gas layer.",
  "manual.mechanics.flash.extent":
    "A flash consumes up to {extent} extent and resets a {cooldown}s layer cooldown.",
  "manual.mechanics.flash.pressure":
    "Pressure impulse starts at {base} kPa-equivalent and gains {gain} per extent.",
  "manual.mechanics.recombination.activation":
    "Reaction begins above {start}°C and reaches full thermal activation at {full}°C.",
  "manual.mechanics.recombination.rate":
    "Base rate caps at {rate} extent/s before Gas Agitator multiplication.",
  "manual.mechanics.recombination.heat": "Each extent adds {heat}°C-equivalent gas heat.",
  "manual.mechanics.absorption.rate":
    "Base rate caps at {rate} extent/s before Wet Contactor multiplication.",
  "manual.mechanics.absorption.solvent":
    "The solvent factor reaches full strength at {amount} mol-eq of liquid inventory.",
  "manual.mechanics.absorption.ceiling":
    "Product concentration approaches a {percent}% HCl(aq) ceiling.",
  "manual.mechanics.contact.rate":
    "Base rate caps at {rate} extent/s before Wet Contactor multiplication.",
  "manual.mechanics.contact.mixing":
    "The liquid mixing factor reaches full strength at {amount} mol-eq.",
  "manual.mechanics.contact.heat": "Each extent adds {heat}°C-equivalent room heat.",
} as const;
