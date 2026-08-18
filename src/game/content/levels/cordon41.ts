import type { LevelDefinition, RouteIngressDefinition } from "../../definitionTypes";
import type { ProcessFamilyId, WaveEntry } from "../../types";
import { enemySequence } from "../enemies";
import { FIXED_CAMPAIGN_MAPS } from "../sites/fixedCampaignMaps";
import { actTwoSupplies } from "./actTwoShared";
import { paletteAvailability } from "./fullPlant";
import { emptyLoadout } from "./helpers";

const PALETTE: readonly ProcessFamilyId[] = ["nitrogen_oxide", "chlorine_sodium"];
const AVAILABLE = paletteAvailability(PALETTE);
const ROUTES: readonly RouteIngressDefinition[] = [
  {
    id: "sensor_base",
    roomId: "west_intake",
    offset: { column: 0, elevation: 0 },
    movementCost: 1,
    eligibility: "all",
  },
  {
    id: "sensor_ladder",
    roomId: "furnace",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.08,
    eligibility: "ground",
  },
  {
    id: "sensor_high",
    roomId: "gallery",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.04,
    eligibility: "flying",
  },
];

const on = (routeId: string, entries: readonly WaveEntry[]): WaveEntry[] =>
  entries.map((entry) => ({ ...entry, routeId }));
const wave = (...groups: WaveEntry[][]): WaveEntry[] =>
  groups.flat().sort((left, right) => left.at - right.at);

/** Cordon 41 is a vertical sensor stack with ladder, upper-air, armor, and field-bearing threats. */
export const CORDON_41_LEVEL: LevelDefinition = {
  id: "cordon_41",
  number: 6,
  palette: PALETTE,
  enemyLevel: 25,
  focusRoomId: "furnace",
  featuredReactionIds: ["chlor_alkali_electrolysis"],
  startingMatter: 330,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: actTwoSupplies(
    "sensor_wall",
    { capacity: 1_000, contents: { hydrogen: 420, oxygen: 180, nitrogen: 300 }, cost: 28 },
    {
      gas: {
        contents: { ammonia: 50, nitrogen_dioxide: 15, chlorine: 15 },
        capacity: 110,
        cost: 20,
        availableFromRound: "sensor_wall",
      },
    }
  ),
  site: {
    kind: "fixed",
    map: FIXED_CAMPAIGN_MAPS.cordon_41,
    hullAnchor: { columns: 70, elevations: 0 },
  },
  loadout: {
    ...emptyLoadout(),
    stationary: { furnace: { iron_catalyst: 5 }, gallery: { platinum_catalyst: 4 } },
  },
  routes: ROUTES,
  rounds: [
    {
      id: "sensor_wall",
      wave: wave(
        on("sensor_base", enemySequence(7, "deckmouth", 0.5, 2.5, -6)),
        on("sensor_ladder", enemySequence(5, "clatter", 1.2, 2.8, -6))
      ),
      availability: AVAILABLE,
    },
    {
      id: "ladder_pressure",
      wave: wave(
        on("sensor_base", enemySequence(7, "flintjack", 0.5, 1.9, -5)),
        on("sensor_ladder", enemySequence(7, "clatter", 1, 2, -5)),
        on("sensor_high", enemySequence(4, "glowbag", 2, 3.2, -7))
      ),
      availability: AVAILABLE,
    },
    {
      id: "buffer_screen",
      wave: wave(
        on("sensor_base", enemySequence(6, "splitback", 0.5, 2.8, -5)),
        on("sensor_ladder", enemySequence(5, "redlung", 1.5, 3, -6)),
        on("sensor_high", enemySequence(5, "glowbag", 2, 2.8, -6))
      ),
      availability: AVAILABLE,
    },
    {
      id: "double_reading",
      wave: wave(
        on("sensor_base", enemySequence(8, "shear_jelly", 0.5, 2.1, -5)),
        on("sensor_ladder", enemySequence(8, "clatter", 1, 1.8, -4)),
        on("sensor_high", enemySequence(6, "glowbag", 1.5, 2.5, -5)),
        on("sensor_ladder", enemySequence(1, "anchor", 3, 1, -6))
      ),
      availability: AVAILABLE,
    },
    {
      id: "cordon_recovery",
      wave: wave(
        on("sensor_base", enemySequence(8, "splitback", 0.5, 2, -4)),
        on("sensor_ladder", enemySequence(9, "clatter", 1, 1.65, -4)),
        on("sensor_high", enemySequence(7, "glowbag", 1.5, 2.2, -4)),
        on("sensor_base", enemySequence(5, "redlung", 2, 3, -4)),
        on("sensor_ladder", enemySequence(1, "anchor", 3.5, 5, -5))
      ),
      availability: AVAILABLE,
    },
  ],
};
