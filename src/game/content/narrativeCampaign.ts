import type { LevelId } from "../types";

export const NARRATIVE_ACT_IDS = ["good_standing", "same_grade", "new_boundary"] as const;
export type NarrativeActId = (typeof NARRATIVE_ACT_IDS)[number];

export const NARRATIVE_SPEAKER_IDS = [
  "malk_tern",
  "tkesh",
  "mavo",
  "surveyor",
  "buyer",
  "vela_norr",
  "daro_venn",
  "kethra",
  "soft_wake",
  "dern_talish",
  "rig_telemetry",
] as const;
export type NarrativeSpeakerId = (typeof NARRATIVE_SPEAKER_IDS)[number];

export const NARRATIVE_SITE_IDS = [
  "claim_8_delta",
  "harkers_brace",
  "twelve_cask",
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
export type NarrativeSiteId = (typeof NARRATIVE_SITE_IDS)[number];

export interface NarrativeDialogueLineDefinition {
  readonly id: string;
  readonly speakerId: NarrativeSpeakerId;
}

export interface NarrativeActDefinition {
  readonly id: NarrativeActId;
  readonly order: number;
}

export interface NarrativeSiteDefinition {
  readonly id: NarrativeSiteId;
  readonly actId: NarrativeActId;
  readonly order: number;
  /** Site-authored combat baseline; future mechanical levels should adopt this value. */
  readonly authoredEnemyLevel: number;
  readonly mapPosition: Readonly<{ x: number; y: number }>;
  /** Present while a mechanical checkpoint is bound to this narrative site. */
  readonly levelId: LevelId | null;
  readonly briefingDialogue: readonly NarrativeDialogueLineDefinition[];
  readonly debriefDialogue: readonly NarrativeDialogueLineDefinition[];
}

const lines = (
  ...definitions: readonly (readonly [id: string, speakerId: NarrativeSpeakerId])[]
): readonly NarrativeDialogueLineDefinition[] =>
  definitions.map(([id, speakerId]) => ({ id, speakerId }));

export const NARRATIVE_ACTS: Readonly<Record<NarrativeActId, NarrativeActDefinition>> = {
  good_standing: { id: "good_standing", order: 1 },
  same_grade: { id: "same_grade", order: 2 },
  new_boundary: { id: "new_boundary", order: 3 },
};

export const NARRATIVE_SITES: readonly NarrativeSiteDefinition[] = [
  {
    id: "claim_8_delta",
    actId: "good_standing",
    order: 1,
    authoredEnemyLevel: 20,
    mapPosition: { x: 8, y: 76 },
    levelId: "flash_point",
    briefingDialogue: lines(
      ["clean_ledger", "malk_tern"],
      ["empty_spine", "mavo"],
      ["read_from_core", "tkesh"]
    ),
    debriefDialogue: lines(["license_stands", "malk_tern"], ["mounts_carry_hush", "tkesh"]),
  },
  {
    id: "harkers_brace",
    actId: "good_standing",
    order: 2,
    authoredEnemyLevel: 21,
    mapPosition: { x: 20, y: 61 },
    levelId: "make_the_reagent",
    briefingDialogue: lines(
      ["brace_terms", "malk_tern"],
      ["cell_train", "mavo"],
      ["quiet_beyond_cut", "tkesh"]
    ),
    debriefDialogue: lines(["coherent_timing", "surveyor"], ["clock_disagreement", "tkesh"]),
  },
  {
    id: "twelve_cask",
    actId: "good_standing",
    order: 3,
    authoredEnemyLevel: 22,
    mapPosition: { x: 31, y: 72 },
    levelId: "stored_chlorine",
    briefingDialogue: lines(
      ["storage_claim", "malk_tern"],
      ["raw_return", "surveyor"],
      ["discard_premium", "buyer"]
    ),
    debriefDialogue: lines(
      ["same_harmonic", "tkesh"],
      ["receipt_cleared", "buyer"],
      ["preserve_timing", "surveyor"]
    ),
  },
  {
    id: "morrow_pocket",
    actId: "good_standing",
    order: 4,
    authoredEnemyLevel: 23,
    mapPosition: { x: 41, y: 55 },
    levelId: "commissioning_exam",
    briefingDialogue: lines(
      ["solo_claim", "malk_tern"],
      ["complete_return", "surveyor"],
      ["sealed_fraction", "buyer"]
    ),
    debriefDialogue: lines(
      ["one_grade", "tkesh"],
      ["buyer_knows_next", "mavo"],
      ["boundary_request", "surveyor"]
    ),
  },
  {
    id: "kettleblack",
    actId: "same_grade",
    order: 5,
    authoredEnemyLevel: 28,
    mapPosition: { x: 52, y: 44 },
    levelId: null,
    briefingDialogue: lines(
      ["mark_dark_grains", "surveyor"],
      ["premium_doubles", "buyer"],
      ["field_has_edges", "tkesh"]
    ),
    debriefDialogue: lines(
      ["unauthored_pattern", "mavo"],
      ["council_channel", "rig_telemetry"],
      ["meeting_offer", "surveyor"]
    ),
  },
  {
    id: "cordon_41",
    actId: "same_grade",
    order: 6,
    authoredEnemyLevel: 33,
    mapPosition: { x: 62, y: 55 },
    levelId: null,
    briefingDialogue: lines(
      ["identity", "vela_norr"],
      ["reach_costs_people", "vela_norr"],
      ["wall_is_working", "mavo"]
    ),
    debriefDialogue: lines(
      ["same_material", "vela_norr"],
      ["related_across_distance", "tkesh"],
      ["buyer_trace", "rig_telemetry"]
    ),
  },
  {
    id: "junction_l6",
    actId: "same_grade",
    order: 7,
    authoredEnemyLevel: 38,
    mapPosition: { x: 72, y: 38 },
    levelId: null,
    briefingDialogue: lines(
      ["identity", "daro_venn"],
      ["scale_solves_exposure", "daro_venn"],
      ["left_clean", "malk_tern"]
    ),
    debriefDialogue: lines(
      ["test_scheduled", "daro_venn"],
      ["samples_answer", "vela_norr"],
      ["choose_distance", "tkesh"]
    ),
  },
  {
    id: "pell_cut",
    actId: "same_grade",
    order: 8,
    authoredEnemyLevel: 44,
    mapPosition: { x: 82, y: 48 },
    levelId: null,
    briefingDialogue: lines(
      ["parallel_arrays", "daro_venn"],
      ["stop_condition", "vela_norr"],
      ["pattern_listens", "tkesh"]
    ),
    debriefDialogue: lines(
      ["distress_call", "rig_telemetry"],
      ["call_counts", "malk_tern"],
      ["cordon_mobilizing", "vela_norr"]
    ),
  },
  {
    id: "station_14",
    actId: "new_boundary",
    order: 9,
    authoredEnemyLevel: 50,
    mapPosition: { x: 83, y: 27 },
    levelId: null,
    briefingDialogue: lines(
      ["field_command", "kethra"],
      ["cutter_first", "kethra"],
      ["two_boundaries", "soft_wake"]
    ),
    debriefDialogue: lines(
      ["buoys_recovered", "mavo"],
      ["new_voice", "soft_wake"],
      ["near_voice_designation", "rig_telemetry"]
    ),
  },
  {
    id: "vasker_store",
    actId: "new_boundary",
    order: 10,
    authoredEnemyLevel: 57,
    mapPosition: { x: 70, y: 17 },
    levelId: null,
    briefingDialogue: lines(
      ["grain_locus", "vela_norr"],
      ["room_overlap", "soft_wake"],
      ["quiet_glass_recipe", "mavo"]
    ),
    debriefDialogue: lines(
      ["closure_mass", "vela_norr"],
      ["voice_tracks_foundry", "tkesh"],
      ["lane_six_warning", "kethra"]
    ),
  },
  {
    id: "lane_six",
    actId: "new_boundary",
    order: 11,
    authoredEnemyLevel: 64,
    mapPosition: { x: 82, y: 9 },
    levelId: null,
    briefingDialogue: lines(
      ["first_threshold_review", "kethra"],
      ["mission_authority", "dern_talish"],
      ["hold_real_boundary", "soft_wake"]
    ),
    debriefDialogue: lines(
      ["lane_secure", "kethra"],
      ["pell_stabilizing", "vela_norr"],
      ["final_authorization", "dern_talish"]
    ),
  },
  {
    id: "pell_cordon",
    actId: "new_boundary",
    order: 12,
    authoredEnemyLevel: 72,
    mapPosition: { x: 94, y: 22 },
    levelId: null,
    briefingDialogue: lines(
      ["council_mission", "dern_talish"],
      ["cordon_ready", "kethra"],
      ["voice_inside_route", "soft_wake"],
      ["foundry_has_pattern", "tkesh"]
    ),
    debriefDialogue: lines(
      ["boundary_holds", "dern_talish"],
      ["bring_people_home", "kethra"],
      ["new_method_recorded", "vela_norr"],
      ["debt_remains", "daro_venn"]
    ),
  },
];

export const NARRATIVE_SITES_BY_ID: Readonly<Record<NarrativeSiteId, NarrativeSiteDefinition>> =
  Object.fromEntries(NARRATIVE_SITES.map((site) => [site.id, site])) as Record<
    NarrativeSiteId,
    NarrativeSiteDefinition
  >;

export const NARRATIVE_ROUTE_EDGES: readonly Readonly<{
  from: NarrativeSiteId;
  to: NarrativeSiteId;
}>[] = NARRATIVE_SITES.slice(1).map((site, index) => ({
  from: NARRATIVE_SITES[index]!.id,
  to: site.id,
}));

export const NARRATIVE_SITE_BY_LEVEL: Readonly<Record<LevelId, NarrativeSiteId>> = {
  flash_point: "claim_8_delta",
  make_the_reagent: "harkers_brace",
  stored_chlorine: "twelve_cask",
  commissioning_exam: "morrow_pocket",
};

export const narrativeSiteForLevel = (levelId: LevelId): NarrativeSiteDefinition =>
  NARRATIVE_SITES_BY_ID[NARRATIVE_SITE_BY_LEVEL[levelId]];

export const narrativeSiteAfter = (
  site: Pick<NarrativeSiteDefinition, "order">
): NarrativeSiteDefinition | null => NARRATIVE_SITES[site.order] ?? null;

export const narrativeSiteOpensAct = (site: NarrativeSiteDefinition): boolean =>
  NARRATIVE_SITES.find(({ actId }) => actId === site.actId)?.id === site.id;

const validateDialogue = (
  site: NarrativeSiteDefinition,
  dialogue: readonly NarrativeDialogueLineDefinition[]
): readonly string[] => {
  const issues: string[] = [];
  if (new Set(dialogue.map(({ id }) => id)).size !== dialogue.length) {
    issues.push(`${site.id} repeats a dialogue line ID within one phase.`);
  }
  for (const line of dialogue) {
    if (!NARRATIVE_SPEAKER_IDS.includes(line.speakerId)) {
      issues.push(`${site.id}.${line.id} references an unknown speaker.`);
    }
  }
  return issues;
};

const validateNarrativeSite = (site: NarrativeSiteDefinition): readonly string[] => {
  const issues: string[] = [];
  if (!(site.actId in NARRATIVE_ACTS)) issues.push(`${site.id} references an unknown act.`);
  if (site.authoredEnemyLevel < 1 || site.authoredEnemyLevel > 99) {
    issues.push(`${site.id} authors an enemy level outside 1-99.`);
  }
  if (site.mapPosition.x < 0 || site.mapPosition.x > 100) {
    issues.push(`${site.id} has an out-of-bounds map x position.`);
  }
  if (site.mapPosition.y < 0 || site.mapPosition.y > 100) {
    issues.push(`${site.id} has an out-of-bounds map y position.`);
  }
  return [
    ...issues,
    ...validateDialogue(site, site.briefingDialogue),
    ...validateDialogue(site, site.debriefDialogue),
  ];
};

const validateSiteOrder = (): readonly string[] => {
  const issues: string[] = [];
  const orders = NARRATIVE_SITES.map(({ order }) => order);
  if (new Set(orders).size !== orders.length) issues.push("Narrative site orders must be unique.");
  if (orders.some((order, index) => order !== index + 1)) {
    issues.push("Narrative site orders must form one contiguous route.");
  }
  return issues;
};

const validateLevelBindings = (): readonly string[] => {
  const issues: string[] = [];
  for (const levelId of Object.keys(NARRATIVE_SITE_BY_LEVEL) as LevelId[]) {
    if (narrativeSiteForLevel(levelId).levelId !== levelId) {
      issues.push(`${levelId} and its narrative site mapping disagree.`);
    }
  }
  return issues;
};

export const validateNarrativeCampaign = (): readonly string[] => [
  ...validateSiteOrder(),
  ...NARRATIVE_SITES.flatMap(validateNarrativeSite),
  ...validateLevelBindings(),
];
