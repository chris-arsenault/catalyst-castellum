import type { CombatIncident, GameState, RoomId } from "../game/types";

export type GuideStepKind = "action" | "observe" | "complete";

export interface GuideStepDefinition {
  id: string;
  kind: GuideStepKind;
  roomId: RoomId;
  target: string;
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
  label: "Flash Point guided setup",
  steps: [
    {
      id: "install-agitator",
      kind: "action",
      roomId: "furnace",
      target: '[data-testid^="install-furnace-"][data-testid$="-gas_agitator"]',
      title: "Choose the serviced chamber",
      explanation:
        "R-02 is crossed by the monster corridor and is the visible endpoint of the installed Core gas duct. Other rooms remain selectable so you can compare their sockets and service access.",
      instruction: "Select R-02 when ready, then install a Gas Agitator in either socket.",
      result:
        "The mixer is installed. Inspect another room or the physical route before continuing; the guide will not take control of selection.",
      completed: hasFurnaceAgitator,
    },
    {
      id: "start-shared-duct",
      kind: "action",
      roomId: "furnace",
      target: '[data-testid="conduit-control-core_furnace-gas"]',
      title: "Start one physical duct",
      explanation:
        "The Core header already contains a near-stoichiometric H₂/O₂ mixture. One fan moves that whole conserved mixture; there are no element-specific feed switches.",
      instruction: "Switch the Core–R-02 gas fan ON.",
      result:
        "The one gas conduit is armed. Its retained inventory and both species remain visible before physics starts.",
      completed: conduitEnabled,
    },
    {
      id: "begin-prime",
      kind: "action",
      roomId: "furnace",
      target: '[data-testid="begin-prime"]',
      title: "Start the physics",
      explanation:
        "Planning changes configuration; priming moves the mixed inventory through the route and into the chamber over real distance.",
      instruction: "Click Begin timed prime.",
      result: "The plant clock is live. Watch the conduit fill and the room composition respond.",
      completed: (game) => game.phase !== "build",
    },
    {
      id: "accelerate-clock",
      kind: "action",
      roomId: "furnace",
      target: '[data-testid="simulation-speed"]',
      title: "Accelerate the clock",
      explanation:
        "Transport latency is physical. 2× advances the same flow, gravity, reaction, and combat rules without changing their rates.",
      instruction: "Set simulation speed to 2× while the conduit primes.",
      result: "The clock is at 2×. Keep the board open while the first empty-room flash forms.",
      completed: (game) => game.speed === 2,
    },
    {
      id: "observe-prime-flash",
      kind: "observe",
      roomId: "furnace",
      target: '[data-testid="recent-incidents-furnace"]',
      title: "Read the first incident",
      explanation:
        "An OX-1 flash is now a durable incident, not a one-frame effect. During prime it proves the chamber cycles, but it cannot hit an enemy because none are present.",
      instruction: "Wait for an OX-1 incident, then inspect its zero-target result.",
      result:
        "Prime is paused on a readable pressure/heat incident with zero targets. The actual combat lesson is still ahead.",
      completed: (game) => Boolean(flashIncident(game, (incident) => incident.phase === "prime")),
    },
    {
      id: "start-assault",
      kind: "action",
      roomId: "furnace",
      target: '[data-testid="start-assault"]',
      title: "Introduce a target",
      explanation:
        "The setup is not learned until a creature occupies R-02 at the instant a new flash fires.",
      instruction: "Start the assault and keep watching R-02.",
      result: "Hostiles are moving through the same spatial corridor shown on the map.",
      completed: (game) => game.phase === "assault" || game.phase === "round_result",
    },
    {
      id: "observe-combat-flash",
      kind: "observe",
      roomId: "furnace",
      target: '[data-testid="recent-incidents-furnace"]',
      title: "See what killed it",
      explanation:
        "The guide pauses once after the first assault flash hits. The incident records actual targets, capped pressure/heat damage, and kills; residual pulse does not deal repeated attack damage.",
      instruction: "Wait for an assault OX-1 flash that neutralizes at least one enemy.",
      result:
        "Combat is paused for inspection. The recent incident and system trace now name OX-1, its damage channels, hit count, and kill count.",
      completed: assaultFlashKilled,
    },
    {
      id: "combat-confirmed",
      kind: "complete",
      roomId: "furnace",
      target: '[data-testid="recent-incidents-furnace"]',
      title: "Causal chain confirmed",
      explanation:
        "Core stock → one mixed conduit → R-02 accumulation → discrete OX-1 attack → attributed enemy damage. Finishing resumes the assault without changing the machine.",
      instruction: "Finish guided setup when you have inspected the board.",
      result: "The guided setup is complete.",
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
