import type { LevelDefinition, RoundDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { ACT_THREE_SITE_SEEDS, STATION_14_SITE } from "../sites/actThree";
import { actThreeSupplies } from "./actThreeShared";
import { ACT_II_AVAILABILITY } from "./fullPlant";
import { emptyLoadout } from "./helpers";

const wave = (...entries: readonly RoundDefinition["wave"][]): RoundDefinition["wave"] =>
  entries.flat().sort((left, right) => left.at - right.at);

export const STATION_14_LEVEL: LevelDefinition = {
  id: "station_14",
  number: 9,
  enemyLevel: 28,
  focusRoomId: "reservoir",
  featuredReactionIds: [
    "uranium_hexafluoride_hydrolysis",
    "uranyl_fluoride_recovery",
    "hydrogen_fluoride_electrolysis",
  ],
  startingMatter: 430,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: actThreeSupplies("first_beacon", {
    gasCapacity: 950,
    gasContents: {
      hydrogen: 320,
      oxygen: 160,
      hydrogen_fluoride: 220,
      nitrogen: 80,
    },
    gasCost: 38,
    water: 200,
    brine: 200,
    liquidCapacity: 240,
    waterCost: 12,
    brineCost: 16,
  }),
  site: { kind: "generated", seed: ACT_THREE_SITE_SEEDS.station_14, spec: STATION_14_SITE },
  loadout: {
    ...emptyLoadout(),
    stationary: {
      furnace: { solid_carbon: 24, iron_catalyst: 4 },
      gallery: { platinum_catalyst: 3, uranyl_fluoride: 36 },
      lower_intake: { surface_nickel: 14, nickel_oxide: 10 },
    },
  },
  rounds: [
    {
      id: "first_beacon",
      primeSeconds: 72,
      wave: enemySequence(1, "deckmouth", 1, 1, -8),
      availability: ACT_II_AVAILABILITY,
    },
    {
      id: "split_position",
      primeSeconds: 72,
      wave: wave(
        enemySequence(2, "clatter", 0.5, 1.8, -7),
        enemySequence(1, "shear_jelly", 2, 1, -7),
        enemySequence(1, "glowbag", 4, 1, -8)
      ),
      availability: ACT_II_AVAILABILITY,
    },
    {
      id: "shielded_return",
      primeSeconds: 72,
      wave: wave(
        enemySequence(2, "splitback", 1, 3, -8),
        enemySequence(2, "redlung", 2, 3.2, -7),
        enemySequence(1, "anchor", 4, 1, -8)
      ),
      availability: ACT_II_AVAILABILITY,
    },
    {
      id: "fourth_signal",
      primeSeconds: 72,
      wave: wave(
        enemySequence(7, "flintjack", 0.5, 1.45, -6),
        enemySequence(4, "clatter", 1.5, 2, -6),
        enemySequence(3, "glowbag", 3, 2.8, -7),
        enemySequence(2, "shear_jelly", 5, 3, -6)
      ),
      availability: ACT_II_AVAILABILITY,
    },
    {
      id: "near_echo",
      primeSeconds: 72,
      wave: wave(
        enemySequence(5, "deckmouth", 0.5, 1.7, -4),
        enemySequence(5, "flintjack", 1, 1.5, -4),
        enemySequence(3, "splitback", 2, 2.8, -5),
        enemySequence(3, "redlung", 3, 2.7, -4),
        enemySequence(2, "clatter", 4, 2.5, -3),
        enemySequence(2, "glowbag", 5, 3, -4),
        enemySequence(1, "shear_jelly", 6, 1, 1),
        enemySequence(1, "anchor", 7.5, 1, -5)
      ),
      availability: ACT_II_AVAILABILITY,
    },
  ],
};
