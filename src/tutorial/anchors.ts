export const TUTORIAL_ANCHORS = {
  beginPrime: "begin-prime",
  conduitCoreFurnaceGas: "conduit-core-furnace-gas",
  furnaceAgitator: "furnace-gas-agitator",
  furnaceIncidents: "furnace-incidents",
  simulationSpeed: "simulation-speed",
  startAssault: "start-assault",
} as const;

export type TutorialAnchorId = (typeof TUTORIAL_ANCHORS)[keyof typeof TUTORIAL_ANCHORS];

export const tutorialAnchorSelector = (anchor: TutorialAnchorId): string =>
  `[data-tutorial-anchor="${anchor}"]`;
