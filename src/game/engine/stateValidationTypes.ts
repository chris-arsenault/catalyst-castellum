export type StateValidationCode =
  | "availability_mismatch"
  | "world_catalog_mismatch"
  | "campaign_mismatch"
  | "conduit_route_invalid"
  | "enemy_navigation_invalid"
  | "enemy_level_invalid"
  | "enemy_behavior_invalid"
  | "identity_mismatch"
  | "identifier_sequence_invalid"
  | "phase_invariant_invalid"
  | "portal_identity_mismatch";

export interface StateValidationIssue {
  code: StateValidationCode;
  path: string;
  message: string;
}
