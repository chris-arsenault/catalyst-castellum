export const COMMAND_MESSAGES = {
  "commands.rejection.already_complete": "This objective is complete.",
  "commands.rejection.already_installed": "This conduit is already built.",
  "commands.rejection.capacity": "Current capacity blocks this action.",
  "commands.rejection.empty_socket": "This socket is ready for equipment.",
  "commands.rejection.insufficient_matter": "This action requires {cost} matter.",
  "commands.rejection.invalid_phase": "The current phase keeps this action locked.",
  "commands.rejection.not_installed": "Build this conduit to activate its controls.",
  "commands.rejection.occupied_socket": "Dismantle the installed equipment to reuse this socket.",
  "commands.rejection.placement": "Choose a compatible equipment socket.",
  "commands.rejection.route_unavailable":
    "This route has an authored phase available for selection.",
  "commands.rejection.unavailable": "The current operation keeps this option sealed.",
  "commands.rejection.unique_equipment": "The facility already contains this unique equipment.",
  "commands.rejection.fallback": "Command rejected.",
} as const;
