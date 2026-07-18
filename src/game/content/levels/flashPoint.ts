import type { LevelDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { availability, emptyLoadout, gasRun } from "./helpers";

const flashAvailability = availability({
  equipment: ["gas_agitator"],
  gasLines: ["gas:core__furnace"],
  gasSources: ["starter_gas_header"],
});

const secondChamberAvailability = availability({
  equipment: ["gas_agitator"],
  gasLines: [
    "gas:core__furnace",
    "gas:core__switchyard",
    "gas:core__reservoir",
    "gas:core__gallery",
  ],
  gasSources: ["starter_gas_header"],
});

/** The exam opens one unauthored pair: the player may route a brand-new duct. */
const corridorExamAvailability = availability({
  equipment: ["gas_agitator"],
  gasLines: [
    "gas:core__furnace",
    "gas:core__switchyard",
    "gas:core__reservoir",
    "gas:core__gallery",
    "gas:reservoir__washlock",
  ],
  gasSources: ["starter_gas_header"],
});

export const FLASH_POINT_LEVEL: LevelDefinition = {
  id: "flash_point",
  number: 1,
  enemyLevel: 20,
  focusRoomId: "furnace",
  featuredReactionIds: ["hydrogen_oxygen_combustion"],
  startingMatter: 16,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  site: null,
  loadout: {
    ...emptyLoadout(),
    gasConduits: { "gas:core__furnace": gasRun(false) },
  },
  rounds: [
    {
      id: "first_spark",
      primeSeconds: 24,
      wave: enemySequence(10, "deckmouth", 0.5, 2.2),
      availability: flashAvailability,
    },
    {
      id: "stored_momentum",
      primeSeconds: 10,
      wave: [
        ...enemySequence(5, "flintjack", 0.5, 2.2),
        ...enemySequence(2, "deckmouth", 3, 2.5),
      ].sort((left, right) => left.at - right.at),
      availability: flashAvailability,
    },
    {
      id: "second_chamber",
      primeSeconds: 30,
      wave: [
        ...enemySequence(10, "flintjack", 0.5, 1.5, 7),
        ...enemySequence(8, "deckmouth", 3, 2.2, 6),
      ].sort((left, right) => left.at - right.at),
      availability: secondChamberAvailability,
    },
    {
      id: "higher_cadence",
      primeSeconds: 12,
      wave: [
        ...enemySequence(14, "flintjack", 0.5, 1.2, 9),
        ...enemySequence(7, "shear_jelly", 2.5, 2.2, 8),
      ].sort((left, right) => left.at - right.at),
      availability: secondChamberAvailability,
    },
    {
      id: "corridor_exam",
      primeSeconds: 20,
      wave: [
        ...enemySequence(10, "flintjack", 0.5, 1.8, 9),
        ...enemySequence(8, "deckmouth", 2.5, 2.5, 7),
        ...enemySequence(5, "shear_jelly", 5, 2.8, 8),
        ...enemySequence(5, "redlung", 8, 3, 6),
      ].sort((left, right) => left.at - right.at),
      availability: corridorExamAvailability,
    },
  ],
};
