import type { GameDefinition } from "../definitionTypes";
import type { GameState } from "../types";
import type { StateValidationIssue } from "./stateValidationTypes";

const validateReceipts = (
  state: GameState,
  orderedIds: readonly string[]
): StateValidationIssue[] => {
  const current = orderedIds.indexOf(state.encounter.definition.id);
  const receipts = state.campaign.settledEncounterIds;
  const settled =
    state.encounter.phase === "complete" &&
    ["round_result", "level_complete", "travel", "victory"].includes(state.phase);
  const invalid = receipts.some((id) => {
    const index = orderedIds.indexOf(id);
    return index < 0 || index > current || (index === current && !settled);
  });
  if (
    invalid ||
    receipts.includes(state.encounter.definition.id) !== settled ||
    (settled && state.encounter.pendingMatter !== 0)
  )
    return [
      {
        code: "campaign_mismatch",
        path: "campaign.settledEncounterIds",
        message: "Settlement receipts must match completed encounters and banked rewards.",
      },
    ];
  return [];
};

/** Campaign progress owns settlement receipts; tactical records stay in the encounter. */
export const validateCampaignOwnership = (
  state: GameState,
  definition: GameDefinition
): StateValidationIssue[] => {
  const issues: StateValidationIssue[] = [];
  const receipts = state.campaign.settledEncounterIds;
  const knownIds = new Set(
    definition.levelOrder.flatMap((levelId) =>
      definition.levels[levelId].rounds.map((round) => `${levelId}:${round.id}`)
    )
  );
  issues.push(...validateReceipts(state, [...knownIds]));
  if (new Set(receipts).size !== receipts.length || receipts.some((id) => !knownIds.has(id))) {
    issues.push({
      code: "campaign_mismatch",
      path: "campaign.settledEncounterIds",
      message: "Settlement receipts must identify unique authored encounters.",
    });
  }
  const recordedIds = [
    ...state.encounter.events.map(({ encounterId }) => encounterId),
    ...state.encounter.incidents.map(({ encounterId }) => encounterId),
    ...(state.encounter.result ? [state.encounter.result.encounterId] : []),
  ];
  const orderedIds = [...knownIds];
  const currentIndex = orderedIds.indexOf(state.encounter.definition.id);
  if (recordedIds.some((id) => !knownIds.has(id) || orderedIds.indexOf(id) > currentIndex)) {
    issues.push({
      code: "encounter_state_invalid",
      path: "encounter",
      message:
        "Tactical records must identify the current encounter or an earlier authored encounter.",
    });
  }
  const expectedPhases = {
    assault: ["assault"],
    level_briefing: ["build"],
    build: ["build"],
    defeat: ["defeat", "timeout"],
    round_result: ["complete"],
    level_complete: ["complete"],
    travel: ["complete"],
    victory: ["complete"],
  };
  if (!expectedPhases[state.phase].includes(state.encounter.phase)) {
    issues.push({
      code: "phase_invariant_invalid",
      path: "encounter.phase",
      message: "Campaign phase differs from its tactical encounter phase.",
    });
  }
  const eventIds = [...state.events, ...state.encounter.events].map(({ id }) => id);
  if (new Set(eventIds).size !== eventIds.length) {
    issues.push({
      code: "identifier_sequence_invalid",
      path: "events",
      message: "Campaign and encounter event identities must be unique.",
    });
  }
  return issues;
};
