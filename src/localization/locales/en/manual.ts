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
  "manual.equipment.fluorine_cell.designation": "FC-series anhydrous recovery cell",
  "manual.equipment.fluorine_cell.flavor":
    "Its two sight glasses face opposite aisles, giving each product header a dedicated operator station.",
  "manual.equipment.fluorine_cell.note.1":
    "Consumes two measures of dry hydrogen fluoride for each hydrogen and fluorine pair.",
  "manual.equipment.fluorine_cell.note.2":
    "Places both gas products in the host room, where installed ducts establish separation and recovery.",
  "manual.equipment.fluorine_cell.note.3":
    "Draws more power and occupies more room volume than the chlor-alkali membrane cell at every grade.",
  "manual.reactions.chlor_alkali_electrolysis.doctrine":
    "Maintain balanced liquid feed and continuous space in all three product outlets.",
  "manual.reactions.chlor_alkali_electrolysis.flavor":
    "CL-1 was the process that made the buried works self-sufficient. Every later defense line begins at its bus bars.",
  "manual.reactions.hydrogen_oxygen_combustion.doctrine":
    "Build the combustible ratio in a mixed gas layer and time the flash around room occupancy.",
  "manual.reactions.hydrogen_oxygen_combustion.flavor":
    "The first watch crews called an OX-1 cycle ‘knocking on the gate.’ The gate usually answered with a pressure wave.",
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
  "manual.reactions.water_gas_reaction.doctrine":
    "Pass hot steam across a carbon bed to produce equal carbon monoxide and hydrogen; cooling favors their return to carbon and steam.",
  "manual.reactions.water_gas_reaction.flavor":
    "CS-1 turns a loaded grate and a water line into the first half of a fuel works.",
  "manual.reactions.water_gas_shift.doctrine":
    "Use steam and moderate heat across an iron catalyst to shift carbon monoxide toward carbon dioxide while building hydrogen inventory.",
  "manual.reactions.water_gas_shift.flavor":
    "Shift crews judge the bed by two gauges: the poison entering and the hydrogen leaving.",
  "manual.reactions.boudouard_reaction.doctrine":
    "Heat carbon with carbon dioxide to produce carbon monoxide; cool a rich monoxide stream to plate carbon back onto the room.",
  "manual.reactions.boudouard_reaction.flavor":
    "CS-3 writes the room’s recent temperature history in black across every exposed surface.",
  "manual.reactions.carbon_monoxide_oxidation.doctrine":
    "Mix carbon monoxide with oxygen above the activation range to convert it into carbon dioxide and heat.",
  "manual.reactions.carbon_monoxide_oxidation.flavor":
    "A clean CO reading and a hot wall often describe the same successful burn.",
  "manual.reactions.carbon_methanation.doctrine":
    "Hold carbon, hydrogen, and active nickel together in the warm range to store them as methane.",
  "manual.reactions.carbon_methanation.flavor":
    "CS-6A packs a grate and two measures of hydrogen into one pipeable fuel.",
  "manual.reactions.methane_steam_reforming.doctrine":
    "Drive methane and steam across active nickel at high temperature to recover carbon monoxide and hydrogen.",
  "manual.reactions.methane_steam_reforming.flavor":
    "CS-6B opens the fuel again, trading furnace heat for a larger moving gas stream.",
  "manual.reactions.ammonia_synthesis.doctrine":
    "Compress nitrogen and hydrogen over an iron catalyst, then hold the synthesis temperature to build ammonia.",
  "manual.reactions.ammonia_synthesis.flavor":
    "NO-1 makes the quiet bulk of a room chemically useful, one compressed charge at a time.",
  "manual.reactions.ammonia_oxidation.doctrine":
    "Feed ammonia and oxygen across platinum in the hot window to produce nitric oxide and steam.",
  "manual.reactions.ammonia_oxidation.flavor":
    "The gauze glows before the nitric line begins moving; experienced crews watch both.",
  "manual.reactions.nitric_oxide_oxidation.doctrine":
    "Let nitric oxide cool in oxygen-rich gas to form the denser and more dangerous nitrogen dioxide front.",
  "manual.reactions.nitric_oxide_oxidation.flavor":
    "NO-3 keeps working in transit, and the brown front appears downstream from its source.",
  "manual.reactions.nitrogen_dioxide_absorption.doctrine":
    "Contact nitrogen dioxide with water to bank nitric acid while returning nitric oxide to the gas stream.",
  "manual.reactions.nitrogen_dioxide_absorption.flavor":
    "The absorber clears the air by loading the floor and sending part of the gas around again.",
  "manual.reactions.nox_ammonia_reduction.doctrine":
    "Balance ammonia against nitric oxide in the catalyst window to recover nitrogen and steam.",
  "manual.reactions.nox_ammonia_reduction.flavor":
    "NO-5 closes the nitrogen ledger when feed ratio, oxygen, and temperature agree.",
  "manual.reactions.nitrous_oxide_side_path.doctrine":
    "Track the cooler ammonia-oxidation window where feed diverts into persistent nitrous oxide and steam.",
  "manual.reactions.nitrous_oxide_side_path.flavor":
    "A cold gauze still consumes ammonia; the outlet tells the crew what it made.",
  "manual.reactions.hematite_carbon_monoxide_reduction.doctrine":
    "Pass carbon monoxide across charged hematite to produce carbon dioxide while storing the transferred oxygen as magnetite history.",
  "manual.reactions.hematite_carbon_monoxide_reduction.flavor":
    "FE-1 cleans a gas stream by spending oxygen that entered the room on an earlier shift.",
  "manual.reactions.hematite_hydrogen_reduction.doctrine":
    "Pass hydrogen across charged hematite to produce steam and leave the carrier in its reduced magnetite state.",
  "manual.reactions.hematite_hydrogen_reduction.flavor":
    "FE-2 leaves a wet outlet and a bed ready for air.",
  "manual.reactions.magnetite_reoxidation.doctrine":
    "Feed oxygen through magnetite to recharge hematite while carrying the released heat away.",
  "manual.reactions.magnetite_reoxidation.flavor":
    "The carrier takes its next charge from the room atmosphere and gives the heat back immediately.",
  "manual.reactions.nickel_oxide_reduction.doctrine":
    "Warm nickel oxide in hydrogen to expose active surface nickel and release steam.",
  "manual.reactions.nickel_oxide_reduction.flavor":
    "NI-1 wakes the metal before the transport line can pick it up.",
  "manual.reactions.nickel_carbonyl_formation.doctrine":
    "Cool a carbon-monoxide-rich stream over surface nickel to carry the metal away as nickel carbonyl.",
  "manual.reactions.nickel_carbonyl_formation.flavor":
    "A clear plate and a quiet gauge can mean the nickel has entered the air.",
  "manual.reactions.nickel_carbonyl_deposition.doctrine":
    "Heat nickel carbonyl downstream to plate nickel onto that room and release four measures of carbon monoxide.",
  "manual.reactions.nickel_carbonyl_deposition.flavor":
    "NI-3 moves the metal’s effect farther than the metal bed that supplied it.",
  "manual.reactions.nickel_deposit_oxidation.doctrine":
    "Expose surface nickel to warm oxygen to passivate the coating as recoverable nickel oxide.",
  "manual.reactions.nickel_deposit_oxidation.flavor":
    "An oxide coat quiets the catalyst while keeping every measure of nickel in the room.",
  "manual.reactions.nickel_catalyzed_methanation.doctrine":
    "Bring carbon monoxide and hydrogen across surface nickel in the warm window to produce methane, steam, and heat.",
  "manual.reactions.nickel_catalyzed_methanation.flavor":
    "A plated room keeps changing later gas fronts long after the transport cloud clears.",
  "manual.reactions.uranium_hexafluoride_hydrolysis.doctrine":
    "Keep uranium hexafluoride dry during transport; water vapor converts it into settled uranyl fluoride and hydrogen fluoride.",
  "manual.reactions.uranium_hexafluoride_hydrolysis.flavor":
    "UF-1 makes the first damp room the place where a moving release becomes a lasting cleanup.",
  "manual.reactions.uranyl_fluoride_recovery.doctrine":
    "Heat a dry uranyl fluoride deposit in fluorine to recover uranium hexafluoride and oxygen.",
  "manual.reactions.uranyl_fluoride_recovery.flavor":
    "UF-2 lifts the settled carrier back into the pipe and exposes every trace of retained water.",
  "manual.reactions.hydrogen_fluoride_electrolysis.doctrine":
    "Feed separated, dry hydrogen fluoride through a powered recovery cell to return hydrogen and fluorine to their headers.",
  "manual.reactions.hydrogen_fluoride_electrolysis.flavor":
    "UF-3 closes the fluorine ledger at the price of current, heat, and two dangerous outlet streams.",
  "manual.enemies.deckmouth.classification": "Small Cthonic wreck-feeder",
  "manual.enemies.deckmouth.habitat": "Pressurized wrecks and freshly opened claims",
  "manual.enemies.deckmouth.blurb":
    "Deckmouths arrive first when a cutter opens an old pressure pocket. They nose through warm scrap, breathing whatever air the wreck has kept, and follow the cutter’s return tone all the way back to the rig. Ratters use them as an early warning: one deckmouth means the claim has started answering.",
  "manual.enemies.deckmouth.fieldNote":
    "Seal the cutter after the first mouth, or spend the shift clearing twenty. — Mavo",
  "manual.enemies.flintjack.classification": "Cut-wake pursuit scavenger",
  "manual.enemies.flintjack.habitat": "Live decks, power runs, and active seams",
  "manual.enemies.flintjack.blurb":
    "Flintjacks hunt current and sprint along decks with mouths opening in sequence down one flank. Their name comes from the pale sparks around their feet when they cross a live seam. The remote cutter gives them a bright trail from claim to foundry, so a slow chemical front gives them room to run.",
  "manual.enemies.flintjack.fieldNote":
    "Once a flintjack chooses a live tone, it runs straight at it. Put the trap in front. — T’kesh",
  "manual.enemies.shear_jelly.classification": "Small Shear-jelly",
  "manual.enemies.shear_jelly.habitat": "Open wreck bays and upper gas layers",
  "manual.enemies.shear_jelly.blurb":
    "Shear-jellies drift through broken volumes on gas-filled bells, keeping their stinging filaments above pooled liquid. Their internal eyes turn toward pressure changes before their bodies move. A foundry intake feels like a current to them, and they ride its upper air toward the Core.",
  "manual.enemies.shear_jelly.fieldNote":
    "Track the bell; the hanging threads follow it. The bell turns first. — Long Rake safety circular",
  "manual.enemies.splitback.classification": "Shellback-form Cthonic grazer",
  "manual.enemies.splitback.habitat": "Ringglass rubble and mineral seams",
  "manual.enemies.splitback.blurb":
    "Splitbacks resemble the quiet shellbacks that graze wreck fields, right up to the moment a cutter tone wakes them. Their mineral coat seals the eyes and mouths beneath it against heat and bad air. Corrosion opens the coat; the pale body inside sheds it and bolts for the strongest resonance source.",
  "manual.enemies.splitback.fieldNote":
    "The shell is the slow part. Plan for what comes out of it. — Malk Tern",
  "manual.enemies.redlung.classification": "Deep-wreck redlung form",
  "manual.enemies.redlung.habitat": "Hot holds and sealed industrial cavities",
  "manual.enemies.redlung.blurb":
    "Redlungs carry chambers of folded breath inside bodies built for hot, thin wreck air. That reserve carries them through poison fronts that stop smaller forms. A pressure wave reaches every fold at once, while corrosive chemistry bites into the soft seams around their breathing mouths.",
  "manual.enemies.redlung.fieldNote":
    "A redlung takes a long breath before it moves. Make that breath expensive. — Ratter field note",
  "manual.enemies.clatter.classification": "Cthonic structural clinger",
  "manual.enemies.clatter.habitat": "Shafts, gantries, and ladder wells",
  "manual.enemies.clatter.blurb":
    "Clatters live on the inside faces of broken structures, where hooked limbs find cable runs, ladder rungs, and rough welds. A walking clatter looks patient; on a vertical run it becomes a blur of hard strikes. Crews usually hear the ladder before they see the eyes gathered around its joints.",
  "manual.enemies.clatter.fieldNote":
    "Three knocks is loose steel. A whole ladder talking at once is a clatter. — Mavo",
  "manual.enemies.anchor.classification": "Resonant field-bearer",
  "manual.enemies.anchor.habitat": "Mixed groups following an active cutter wake",
  "manual.enemies.anchor.blurb":
    "An Anchor carries a tuned organ behind its central eye. When other Cthonic forms crowd the same room, that organ holds a shared pressure around them and spends itself under attack. The field rebuilds while the Anchor lives, and crews name it for the job it does.",
  "manual.enemies.anchor.fieldNote":
    "The glow around the pack belongs to the Anchor. Break the held note and every body stands alone. — T’kesh",
  "manual.enemies.glowbag.classification": "Buoyant Cthonic gas-feeder",
  "manual.enemies.glowbag.habitat": "Airless cavities and upper wreck volumes",
  "manual.enemies.glowbag.blurb":
    "Glowbags float on a pale hydrogen crop wrapped around a knot of mouths and internal eyes. They vent as they travel, leaving combustible gas in the upper air. Around the foundry, that hydrogen can feed a flash or consume a chlorine front.",
  "manual.enemies.glowbag.fieldNote":
    "A glowbag carries part of your next reaction. Decide which one before it reaches the room. — T’kesh",
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
  "manual.mechanics.massAction.rate":
    "The simultaneous reaction network caps this path at {rate} extent/s before equipment multiplication.",
  "manual.mechanics.massAction.temperature":
    "Forward activity begins at {start}°C and reaches full thermal activation at {full}°C.",
  "manual.mechanics.massAction.catalyst":
    "Local {catalyst} inventory raises the rate and remains outside the stoichiometric ledger.",
  "manual.mechanics.massAction.orders":
    "Authored first- and second-order activities set the rate from the current room snapshot.",
} as const;
