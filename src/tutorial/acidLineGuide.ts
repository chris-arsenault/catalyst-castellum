import { roomEquipmentIsActive } from "../game/queries";
import type { GameState, GasAmounts, RoomId } from "../game/types";
import { ACID_LINE_CONCEPT_MODEL } from "./acidLineConcept";
import { TUTORIAL_ANCHORS } from "./anchors";
import type { GuideDefinition } from "./guideModel";

const equipmentRunning = (game: GameState, equipmentId: "gas_agitator" | "thermal_coil"): boolean =>
  roomEquipmentIsActive(game.rooms.furnace, equipmentId);

const thermalCoilRunning = (game: GameState): boolean => equipmentRunning(game, "thermal_coil");
const agitatorRunning = (game: GameState): boolean => equipmentRunning(game, "gas_agitator");

const gasRunEnabled = (
  game: GameState,
  runId: "cell_furnace" | "furnace_return" | "return_final"
): boolean => game.gasConduits[runId].installed && game.gasConduits[runId].enabled;

const acidFeedEnabled = (game: GameState): boolean => gasRunEnabled(game, "cell_furnace");
const firstReturnEnabled = (game: GameState): boolean => gasRunEnabled(game, "furnace_return");
const finalReturnEnabled = (game: GameState): boolean => gasRunEnabled(game, "return_final");

const returnLineEnabled = (game: GameState): boolean =>
  firstReturnEnabled(game) && finalReturnEnabled(game);

const fullAcidLineEnabled = (game: GameState): boolean =>
  acidFeedEnabled(game) && returnLineEnabled(game);

const acidEquipmentRunning = (game: GameState): boolean =>
  thermalCoilRunning(game) && agitatorRunning(game);

const hclProductionEstablished = (game: GameState): boolean =>
  game.events.some(
    (event) =>
      event.levelId === "acid_line" &&
      event.roomId === "furnace" &&
      event.code === "hcl_production_started"
  );

const hclAmount = (gas: GasAmounts): number => gas.hydrogen_chloride;

const roomHcl = (game: GameState, roomId: RoomId): number =>
  hclAmount(game.rooms[roomId].gas.lower) + hclAmount(game.rooms[roomId].gas.upper);

const downstreamHclEstablished = (game: GameState): boolean =>
  hclAmount(game.gasConduits.furnace_return.gas) +
    roomHcl(game, "gallery") +
    hclAmount(game.gasConduits.return_final.gas) +
    roomHcl(game, "washlock") >
  0.005;

const firstRoundResolved = (game: GameState): boolean =>
  game.phase === "round_result" || game.campaign.roundIndex > 0;

const levelResolved = (game: GameState): boolean =>
  game.phase === "level_complete" || game.phase === "victory";

const hotMixGuide: GuideDefinition = {
  completion: {
    title: "Acid line commissioned",
    explanation:
      "R-02 converted the shared H₂/Cl₂ feed into HCl and the return fans carried its corrosive inventory downstream.",
    instruction: "Continue to Residence Time with the heated chamber and charged return line.",
  },
  id: "acid_line:hot_mix:v1",
  dismissalId: "flash_point:field_guidance:v5",
  label: "Acid Line field lesson",
  firstFlashTeachingBreak: false,
  showStageIntro: true,
  gatesPhaseActions: true,
  story: {
    kicker: "Third field assignment",
    title: "Turn the R-05 gas stream into an acid front",
    paragraphs: [
      "Armored shells are entering the spiral. Their mineral plating yields to sustained corrosion across the rooms ahead of the Core.",
      "R-05 holds equal chlorine and hydrogen inventories in separated buffers. R-02 supplies the temperature and mixing that convert their shared gas stream into hydrogen chloride, while the return fans extend that product across the hostile route.",
    ],
    model: ACID_LINE_CONCEPT_MODEL,
  },
  mission: {
    title: "Commission the CL-2 acid line",
    summary:
      "Heat and mix R-02, feed its 1:1 H₂/Cl₂ stream, establish HCl production, and charge the R-04/R-06 return path.",
    tasks: [
      {
        id: "condition-reactor",
        label: "Run a Thermal Coil and Gas Agitator in R-02.",
        completed: acidEquipmentRunning,
      },
      {
        id: "feed-reactants",
        label: "Open the R-05 → R-02 H₂/Cl₂ feed.",
        completed: acidFeedEnabled,
      },
      {
        id: "complete-return",
        label: "Open the R-02 → R-04 → R-06 return line.",
        completed: returnLineEnabled,
      },
      {
        id: "produce-acid",
        label: "Establish CL-2 hydrogen chloride production.",
        completed: hclProductionEstablished,
      },
      {
        id: "hold-hot-mix",
        label: "Hold the armored Hot Mix wave.",
        completed: firstRoundResolved,
      },
    ],
  },
  steps: [
    {
      id: "install-thermal-coil",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceThermalCoil,
      title: "Install the thermal coil",
      explanation:
        "A Grade 1 Thermal Coil heats R-02 and both gas layers toward 68°C. CL-2 activates above 38°C and reaches full temperature activation at 66°C.",
      instruction: "Install a Thermal Coil in either R-02 socket.",
      result: "The active coil is raising R-02 through the CL-2 activation range.",
      completed: thermalCoilRunning,
    },
    {
      id: "install-acid-agitator",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceAgitator,
      title: "Mix both reaction layers",
      explanation:
        "The Gas Agitator exchanges upper and lower gas packets and applies 1.5× kinetics to eligible reactions in R-02.",
      instruction: "Install a Gas Agitator in the remaining R-02 socket.",
      result: "Both gas layers now share reactants and accelerated CL-2 kinetics.",
      completed: agitatorRunning,
    },
    {
      id: "open-acid-feed",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.conduitCellFurnaceGas,
      title: "Open the mixed-gas feed",
      explanation:
        "R-05 combines its equal H₂ and Cl₂ buffer inventories at one gas junction. The feed fan carries that shared mixture into heated R-02.",
      instruction: "Switch the R-05–R-02 gas fan ON.",
      result: "The 1:1 H₂/Cl₂ stream can now charge the physical feed duct.",
      completed: acidFeedEnabled,
    },
    {
      id: "open-first-return",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.conduitFurnaceReturnGas,
      title: "Open the first return leg",
      explanation:
        "The R-02–R-04 fan draws reacted chamber atmosphere, including HCl product, into the middle return room.",
      instruction: "Switch the R-02–R-04 return fan ON.",
      result: "R-02 now feeds the first downstream acid-line segment.",
      completed: firstReturnEnabled,
    },
    {
      id: "open-final-return",
      kind: "action",
      roomId: "gallery",
      target: TUTORIAL_ANCHORS.conduitReturnFinalGas,
      title: "Complete the return line",
      explanation:
        "The R-04–R-06 fan extends the HCl-bearing stream through the final combat room before the Core.",
      instruction: "Select R-04, then switch the R-04–R-06 gas fan ON.",
      result: "The complete R-02 → R-04 → R-06 gas path is active.",
      completed: finalReturnEnabled,
    },
    {
      id: "begin-acid-prime",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "Start acid-line commissioning",
      explanation:
        "Priming advances coil heat, layer mixing, feed-duct charge, CL-2 conversion, and downstream transport together.",
      instruction: "Begin the timed prime.",
      result: "R-02 and the three-run gas line are advancing on the plant clock.",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "accelerate-acid-prime",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.simulationSpeed,
      title: "Advance the commissioning clock",
      explanation:
        "The 2× clock makes the coil ramp, feed arrival, and HCl formation easier to compare in one prime window.",
      instruction: "Set simulation speed to 2×.",
      result: "The complete acid-line process is advancing at 2×.",
      completed: (game) => game.speed === 2 || (game.phase !== "build" && game.phase !== "prime"),
    },
    {
      id: "observe-acid-production",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceReactionReadout,
      title: "Read the CL-2 reaction",
      explanation:
        "The live gate shows per-layer H₂, Cl₂, temperature activation, available 1:1 batch, and the agitator’s kinetics multiplier.",
      instruction: "Select R-02 and watch its room details until CL-2 records HCl production.",
      result: "R-02 is converting equal H₂ and Cl₂ inventories into hydrogen chloride.",
      completed: hclProductionEstablished,
    },
    {
      id: "start-hot-mix-assault",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.startAssault,
      title: "Bring in the armored wave",
      explanation:
        "Shells receive corrosive and thermal exposure while they occupy the heated R-02 acid front and its downstream return rooms.",
      instruction: "Start the assault and track the HCl front along the route.",
      result: "The armored formation is entering the commissioned acid line.",
      completed: (game) => game.phase === "assault" || firstRoundResolved(game),
    },
    {
      id: "observe-hot-mix-wave",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "Hold the acid front",
      explanation:
        "Continuous feed, CL-2 conversion, and retained HCl inventory sustain exposure as each shell advances.",
      instruction: "Track the acid line and wave through the round result.",
      result: "The first Acid Line round is complete.",
      completed: firstRoundResolved,
    },
  ],
};

const residenceTimeGuide: GuideDefinition = {
  completion: {
    title: "Acid Line secured",
    explanation:
      "The heated CL-2 reactor and retained HCl line held through the faster mixed-height formation.",
    instruction: "Continue with the commissioned acid-production route.",
  },
  id: "acid_line:residence_time:v1",
  dismissalId: "flash_point:field_guidance:v5",
  label: "Residence Time field guidance",
  firstFlashTeachingBreak: false,
  showStageIntro: false,
  gatesPhaseActions: false,
  story: {
    kicker: "Second acid-line test",
    title: "Use the inventory already inside the route",
    paragraphs: [
      "R-02 retains its operating temperature, equipment, reactant inventory, and HCl product from Hot Mix.",
      "Skimmers and floaters compress the timing window. The shorter prime tests how the filled feed and return segments carry the established acid front into the wave.",
    ],
    model: null,
  },
  mission: {
    title: "Hold Residence Time",
    summary:
      "Confirm the full acid line, read its retained HCl inventory, and carry the active CL-2 process through the faster wave.",
    tasks: [
      {
        id: "confirm-acid-line",
        label: "Confirm R-02 equipment and all three gas runs are active.",
        completed: (game) => acidEquipmentRunning(game) && fullAcidLineEnabled(game),
      },
      {
        id: "start-residence-prime",
        label: "Start the fourteen-second residence-time prime.",
        completed: (game) => game.phase !== "build",
      },
      {
        id: "carry-downstream-acid",
        label: "Carry retained HCl through the downstream line.",
        completed: (game) => downstreamHclEstablished(game) && game.phase !== "build",
      },
      {
        id: "hold-residence-wave",
        label: "Hold the Residence Time wave.",
        completed: levelResolved,
      },
    ],
  },
  steps: [
    {
      id: "prepare-residence-time",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.beginPrime,
      title: "Read the retained acid line",
      explanation:
        "The second round begins with a warm R-02, active equipment, charged conduits, and HCl distributed along the return path.",
      instruction: "Confirm the three gas fans and R-02 equipment, then begin prime.",
      result: "The established CL-2 network is advancing through the shorter prime.",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "observe-residence-prime",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceReactionReadout,
      title: "Read residence time",
      explanation:
        "R-02 reaction rate and downstream HCl inventories show how stored material bridges the shorter transport window.",
      instruction: "Track CL-2 and the return-line inventory through prime.",
      result: "The retained acid front is meeting the faster wave timing.",
      completed: (game) => game.phase !== "build" && game.phase !== "prime",
    },
    {
      id: "observe-residence-assault",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.phaseBanner,
      title: "Let the acid line work",
      explanation:
        "Ground skimmers and airborne floaters sample different gas layers while the agitator maintains their shared reactant and HCl distribution.",
      instruction: "Track both enemy heights and the acid front through the level result.",
      result: "Acid Line is secured with a repeatable CL-2 process.",
      completed: levelResolved,
    },
  ],
};

export const acidLineGuideFor = (game: GameState): GuideDefinition | null => {
  if (game.campaign.levelId !== "acid_line") return null;
  if (game.campaign.roundIndex === 0) return hotMixGuide;
  if (game.campaign.roundIndex === 1) return residenceTimeGuide;
  return null;
};

export const acidLinePhaseActionReason = (
  game: GameState,
  action: "start_prime" | "start_assault"
): string | null => {
  if (!thermalCoilRunning(game)) return "Install and run a Thermal Coil in R-02.";
  if (!agitatorRunning(game)) return "Install and run a Gas Agitator in R-02.";
  if (!acidFeedEnabled(game)) return "Switch the R-05–R-02 gas fan ON.";
  if (!firstReturnEnabled(game)) return "Switch the R-02–R-04 return fan ON.";
  if (!finalReturnEnabled(game)) return "Switch the R-04–R-06 gas fan ON.";
  if (action === "start_assault" && !hclProductionEstablished(game))
    return "Establish CL-2 hydrogen chloride production in R-02.";
  return null;
};
