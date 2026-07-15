export const GAS_TYPES = [
  "oxygen",
  "nitrogen",
  "carbon_dioxide",
  "chlorine",
  "hydrogen",
  "hydrogen_chloride",
  "steam",
] as const;

export const GAS_ZONES = ["lower", "upper"] as const;

export const LIQUID_TYPES = [
  "water",
  "sodium_chloride",
  "sodium_hydroxide",
  "sodium_hypochlorite",
  "hydrochloric_acid",
] as const;

export const ENEMY_TYPES = ["crawler", "skimmer", "floater", "shell", "bellows"] as const;
export const ENEMY_ROUTE_IDS = ["entry_to_core"] as const;

export const GAS_SOURCE_IDS = ["starter_gas_header"] as const;
export const LIQUID_SOURCE_IDS = ["water_tank", "sodium_chloride_tank"] as const;
export const GAS_BUFFER_IDS = ["anode_header", "cathode_header"] as const;
export const LIQUID_BUFFER_IDS = ["cell_liquor"] as const;

export const TRANSPORT_RUN_IDS = [
  "core_furnace",
  "core_switchyard",
  "core_reservoir",
  "core_gallery",
  "cell_furnace",
  "core_cell",
  "cell_absorber",
  "furnace_return",
  "return_final",
  "return_outer",
  "core_final",
  "absorber_final",
  "core_absorber",
] as const;

export const EQUIPMENT_IDS = [
  "gas_agitator",
  "wet_contactor",
  "thermal_coil",
  "membrane_cell",
] as const;

export const EQUIPMENT_SOCKET_IDS = ["socket_a", "socket_b"] as const;
export const EQUIPMENT_LEVELS = [1, 2, 3] as const;

export const PROCESS_IDS = ["chlor_alkali_cell"] as const;

export const DAMAGE_SOURCE_IDS = [
  "atmospheric_exposure",
  "surface_corrosion",
  "thermal_exposure",
  "catastrophic_overpressure",
  "radiation_field",
  "hydrogen_oxygen_combustion",
  "legacy_unattributed",
] as const;

export const REACTION_IDS = [
  "chlor_alkali_electrolysis",
  "hydrogen_oxygen_combustion",
  "hydrogen_chlorine_recombination",
  "hydrogen_chloride_absorption",
  "acid_neutralization",
  "hypochlorite_formation",
  "acid_chlorine_release",
] as const;

export const LEVEL_IDS = [
  "flash_point",
  "make_the_reagent",
  "acid_line",
  "stored_chlorine",
  "commissioning_exam",
] as const;

export const ROOM_REACTION_IDS = [
  "hydrogen_oxygen_combustion",
  "hydrogen_chlorine_recombination",
  "hydrogen_chloride_absorption",
  "acid_neutralization",
  "hypochlorite_formation",
  "acid_chlorine_release",
] as const;

export const ROOM_IDS = [
  "west_intake",
  "switchyard",
  "furnace",
  "reservoir",
  "gallery",
  "lower_intake",
  "washlock",
  "core",
] as const;

export const GAME_PHASES = [
  "level_briefing",
  "build",
  "prime",
  "assault",
  "round_result",
  "level_complete",
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
  "equipment_installed",
  "equipment_upgraded",
  "flash_cycle_started",
  "flash_incident",
  "gas_source_charged",
  "hcl_production_started",
  "legacy_message",
  "level_planning_started",
  "liquid_source_charged",
  "physical_conduit_migrated",
  "prime_started",
  "process_started",
  "round_advanced",
  "round_completed",
  "separator_cross_leak",
  "scenario_started",
  "scenario_defeated",
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
] as const;

export const SIMULATION_SPEEDS = [1, 2] as const;
