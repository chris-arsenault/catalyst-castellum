import type { LevelDefinition, RoundDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { ACT_TWO_SITE_SEEDS, KETTLEBLACK_SITE } from "../sites/actTwo";
import { ACT_I_AVAILABILITY } from "./fullPlant";
import { actTwoSupplies } from "./actTwoShared";
import { emptyLoadout } from "./helpers";

const wave = (...entries: readonly RoundDefinition["wave"][]): RoundDefinition["wave"] =>
  entries.flat().sort((left, right) => left.at - right.at);

export const KETTLEBLACK_LEVEL: LevelDefinition = {
  id: "kettleblack",
  number: 5,
  enemyLevel: 24,
  focusRoomId: "furnace",
  featuredReactionIds: [
    "water_gas_reaction",
    "water_gas_shift",
    "boudouard_reaction",
    "magnetite_reoxidation",
  ],
  startingMatter: 300,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: actTwoSupplies("grain_markers", {
    capacity: 900,
    contents: {
      hydrogen: 300,
      oxygen: 150,
      steam: 160,
      carbon_dioxide: 120,
      carbon_monoxide: 70,
    },
    cost: 24,
  }),
  site: { kind: "generated", seed: ACT_TWO_SITE_SEEDS.kettleblack, spec: KETTLEBLACK_SITE },
  loadout: {
    ...emptyLoadout(),
    stationary: {
      furnace: { solid_carbon: 45, iron_catalyst: 4 },
      gallery: { solid_carbon: 28 },
      reservoir: { hematite: 30, magnetite: 12 },
    },
  },
  rounds: [
    {
      id: "grain_markers",
      primeSeconds: 72,
      wave: enemySequence(1, "deckmouth", 1, 1, -5),
      availability: ACT_I_AVAILABILITY,
    },
    {
      id: "paired_edges",
      primeSeconds: 72,
      wave: wave(enemySequence(1, "splitback", 1, 1, -6), enemySequence(2, "deckmouth", 3, 2, -3)),
      availability: ACT_I_AVAILABILITY,
    },
    {
      id: "carrier_return",
      primeSeconds: 72,
      wave: wave(
        enemySequence(1, "redlung", 1, 1, -3),
        enemySequence(1, "flintjack", 2, 1, -3),
        enemySequence(1, "deckmouth", 5, 1, -3)
      ),
      availability: ACT_I_AVAILABILITY,
    },
    {
      id: "split_signal",
      primeSeconds: 72,
      wave: wave(
        enemySequence(1, "clatter", 1, 1, -3),
        enemySequence(1, "deckmouth", 1.5, 1, -2),
        enemySequence(1, "glowbag", 4, 1, -1)
      ),
      availability: ACT_I_AVAILABILITY,
    },
    {
      id: "edge_condition",
      primeSeconds: 72,
      wave: wave(
        enemySequence(2, "deckmouth", 0.5, 2),
        enemySequence(2, "flintjack", 1.5, 1.8, 1),
        enemySequence(2, "splitback", 3, 2.8, -4),
        enemySequence(2, "redlung", 4, 2.6),
        enemySequence(1, "glowbag", 5, 1),
        enemySequence(1, "anchor", 7, 1)
      ),
      availability: ACT_I_AVAILABILITY,
    },
  ],
};
