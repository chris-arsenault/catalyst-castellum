import type { LevelDefinition, RoundDefinition } from "../../definitionTypes";
import { enemySequence } from "../enemies";
import { ACT_TWO_SITE_SEEDS, CORDON_41_SITE } from "../sites/actTwo";
import { paletteAvailability } from "./fullPlant";
import type { ProcessFamilyId } from "../../types";

const CORDON_41_PALETTE: readonly ProcessFamilyId[] = ["nitrogen_oxide", "chlorine_sodium"];
const CORDON_41_AVAILABILITY = paletteAvailability(CORDON_41_PALETTE);
import { actTwoSupplies } from "./actTwoShared";
import { emptyLoadout } from "./helpers";

const wave = (...entries: readonly RoundDefinition["wave"][]): RoundDefinition["wave"] =>
  entries.flat().sort((left, right) => left.at - right.at);

export const CORDON_41_LEVEL: LevelDefinition = {
  id: "cordon_41",
  number: 6,
  palette: CORDON_41_PALETTE,
  enemyLevel: 25,
  focusRoomId: "furnace",
  featuredReactionIds: [
    "ammonia_synthesis",
    "ammonia_oxidation",
    "nitric_oxide_oxidation",
    "nitrogen_dioxide_absorption",
  ],
  startingMatter: 330,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: actTwoSupplies(
    "sensor_wall",
    {
      capacity: 1_000,
      contents: { hydrogen: 420, oxygen: 180, nitrogen: 300 },
      cost: 28,
    },
    {
      gas: {
        contents: { ammonia: 50, nitrogen_dioxide: 15, chlorine: 15 },
        capacity: 110,
        cost: 20,
        availableFromRound: "sensor_wall",
      },
    }
  ),
  site: { kind: "generated", seed: ACT_TWO_SITE_SEEDS.cordon_41, spec: CORDON_41_SITE },
  loadout: {
    ...emptyLoadout(),
    stationary: {
      furnace: { iron_catalyst: 5 },
      gallery: { platinum_catalyst: 4 },
    },
  },
  rounds: [
    {
      id: "sensor_wall",
      primeSeconds: 72,
      wave: enemySequence(1, "clatter", 1, 1, -4),
      availability: CORDON_41_AVAILABILITY,
    },
    {
      id: "ladder_pressure",
      primeSeconds: 72,
      wave: wave(
        enemySequence(1, "clatter", 0.5, 1, -3),
        enemySequence(1, "shear_jelly", 2, 1, -3)
      ),
      availability: CORDON_41_AVAILABILITY,
    },
    {
      id: "buffer_screen",
      primeSeconds: 72,
      wave: wave(
        enemySequence(1, "splitback", 1, 1, -4),
        enemySequence(1, "deckmouth", 2, 1, -2),
        enemySequence(1, "anchor", 4, 1, -3)
      ),
      availability: CORDON_41_AVAILABILITY,
    },
    {
      id: "double_reading",
      primeSeconds: 72,
      wave: wave(
        enemySequence(6, "flintjack", 0.5, 1.7, 1),
        enemySequence(4, "glowbag", 2, 2.8),
        enemySequence(4, "redlung", 3, 2.7),
        enemySequence(3, "shear_jelly", 5, 3)
      ),
      availability: CORDON_41_AVAILABILITY,
    },
    {
      id: "cordon_recovery",
      primeSeconds: 72,
      wave: wave(
        enemySequence(5, "clatter", 0.5, 1.7, 1),
        enemySequence(4, "splitback", 2, 2.5, 1),
        enemySequence(3, "redlung", 3, 2.8, 1),
        enemySequence(3, "glowbag", 4, 3),
        enemySequence(2, "shear_jelly", 5, 3.2),
        enemySequence(1, "anchor", 7, 1)
      ),
      availability: CORDON_41_AVAILABILITY,
    },
  ],
};
