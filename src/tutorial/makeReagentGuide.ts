import { gasAmountTotal, roomEquipmentIsActive } from "../game/queries";
import type { GameState } from "../game/types";
import { TUTORIAL_ANCHORS } from "./anchors";
import type { GuideDefinition } from "./guideModel";
import { MAKE_REAGENT_CONCEPT_MODEL } from "./makeReagentConcept";

const membraneCellInstalled = (game: GameState): boolean =>
  Object.values(game.rooms.lower_intake.equipment).some(
    (instance) => instance?.equipmentId === "membrane_cell"
  );

const membraneCellRunning = (game: GameState): boolean =>
  roomEquipmentIsActive(game.rooms.lower_intake, "membrane_cell");

const liquidFeedEnabled = (game: GameState): boolean =>
  game.liquidConduits.core_cell.installed && game.liquidConduits.core_cell.enabled;

const coProductsEstablished = (game: GameState): boolean =>
  game.processes.chlor_alkali_cell.totalProcessed >= 0.05;

const recoveryEnabled = (game: GameState): boolean =>
  game.gasConduits.core_cell.installed && game.gasConduits.core_cell.enabled;

const recoveryFlowEstablished = (game: GameState): boolean => gasAmountTotal(game.gasVent) >= 0.05;

const firstRoundResolved = (game: GameState): boolean =>
  game.phase === "round_result" || game.campaign.roundIndex > 0;

const levelResolved = (game: GameState): boolean =>
  game.phase === "level_complete" || game.phase === "victory";

const coProductsGuide: GuideDefinition = {
  completion: {
    title: "Three co-products established",
    explanation:
      "The membrane cell converted mixed liquid feed into separated chlorine, hydrogen, and sodium hydroxide outlets.",
    instruction: "Continue to Shared Relief and sustain the cell through its gas outlet network.",
  },
  id: "make_the_reagent:co_products:v1",
  dismissalId: "flash_point:field_guidance:v5",
  label: "Make the Reagent field lesson",
  firstFlashTeachingBreak: false,
  showStageIntro: true,
  gatesPhaseActions: true,
  story: {
    kicker: "Second field assignment",
    title: "Site the membrane cell on the R-05 process line",
    paragraphs: [
      "The next crawler route crosses R-03 while R-05 brings a chlor-alkali production train online.",
      "A single cell current consumes water and brine together. Every reaction extent creates chlorine, hydrogen, and sodium hydroxide, so feed availability and the smallest outlet headroom control the whole process.",
    ],
    model: MAKE_REAGENT_CONCEPT_MODEL,
  },
  mission: {
    title: "Establish CL-1 production",
    summary:
      "Mount the Membrane Cell on the feed-connected R-05 line, verify all three conserved outputs, then hold the R-03 crossing.",
    tasks: [
      {
        id: "commission-cell",
        label: "Mount and run the Membrane Cell at the R-05 feed junction.",
        completed: (game) => membraneCellInstalled(game) && membraneCellRunning(game),
      },
      {
        id: "feed-cell",
        label: "Open the Core → R-05 water-and-brine feed.",
        completed: liquidFeedEnabled,
      },
      {
        id: "prove-products",
        label: "Produce Cl₂, H₂, and NaOH through CL-1.",
        completed: coProductsEstablished,
      },
      {
        id: "hold-crossing",
        label: "Hold the first R-03 crossing.",
        completed: firstRoundResolved,
      },
    ],
  },
  steps: [
    {
      id: "install-membrane-cell",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.lowerIntakeMembraneCell,
      title: "Install the membrane cell",
      explanation:
        "Every room equipment socket accepts the Membrane Cell. The R-05 process line connects Core feed, R-03 transfer, and Core recovery for this assignment.",
      instruction: "Install a Membrane Cell in an open R-05 socket and keep it running.",
      result:
        "The mounted cell owns three local product buffers and draws from the R-05 feed junction.",
      completed: membraneCellRunning,
    },
    {
      id: "open-cell-feed",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.conduitCoreCellLiquid,
      title: "Open the liquid feed",
      explanation:
        "The Core pump mixes equal-use water and brine in one physical pipe and delivers both reactants to R-05.",
      instruction: "Switch the Core–R-05 feed pump ON.",
      result: "Water and brine can now charge the feed pipe and enter the cell junction.",
      completed: liquidFeedEnabled,
    },
    {
      id: "begin-reagent-prime",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "Start the production clock",
      explanation:
        "Priming advances liquid transport, cell current, product buffering, and downstream gas flow together.",
      instruction: "Begin the timed prime.",
      result: "The feed pipe is charging and CL-1 production can begin.",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "accelerate-reagent-prime",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.simulationSpeed,
      title: "Advance the process",
      explanation:
        "The 2× clock makes the pipe fill and the three product inventories easier to trace.",
      instruction: "Set simulation speed to 2×.",
      result: "The process network is advancing at 2×.",
      completed: (game) => game.speed === 2 || (game.phase !== "build" && game.phase !== "prime"),
    },
    {
      id: "observe-cell-products",
      kind: "observe",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.lowerIntakeOutlets,
      title: "Read all three outlets",
      explanation:
        "Every CL-1 extent places chlorine in the anode header, hydrogen in the cathode header, and sodium hydroxide in the liquor buffer.",
      instruction: "Watch the separated outlet panel until CL-1 records production.",
      result: "CL-1 has produced all three conserved co-products.",
      completed: coProductsEstablished,
    },
    {
      id: "start-reagent-assault",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.startAssault,
      title: "Bring in the R-03 wave",
      explanation:
        "The live process continues while crawlers cross R-03, linking production state and defense timing on one clock.",
      instruction: "Start the assault and track the R-03 crossing.",
      result: "The crawler column is moving through the live production network.",
      completed: (game) => game.phase === "assault" || firstRoundResolved(game),
    },
    {
      id: "observe-reagent-wave",
      kind: "observe",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "Hold the crossing",
      explanation:
        "R-03 receives the shared chlorine-and-hydrogen stream while the membrane cell continues to respond to feed and outlet headroom.",
      instruction: "Track the wave and the CL-1 rate through the round result.",
      result: "The first reagent-production round is complete.",
      completed: firstRoundResolved,
    },
  ],
};

const sharedReliefGuide: GuideDefinition = {
  completion: {
    title: "Shared relief commissioned",
    explanation:
      "Core recovery moved the shared R-05 gas stream and restored headroom for sustained membrane-cell current.",
    instruction: "Continue with the commissioned reagent-production network.",
  },
  id: "make_the_reagent:shared_relief:v1",
  dismissalId: "flash_point:field_guidance:v5",
  label: "Shared Relief field guidance",
  firstFlashTeachingBreak: false,
  showStageIntro: false,
  gatesPhaseActions: true,
  story: {
    kicker: "Second production test",
    title: "Sustain the shared gas outlet",
    paragraphs: [
      "The R-05 recovery fan now connects the shared gas junction to Core recovery.",
      "Outlet flow restores anode and cathode headroom together, allowing the Membrane Cell to sustain its three-product cycle through the faster wave.",
    ],
    model: null,
  },
  mission: {
    title: "Commission shared relief",
    summary:
      "Open Core recovery, confirm shared gas movement, and carry CL-1 production through the follow-up wave.",
    tasks: [
      {
        id: "open-recovery",
        label: "Open the R-05 → Core recovery fan.",
        completed: recoveryEnabled,
      },
      {
        id: "establish-recovery-flow",
        label: "Confirm Cl₂/H₂ movement into Core recovery.",
        completed: recoveryFlowEstablished,
      },
      {
        id: "sustain-cell",
        label: "Track CL-1 current through the shorter prime.",
        completed: (game) => game.phase !== "build" && game.phase !== "prime",
      },
      {
        id: "hold-relief-wave",
        label: "Hold the Shared Relief wave.",
        completed: levelResolved,
      },
    ],
  },
  steps: [
    {
      id: "open-core-recovery",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.conduitCoreCellGas,
      title: "Open Core recovery",
      explanation:
        "The recovery fan draws the combined chlorine-and-hydrogen junction stream toward Core recovery and restores gas-header headroom.",
      instruction: "Switch the R-05 recovery fan ON.",
      result: "The shared gas junction now has a second active outlet.",
      completed: recoveryEnabled,
    },
    {
      id: "begin-relief-prime",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "Start the relief test",
      explanation:
        "The shorter prime reveals how recovery flow, product headroom, and cell current settle together.",
      instruction: "Begin the timed prime.",
      result: "The shared gas outlet network is live.",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "observe-recovery-flow",
      kind: "observe",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.lowerIntakeOutlets,
      title: "Read the relieved headers",
      explanation:
        "Core recovery accepts the shared junction mixture. Falling buffer fill and a live CL-1 rate show restored product headroom.",
      instruction: "Track the outlet panel until Core recovery records gas flow.",
      result: "Shared recovery flow is established from R-05 to the Core.",
      completed: recoveryFlowEstablished,
    },
    {
      id: "start-relief-assault",
      kind: "action",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.startAssault,
      title: "Start the faster wave",
      explanation:
        "The established feed, cell, and recovery network continues through the compressed combat timing.",
      instruction: "Start the assault and track CL-1 current through the wave.",
      result: "The faster formation is crossing the live production network.",
      completed: (game) => game.phase === "assault" || levelResolved(game),
    },
    {
      id: "observe-relief-wave",
      kind: "observe",
      roomId: "lower_intake",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "Sustain production",
      explanation:
        "Feed availability and gas-header headroom continue to set CL-1 current while the formation advances.",
      instruction: "Track the process and wave through the level result.",
      result: "Make the Reagent is complete with shared recovery online.",
      completed: levelResolved,
    },
  ],
};

export const makeReagentGuideFor = (game: GameState): GuideDefinition | null => {
  if (game.campaign.levelId !== "make_the_reagent") return null;
  if (game.campaign.roundIndex === 0) return coProductsGuide;
  if (game.campaign.roundIndex === 1) return sharedReliefGuide;
  return null;
};

export const makeReagentPhaseActionReason = (
  game: GameState,
  action: "start_prime" | "start_assault"
): string | null => {
  if (game.campaign.roundIndex === 0) {
    if (!membraneCellRunning(game))
      return "Mount and run the Membrane Cell at the R-05 feed junction.";
    if (!liquidFeedEnabled(game)) return "Switch the Core–R-05 feed pump ON.";
    if (action === "start_assault" && !coProductsEstablished(game))
      return "Establish CL-1 production across all three cell outlets.";
    return null;
  }
  if (!recoveryEnabled(game)) return "Switch the R-05 recovery fan ON.";
  if (action === "start_assault" && !recoveryFlowEstablished(game))
    return "Establish shared gas flow into Core recovery.";
  return null;
};
