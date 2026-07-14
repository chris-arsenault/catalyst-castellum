export const TUTORIAL_ANCHORS = {
  beginPrime: "begin-prime",
  conduitCoreFurnaceGas: "conduit-core-furnace-gas",
  conduitCoreCellGas: "conduit-core-cell-gas",
  conduitCoreCellLiquid: "conduit-core-cell-liquid",
  conduitCellFurnaceGas: "conduit-cell-furnace-gas",
  conduitFurnaceReturnGas: "conduit-furnace-return-gas",
  conduitReturnFinalGas: "conduit-return-final-gas",
  furnaceAgitator: "furnace-gas-agitator",
  furnaceAgitatorToggle: "furnace-gas-agitator-toggle",
  furnaceIncidents: "furnace-incidents",
  furnaceReactionReadout: "furnace-reaction-readout",
  furnaceThermalCoil: "furnace-thermal-coil",
  phaseBanner: "phase-banner",
  lowerIntakeMembraneCell: "lower-intake-membrane-cell",
  lowerIntakeOutlets: "lower-intake-outlets",
  simulationSpeed: "simulation-speed",
  startAssault: "start-assault",
} as const;

export type TutorialAnchorId = (typeof TUTORIAL_ANCHORS)[keyof typeof TUTORIAL_ANCHORS];

export const tutorialAnchorSelector = (anchor: TutorialAnchorId): string =>
  `[data-tutorial-anchor="${anchor}"]`;
