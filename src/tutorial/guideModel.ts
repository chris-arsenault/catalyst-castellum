import type { CombatIncident, GameState, RoomId } from "../game/types";
import { TUTORIAL_ANCHORS, type TutorialAnchorId } from "./anchors";

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

export interface GuideDefinition {
  id: string;
  label: string;
  steps: GuideStepDefinition[];
}

const hasFurnaceAgitator = (game: GameState): boolean =>
  Object.values(game.rooms.furnace.equipment).some(
    (instance) => instance?.equipmentId === "gas_agitator"
  );

const conduitEnabled = (game: GameState): boolean =>
  game.gasConduits.core_furnace.installed && game.gasConduits.core_furnace.enabled;

const flashIncident = (
  game: GameState,
  predicate: (incident: CombatIncident) => boolean
): CombatIncident | null =>
  game.incidents.find(
    (incident) => incident.sourceId === "hydrogen_oxygen_combustion" && predicate(incident)
  ) ?? null;

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
  id: "flash_point:first_spark:v2",
  label: "Flash Point field drill",
  steps: [
    {
      id: "install-agitator",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceAgitator,
      title: "Prepare the flash chamber",
      explanation:
        "R-02 lies on the hostile route and receives gas from the Core header. Its equipment sockets can change mixing, temperature, and reaction rates.",
      instruction: "Select R-02, then install a Gas Agitator in either socket.",
      result:
        "The Gas Agitator now recirculates R-02’s upper and lower gas layers. Inspect the chamber or trace its duct, then continue.",
      completed: hasFurnaceAgitator,
    },
    {
      id: "start-shared-duct",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.conduitCoreFurnaceGas,
      title: "Open the Core gas feed",
      explanation:
        "The Core header holds H₂ and O₂ near their combustion ratio. The fan carries their combined inventory through the Core–R-02 duct.",
      instruction: "Switch the Core–R-02 gas fan ON.",
      result:
        "The fan is armed. The Core source readout shows the H₂/O₂ mixture queued for priming.",
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
        "Transport and reactions unfold over simulation time. At 2×, the duct charges and R-02 approaches ignition twice as quickly on screen.",
      instruction: "Set simulation speed to 2×.",
      result:
        "The clock is at 2×. Watch R-02 pressure and composition as the first flash approaches.",
      completed: (game) => game.speed === 2,
    },
    {
      id: "observe-prime-flash",
      kind: "observe",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceIncidents,
      title: "Read the priming flash",
      explanation:
        "When the H₂/O₂ mixture reaches its ignition threshold, R-02 produces an OX-1 pressure and heat pulse. The incident log records its impulse, reaction extent, and target count.",
      instruction: "Wait for the first priming flash, then inspect its incident record.",
      result:
        "The first OX-1 flash opens a one-time explanation of its gas feed, ignition threshold, pressure, and heat.",
      completed: (game) => Boolean(flashIncident(game, (incident) => incident.phase === "prime")),
    },
    {
      id: "start-assault",
      kind: "action",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.startAssault,
      title: "Bring in the first wave",
      explanation:
        "During assault, crawlers follow the mapped route through R-02. A flash that fires while a crawler occupies the chamber applies pressure and heat damage.",
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
        "The live incident record tracks OX-1 damage channels, hit count, and kill count during combat.",
      completed: assaultFlashKilled,
    },
    {
      id: "combat-confirmed",
      kind: "complete",
      roomId: "furnace",
      target: TUTORIAL_ANCHORS.furnaceIncidents,
      title: "Trace the complete causal chain",
      explanation:
        "Core stock → mixed-gas duct → R-02 accumulation → OX-1 flash → attributed enemy damage. Finishing returns the plant to live assault with its current configuration.",
      instruction: "Finish the field drill after inspecting the chain.",
      result: "Flash Point field drill complete.",
      completed: () => false,
    },
  ],
};

export const guideDefinitionFor = (game: GameState): GuideDefinition | null => {
  if (game.campaign.levelId !== "flash_point" || game.campaign.roundIndex !== 0) return null;
  return flashPointGuide;
};

export const guideStepIndexFor = (game: GameState, guide: GuideDefinition): number => {
  const index = guide.steps.findIndex((step) => !step.completed(game));
  return index < 0 ? guide.steps.length - 1 : index;
};

export const guideCanRun = (game: GameState): boolean =>
  game.phase === "build" || game.phase === "prime" || game.phase === "assault";
