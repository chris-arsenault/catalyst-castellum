import { roomEquipmentIsActive } from "../game/queries";
import type { CombatIncident, GameState, RoomId } from "../game/types";
import { acidLineGuideFor, acidLinePhaseActionReason } from "./acidLineGuide";
import { TUTORIAL_ANCHORS, type TutorialAnchorId } from "./anchors";
import { FLASH_POINT_CONCEPT_MODEL, type GuideConceptModel } from "./flashPointConcept";
import { makeReagentGuideFor, makeReagentPhaseActionReason } from "./makeReagentGuide";

export type { GuideConceptKind } from "./flashPointConcept";

export type GuideStepKind = "action" | "observe" | "complete";

export interface GuideStepDefinition {
  id: string;
  kind: GuideStepKind;
  roomId: RoomId;
  target: TutorialAnchorId;
  title: string;
  explanation: string;
  instruction: string;
  result: string;
  completed: (game: GameState) => boolean;
}

export interface GuideStoryDefinition {
  kicker: string;
  title: string;
  paragraphs: readonly string[];
  model: GuideConceptModel | null;
}

export interface GuideTaskDefinition {
  id: string;
  label: string;
  completed: (game: GameState) => boolean;
}

export interface GuideDefinition {
  completion: {
    title: string;
    explanation: string;
    instruction: string;
  };
  id: string;
  dismissalId: string;
  firstFlashTeachingBreak: boolean;
  label: string;
  showStageIntro: boolean;
  gatesPhaseActions: boolean;
  story: GuideStoryDefinition;
  mission: {
    title: string;
    summary: string;
    tasks: readonly GuideTaskDefinition[];
  };
  steps: GuideStepDefinition[];
}

const hasFurnaceAgitator = (game: GameState): boolean =>
  Object.values(game.rooms.furnace.equipment).some(
    (instance) => instance?.equipmentId === "gas_agitator"
  );

export const furnaceAgitatorRunning = (game: GameState): boolean =>
  roomEquipmentIsActive(game.rooms.furnace, "gas_agitator");

const conduitEnabled = (game: GameState): boolean =>
  game.gasConduits.core_furnace.installed && game.gasConduits.core_furnace.enabled;

const flashIncident = (
  game: GameState,
  predicate: (incident: CombatIncident) => boolean
): CombatIncident | null =>
  game.incidents.find(
    (incident) => incident.sourceId === "hydrogen_oxygen_combustion" && predicate(incident)
  ) ?? null;

export const primeFlashIncident = (game: GameState): CombatIncident | null =>
  flashIncident(
    game,
    (incident) => incident.phase === "prime" && incident.round === game.campaign.roundIndex + 1
  );

export const assaultFlashIncident = (game: GameState): CombatIncident | null =>
  flashIncident(
    game,
    (incident) =>
      incident.phase === "assault" &&
      incident.round === game.campaign.roundIndex + 1 &&
      incident.targets.length > 0
  );

const assaultFlashKilled = (game: GameState): boolean =>
  Boolean(assaultFlashIncident(game)?.targets.some((target) => target.killed));

const flashPointGuide: GuideDefinition = {
  completion: {
    title: "First cycle established",
    explanation:
      "R-02 produced an attributed OX-1 combat hit and resolved the opening crawler wave.",
    instruction: "Continue into Stored Momentum with the chamber’s established state.",
  },
  id: "flash_point:first_spark:v5",
  dismissalId: "flash_point:field_guidance:v5",
  label: "Flash Point field drill",
  showStageIntro: true,
  gatesPhaseActions: true,
  firstFlashTeachingBreak: true,
  story: {
    kicker: "First field assignment",
    title: "Turn R-02 into a combustion trap",
    paragraphs: [
      "The outer spiral has lost contact with its sentries. A crawler column is moving along the service route toward the Core, and R-02 sits directly in its path.",
    ],
    model: FLASH_POINT_CONCEPT_MODEL,
  },
  mission: {
    title: "Commission the OX-1 cycle",
    summary:
      "Build a repeating hydrogen-and-oxygen flash in R-02, then catch the first crawler inside it.",
    tasks: [
      {
        id: "mix-chamber",
        label: "Install and run a Gas Agitator in R-02.",
        completed: (game) => hasFurnaceAgitator(game) && furnaceAgitatorRunning(game),
      },
      {
        id: "feed-reactants",
        label: "Open the Core → R-02 H₂/O₂ feed.",
        completed: conduitEnabled,
      },
      {
        id: "prove-ignition",
        label: "Prime at 2× until R-02 produces an OX-1 flash.",
        completed: (game) => Boolean(primeFlashIncident(game)),
      },
      {
        id: "catch-crawler",
        label: "Start the assault and catch a crawler in the flash.",
        completed: assaultFlashKilled,
      },
    ],
  },
  steps: [
    {
      id: "install-agitator",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceAgitator,
      title: "Prepare the flash chamber",
      explanation:
        "R-02 lies on the crawler route. A Gas Agitator mixes its upper and lower gas layers for ignition.",
      instruction: "Select R-02, then install a Gas Agitator in either socket.",
      result: "The Gas Agitator now recirculates R-02’s upper and lower gas layers.",
      completed: hasFurnaceAgitator,
    },
    {
      id: "run-agitator",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceAgitatorToggle,
      title: "Run the gas agitator",
      explanation: "Active agitation prepares both gas layers for the OX-1 ignition cycle.",
      instruction: "Switch the R-02 Gas Agitator ON.",
      result: "Active agitation now prepares both gas layers for OX-1 ignition.",
      completed: furnaceAgitatorRunning,
    },
    {
      id: "start-shared-duct",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.conduitCoreFurnaceGas,
      title: "Open the Core gas feed",
      explanation:
        "The Core header holds H₂ and O₂ near their combustion ratio. Its fan drives both gases toward R-02.",
      instruction: "Switch the Core–R-02 gas fan ON.",
      result: "The fan is armed with the Core header’s H₂/O₂ mixture.",
      completed: conduitEnabled,
    },
    {
      id: "begin-prime",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "Prime the chamber",
      explanation:
        "Priming starts material flow. The fan fills the routed duct first, then delivers its H₂/O₂ mixture into R-02.",
      instruction: "Begin the timed prime.",
      result:
        "The plant clock is live. Watch the duct inventory advance and R-02 composition respond.",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "accelerate-clock",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.simulationSpeed,
      title: "Advance the clock",
      explanation:
        "Transport and reactions unfold over simulation time. The 2× setting advances this priming cycle quickly.",
      instruction: "Set simulation speed to 2×.",
      result: "The clock is at 2×. R-02 composition and pressure now advance with the feed.",
      completed: (game) => game.speed === 2,
    },
    {
      id: "observe-prime-flash",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceIncidents,
      title: "Read the priming flash",
      explanation:
        "At the ignition threshold, OX-1 consumes H₂ and O₂, heats the chamber gas, and creates a short pressure pulse.",
      instruction: "Wait for the first priming flash, then inspect its incident record.",
      result:
        "The first OX-1 flash opens a one-time explanation of its gas feed, ignition threshold, pressure, and heat.",
      completed: (game) => Boolean(primeFlashIncident(game)),
    },
    {
      id: "cold-assault",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "Cold chamber under assault",
      explanation:
        "R-02 entered assault ahead of its OX-1 ignition cycle. Each surviving crawler now advances toward the Core.",
      instruction:
        "Track the assault outcome, then use Retry checkpoint to rebuild the ignition cycle.",
      result: "The priming flash armed R-02 before assault.",
      completed: (game) => game.phase !== "assault" || Boolean(primeFlashIncident(game)),
    },
    {
      id: "start-assault",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.startAssault,
      title: "Bring in the first wave",
      explanation:
        "Crawlers follow the mapped route through R-02. An OX-1 flash applies pressure impact and thermal damage to targets inside.",
      instruction: "Start the assault and keep watching R-02.",
      result: "Crawlers are advancing along the mapped route toward R-02.",
      completed: (game) => game.phase === "assault" || game.phase === "round_result",
    },
    {
      id: "observe-combat-flash",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceIncidents,
      title: "Confirm the combat hit",
      explanation:
        "After the first hit, the incident log identifies each target, applied pressure and heat damage, and the resulting kills.",
      instruction: "Wait for an assault OX-1 flash that neutralizes at least one enemy.",
      result:
        "Core stock → mixed-gas duct → R-02 accumulation → OX-1 flash → attributed enemy damage. The field drill is complete.",
      completed: assaultFlashKilled,
    },
  ],
};

const followupGuide: GuideDefinition = {
  completion: {
    title: "Flash Point secured",
    explanation: "The retained OX-1 cycle held through the faster follow-up formation.",
    instruction: "Continue to Make the Reagent for membrane-cell production.",
  },
  id: "flash_point:stored_momentum:v1",
  dismissalId: "flash_point:field_guidance:v5",
  label: "Stored Momentum field guidance",
  showStageIntro: false,
  gatesPhaseActions: false,
  firstFlashTeachingBreak: false,
  story: {
    kicker: "Second field test",
    title: "Make the established cycle hold",
    paragraphs: [
      "R-02 retains its equipment, chamber inventory, and reaction timing from the first wave.",
      "A faster formation is already entering the spiral. The shorter prime tests your ability to read the chamber and trust the cycle you built.",
    ],
    model: null,
  },
  mission: {
    title: "Hold Stored Momentum",
    summary:
      "Read the retained R-02 state, use the ten-second prime, and carry the OX-1 cycle through the faster wave.",
    tasks: [
      {
        id: "confirm-cycle",
        label: "Confirm the R-02 agitator and Core gas feed are active.",
        completed: (game) => furnaceAgitatorRunning(game) && conduitEnabled(game),
      },
      {
        id: "start-short-prime",
        label: "Start the ten-second prime when the chamber is ready.",
        completed: (game) => game.phase !== "build",
      },
      {
        id: "read-short-prime",
        label: "Track R-02 composition and OX-1 timing through prime.",
        completed: (game) => game.phase !== "build" && game.phase !== "prime",
      },
      {
        id: "hold-followup",
        label: "Hold the faster follow-up wave.",
        completed: (game) => game.phase === "level_complete" || game.phase === "victory",
      },
    ],
  },
  steps: [
    {
      id: "prepare-followup",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "Read the retained chamber",
      explanation:
        "R-02 carries its equipment, gas inventory, temperature, and reaction cooldown into this round. The next prime lasts ten seconds.",
      instruction:
        "Inspect R-02’s retained state, confirm the agitator and gas feed, then start prime.",
      result: "The established OX-1 cycle is running through the shorter prime.",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "observe-followup-prime",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceIncidents,
      title: "Read the shorter prime",
      explanation:
        "Stored gas and chamber temperature shape the next ignition timing. Composition, pressure, and the incident record show the cycle taking form.",
      instruction: "Track R-02 through the ten-second prime and adjust your timing from its state.",
      result: "The faster wave is entering the established reaction cycle.",
      completed: (game) => game.phase !== "build" && game.phase !== "prime",
    },
    {
      id: "observe-followup-assault",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "Let the cycle work",
      explanation:
        "Skimmers compress the timing window. R-02’s map state and incident record show how the retained process meets them.",
      instruction: "Watch R-02 and its incident record through the follow-up wave.",
      result: "Flash Point is secured with a repeatable OX-1 cycle.",
      completed: (game) => game.phase === "level_complete" || game.phase === "victory",
    },
  ],
};

export const guideDefinitionFor = (game: GameState): GuideDefinition | null => {
  if (game.campaign.levelId === "acid_line") return acidLineGuideFor(game);
  if (game.campaign.levelId === "make_the_reagent") return makeReagentGuideFor(game);
  if (game.campaign.levelId !== "flash_point") return null;
  if (game.campaign.roundIndex === 0) return flashPointGuide;
  if (game.campaign.roundIndex === 1) return followupGuide;
  return null;
};

export const guideStepIndexFor = (game: GameState, guide: GuideDefinition): number => {
  if (game.phase === "assault" && !primeFlashIncident(game)) {
    const coldAssaultIndex = guide.steps.findIndex((step) => step.id === "cold-assault");
    if (coldAssaultIndex >= 0) return coldAssaultIndex;
  }
  const index = guide.steps.findIndex((step) => !step.completed(game));
  return index < 0 ? guide.steps.length : index;
};

export const guidedPhaseActionReason = (
  game: GameState,
  action: "start_prime" | "start_assault",
  dismissedGuideIds: string[]
): string | null => {
  const guide = guideDefinitionFor(game);
  if (!guide || dismissedGuideIds.includes(guide.dismissalId)) return null;
  if (!guide.gatesPhaseActions) return null;
  if (game.campaign.levelId === "acid_line") return acidLinePhaseActionReason(game, action);
  if (game.campaign.levelId === "make_the_reagent")
    return makeReagentPhaseActionReason(game, action);
  if (action === "start_prime") {
    if (!furnaceAgitatorRunning(game)) return "Install and run a Gas Agitator in R-02.";
    if (!conduitEnabled(game)) return "Switch the Core–R-02 gas fan ON.";
    return null;
  }
  return primeFlashIncident(game) ? null : "Observe R-02’s first OX-1 flash to arm the assault.";
};

export const guideCanRun = (game: GameState): boolean =>
  game.phase === "build" || game.phase === "prime" || game.phase === "assault";
