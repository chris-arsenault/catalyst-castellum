export const GAS_TYPES = [
  "oxygen",
  "nitrogen",
  "carbon_dioxide",
  "carbon_monoxide",
  "chlorine",
  "hydrogen",
  "hydrogen_chloride",
  "steam",
  "methane",
  "ammonia",
  "nitric_oxide",
  "nitrogen_dioxide",
  "nitrous_oxide",
  "nickel_carbonyl",
  "uranium_hexafluoride",
  "hydrogen_fluoride",
  "fluorine",
] as const;

export const GAS_ZONES = ["lower", "upper"] as const;

export const LIQUID_TYPES = [
  "water",
  "sodium_chloride",
  "sodium_hydroxide",
  "sodium_hypochlorite",
  "hydrochloric_acid",
  "nitric_acid",
] as const;

/** Room-bound solids. These inventories never enter a gas or liquid pipe. */
export const STATIONARY_TYPES = [
  "solid_carbon",
  "hematite",
  "magnetite",
  "nickel_oxide",
  "surface_nickel",
  "uranyl_fluoride",
  "iron_catalyst",
  "platinum_catalyst",
] as const;

export const ENEMY_TYPES = [
  "deckmouth",
  "flintjack",
  "shear_jelly",
  "splitback",
  "redlung",
  "clatter",
  "anchor",
  "glowbag",
] as const;

export const EQUIPMENT_OUTPUT_IDS = ["anode_header", "cathode_header", "cell_liquor"] as const;

export const EQUIPMENT_IDS = [
  "gas_agitator",
  "wet_contactor",
  "thermal_coil",
  "membrane_cell",
  "fluorine_cell",
  "catalytic_reactor",
  "packed_bed",
  "catalytic_burner",
  "absorber_column",
] as const;

export const EQUIPMENT_SOCKET_IDS = ["socket_a", "socket_b"] as const;
export const EQUIPMENT_LEVELS = [1, 2, 3] as const;

export const DAMAGE_SOURCE_IDS = [
  "asphyxiation",
  "carbon_monoxide",
  "chlorine_gas",
  "hydrogen_chloride_gas",
  "liquid_corrosion",
  "nitrogen_chemistry",
  "nickel_carbonyl",
  "hydrogen_fluoride",
  "fluorine",
  "uranium_chemistry",
  "thermal_exposure",
  "catastrophic_overpressure",
  "hydrogen_oxygen_combustion",
] as const;

export const PROCESS_FAMILY_IDS = [
  "chlorine_sodium",
  "carbon_steam",
  "nitrogen_oxide",
  "iron",
  "nickel",
  "uranium_fluorine",
] as const;

export const REACTION_REGIMES = ["wild", "engineered"] as const;

export const REACTION_IDS = [
  "chlor_alkali_electrolysis",
  "hydrogen_oxygen_combustion",
  "hydrogen_chlorine_recombination",
  "hydrogen_chloride_absorption",
  "acid_neutralization",
  "hypochlorite_formation",
  "acid_chlorine_release",
  "water_gas_reaction",
  "water_gas_shift",
  "boudouard_reaction",
  "carbon_monoxide_oxidation",
  "carbon_methanation",
  "methane_steam_reforming",
  "ammonia_synthesis",
  "ammonia_oxidation",
  "nitric_oxide_oxidation",
  "nitrogen_dioxide_absorption",
  "nox_ammonia_reduction",
  "nitrous_oxide_side_path",
  "hematite_carbon_monoxide_reduction",
  "hematite_hydrogen_reduction",
  "magnetite_reoxidation",
  "nickel_oxide_reduction",
  "nickel_carbonyl_formation",
  "nickel_carbonyl_deposition",
  "nickel_deposit_oxidation",
  "nickel_catalyzed_methanation",
  "uranium_hexafluoride_hydrolysis",
  "uranyl_fluoride_recovery",
  "hydrogen_fluoride_electrolysis",
] as const;

export const LEVEL_IDS = [
  "flash_point",
  "make_the_reagent",
  "stored_chlorine",
  "morrow_pocket",
  "kettleblack",
  "cordon_41",
  "junction_l6",
  "pell_cut",
  "station_14",
  "vasker_store",
  "lane_six",
  "pell_cordon",
] as const;

export const ROOM_REACTION_IDS = [
  "hydrogen_oxygen_combustion",
  "hydrogen_chlorine_recombination",
  "hydrogen_chloride_absorption",
  "acid_neutralization",
  "hypochlorite_formation",
  "acid_chlorine_release",
  "water_gas_reaction",
  "water_gas_shift",
  "boudouard_reaction",
  "carbon_monoxide_oxidation",
  "carbon_methanation",
  "methane_steam_reforming",
  "ammonia_synthesis",
  "ammonia_oxidation",
  "nitric_oxide_oxidation",
  "nitrogen_dioxide_absorption",
  "nox_ammonia_reduction",
  "nitrous_oxide_side_path",
  "hematite_carbon_monoxide_reduction",
  "hematite_hydrogen_reduction",
  "magnetite_reoxidation",
  "nickel_oxide_reduction",
  "nickel_carbonyl_formation",
  "nickel_carbonyl_deposition",
  "nickel_deposit_oxidation",
  "nickel_catalyzed_methanation",
  "uranium_hexafluoride_hydrolysis",
  "uranyl_fluoride_recovery",
] as const;

export const GAME_PHASES = [
  "level_briefing",
  "build",
  "prime",
  "assault",
  "round_result",
  "level_complete",
  "travel",
  "victory",
  "defeat",
] as const;

export const TRANSPORT_PHASES = ["gas", "liquid"] as const;

export const FLOW_CAUSES = [
  "idle",
  "priming",
  "pressure",
  "buoyancy",
  "fan",
  "gravity",
  "siphon",
  "pump",
  "backpressure",
] as const;

export const ENEMY_LOCOMOTION_MODES = ["walking", "climbing", "falling", "door", "flying"] as const;

export const EVENT_TONES = ["info", "good", "warning", "danger", "reaction"] as const;

export const GAME_EVENT_CODES = [
  "assault_started",
  "campaign_completed",
  "chlorine_evolution_started",
  "core_breached",
  "enemy_neutralized",
  "enemy_molted",
  "equipment_installed",
  "equipment_upgraded",
  "vessel_medium_loaded",
  "flash_cycle_started",
  "flash_incident",
  "gas_source_charged",
  "hcl_production_started",
  "level_planning_started",
  "liquid_source_charged",
  "prime_started",
  "equipment_operation_started",
  "round_advanced",
  "round_completed",
  "separator_cross_leak",
  "scenario_started",
  "scenario_defeated",
  "travel_started",
] as const;

export const LIMIT_CONDITION_CODES = [
  "conditions",
  "offline",
  "activation_temperature",
  "aqueous_solvent",
  "product_concentration",
  "liquid_headroom",
  "liquid_mixing",
  "gas_headroom",
  "anode_headroom",
  "cathode_headroom",
  "outlet_headroom",
  "cell_current",
  "ignition_hydrogen",
  "ignition_oxygen",
  "gas_agitation",
  "combustible_batch",
  "cooldown",
  "reaction_kinetics",
  "reaction_temperature",
  "reaction_pressure",
  "catalyst_inventory",
  "reaction_inhibition",
  "vessel_medium",
  "vessel_rate",
] as const;

export const SIMULATION_SPEEDS = [1, 2] as const;
