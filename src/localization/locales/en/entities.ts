export const ENTITY_MESSAGES = {
  "entities.rooms.west_intake.name": "West Breach",
  "entities.rooms.west_intake.description":
    "Hostiles enter through this excavated breach before following the outer spiral.",
  "entities.rooms.switchyard.name": "Upper Outer Bay",
  "entities.rooms.switchyard.description":
    "A high outer chamber on the hostile path with two equipment sockets.",
  "entities.rooms.furnace.name": "Lower Outer Bay",
  "entities.rooms.furnace.description":
    "A deep outer chamber on the hostile path with sockets for thermal and mixing equipment.",
  "entities.rooms.reservoir.name": "Upper Middle Bay",
  "entities.rooms.reservoir.description":
    "A broad middle chamber with two equipment sockets and space for gas–liquid processing.",
  "entities.rooms.gallery.name": "Lower Middle Bay",
  "entities.rooms.gallery.description":
    "A low middle chamber where the inward corridor turns toward the Core.",
  "entities.rooms.lower_intake.name": "Upper Inner Bay",
  "entities.rooms.lower_intake.description":
    "A high inner chamber with two universal equipment sockets beside the Core approach.",
  "entities.rooms.washlock.name": "Lower Inner Bay",
  "entities.rooms.washlock.description":
    "A low inner chamber on the final Core approach with two equipment sockets.",
  "entities.rooms.core.name": "Catalyst Core",
  "entities.rooms.core.description":
    "The central keep houses feedstock, exhaust, recovery, and the structure the facility defends.",

  "entities.equipment.gas_agitator.name": "Gas agitator",
  "entities.equipment.gas_agitator.description":
    "Recirculates the upper and lower gas layers, accelerating eligible gas reactions and combustible mixtures.",
  "entities.equipment.wet_contactor.name": "Wet contactor",
  "entities.equipment.wet_contactor.description":
    "Drives gas–liquid contact and liquid mixing, accelerating every eligible contact reaction.",
  "entities.equipment.thermal_coil.name": "Thermal coil",
  "entities.equipment.thermal_coil.description":
    "Heats the room and both gas layers toward a fixed equipment rating, accelerating temperature-dependent chemistry.",
  "entities.equipment.membrane_cell.name": "Membrane cell",
  "entities.equipment.membrane_cell.description":
    "Electrolyzes NaCl and water into separated Cl₂, H₂, and NaOH outlets at its installed grade.",

  "entities.enemies.crawler.name": "Crawler",
  "entities.enemies.crawler.description":
    "Baseline oxygen-breathing organic with little environmental protection.",
  "entities.enemies.skimmer.name": "Skimmer",
  "entities.enemies.skimmer.description":
    "Fast organic that can outrun a chlorine front still propagating through long lines.",
  "entities.enemies.floater.name": "Floater",
  "entities.enemies.floater.description":
    "Airborne organism that avoids liquid contact but remains vulnerable to room gases.",
  "entities.enemies.shell.name": "Shell",
  "entities.enemies.shell.description":
    "Mineral armor sheds ambient heat and atmosphere but cracks under pressure shock and corrosive liquids.",
  "entities.enemies.bellows.name": "Bellows",
  "entities.enemies.bellows.description":
    "Large insulated respiratory volume resists atmosphere and heat but is vulnerable to corrosion and shock.",

  "entities.species.oxygen.name": "Oxygen",
  "entities.species.nitrogen.name": "Nitrogen",
  "entities.species.carbon_dioxide.name": "Carbon dioxide",
  "entities.species.chlorine.name": "Chlorine",
  "entities.species.hydrogen.name": "Hydrogen",
  "entities.species.hydrogen_chloride.name": "Hydrogen chloride",
  "entities.species.steam.name": "Water vapor",
  "entities.species.water.name": "Water",
  "entities.species.sodium_chloride.name": "Sodium chloride solution",
  "entities.species.sodium_hydroxide.name": "Sodium hydroxide solution",
  "entities.species.sodium_hypochlorite.name": "Sodium hypochlorite solution",
  "entities.species.hydrochloric_acid.name": "Hydrochloric acid",

  "entities.reactions.chlor_alkali_electrolysis.name": "Chlor-alkali electrolysis",
  "entities.reactions.hydrogen_oxygen_combustion.name": "Hydrogen–oxygen flash",
  "entities.reactions.hydrogen_chlorine_recombination.name": "Hydrogen–chlorine recombination",
  "entities.reactions.hydrogen_chloride_absorption.name": "Hydrogen chloride absorption",
  "entities.reactions.acid_neutralization.name": "Acid neutralization",
  "entities.reactions.hypochlorite_formation.name": "Hypochlorite formation",
  "entities.reactions.acid_chlorine_release.name": "Acid-triggered chlorine release",

  "entities.processes.chlor_alkali_cell.name": "Membrane chlor-alkali cell",
  "entities.processes.chlor_alkali_cell.description":
    "Cell current consumes equal NaCl and water feed. Cl₂, H₂, and NaOH leave through isolated headers; a blocked outlet limits the entire cell.",

  "entities.sources.starter_gas_header.name": "Starter gas header",
  "entities.sources.water_tank.name": "Water reserve",
  "entities.sources.sodium_chloride_tank.name": "Sodium chloride reserve",
  "entities.buffers.anode_header.name": "Cl₂ anode header",
  "entities.buffers.cathode_header.name": "H₂ cathode header",
  "entities.buffers.cell_liquor.name": "NaOH cell-liquor outlet",

  "entities.transport.gas:core__furnace.name": "Core–R-02 gas duct",
  "entities.transport.gas:core__furnace.description":
    "Feeds the Core starter-header mixture into R-02.",
  "entities.transport.gas:core__switchyard.name": "Core–R-01 gas duct",
  "entities.transport.gas:core__switchyard.description":
    "Feeds the Core starter-header mixture into R-01.",
  "entities.transport.gas:core__reservoir.name": "Core–R-03 gas duct",
  "entities.transport.gas:core__reservoir.description":
    "Feeds the Core starter-header mixture into R-03.",
  "entities.transport.gas:core__gallery.name": "Core–R-04 gas duct",
  "entities.transport.gas:core__gallery.description":
    "Feeds the Core starter-header mixture into R-04.",
  "entities.transport.gas:furnace__lower_intake.name": "R-05–R-02 gas duct",
  "entities.transport.gas:furnace__lower_intake.description":
    "Carries the R-05 gas-junction stream to R-02.",
  "entities.transport.gas:core__lower_intake.name": "R-05 recovery duct",
  "entities.transport.gas:core__lower_intake.description":
    "Draws the R-05 gas-junction stream into Core recovery.",
  "entities.transport.liquid:core__lower_intake.name": "Core–R-05 feed pipe",
  "entities.transport.liquid:core__lower_intake.description":
    "Pumps mixed water and brine from Core reserves to R-05.",
  "entities.transport.gas:lower_intake__reservoir.name": "R-05–R-03 gas duct",
  "entities.transport.gas:lower_intake__reservoir.description":
    "Carries the R-05 gas-junction stream into R-03.",
  "entities.transport.liquid:lower_intake__reservoir.name": "R-05–R-03 liquor pipe",
  "entities.transport.liquid:lower_intake__reservoir.description":
    "Pumps cell liquor from the R-05 junction into R-03.",
  "entities.transport.gas:furnace__gallery.name": "R-02–R-04 return duct",
  "entities.transport.gas:furnace__gallery.description": "Draws R-02 atmosphere into R-04.",
  "entities.transport.gas:gallery__washlock.name": "R-04–R-06 gas duct",
  "entities.transport.gas:gallery__washlock.description":
    "Delivers the R-04 return stream into R-06.",
  "entities.transport.gas:gallery__switchyard.name": "R-04–R-01 outer duct",
  "entities.transport.gas:gallery__switchyard.description":
    "Diverts the R-04 return stream toward R-01.",
  "entities.transport.gas:core__washlock.name": "R-06 recovery duct",
  "entities.transport.gas:core__washlock.description":
    "Exhausts R-06 atmosphere into Core recovery.",
  "entities.transport.liquid:core__washlock.name": "Core–R-06 solvent pipe",
  "entities.transport.liquid:core__washlock.description": "Pumps Core solvent stock into R-06.",
  "entities.transport.liquid:reservoir__washlock.name": "R-03–R-06 transfer pipe",
  "entities.transport.liquid:reservoir__washlock.description":
    "Transfers stored R-03 liquid into R-06.",
  "entities.transport.liquid:core__reservoir.name": "R-03 recovery pipe",
  "entities.transport.liquid:core__reservoir.description":
    "Returns stored R-03 liquid to Core recovery.",
} as const;
