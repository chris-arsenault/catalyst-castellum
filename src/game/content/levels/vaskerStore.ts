import type { LevelDefinition, RouteIngressDefinition } from "../../definitionTypes";
import type { ProcessFamilyId, WaveEntry } from "../../types";
import { enemySequence } from "../enemies";
import { FIXED_CAMPAIGN_MAPS } from "../sites/fixedCampaignMaps";
import { actThreeSupplies } from "./actThreeShared";
import { paletteAvailability } from "./fullPlant";
import { emptyLoadout } from "./helpers";

const PALETTE: readonly ProcessFamilyId[] = ["chlorine_sodium", "nitrogen_oxide", "iron"];
const AVAILABLE = paletteAvailability(PALETTE);
const ROUTES: readonly RouteIngressDefinition[] = [
  {
    id: "outer_store",
    roomId: "west_intake",
    offset: { column: 0, elevation: 0 },
    movementCost: 1,
    eligibility: "all",
  },
  {
    id: "upper_store",
    roomId: "switchyard",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.06,
    eligibility: "all",
  },
  {
    id: "inner_store",
    roomId: "gallery",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.12,
    eligibility: "all",
  },
];
const on = (routeId: string, entries: readonly WaveEntry[]): WaveEntry[] =>
  entries.map((entry) => ({ ...entry, routeId }));
const wave = (...groups: WaveEntry[][]): WaveEntry[] =>
  groups.flat().sort((left, right) => left.at - right.at);

/** Vasker Store alternates fast, heavy, upper, and field-supported columns across overlapping rooms. */
export const VASKER_STORE_LEVEL: LevelDefinition = {
  id: "vasker_store",
  number: 10,
  palette: PALETTE,
  enemyLevel: 29,
  focusRoomId: "reservoir",
  featuredReactionIds: ["chlor_alkali_electrolysis", "ammonia_oxidation"],
  startingMatter: 470,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: actThreeSupplies("outer_store", {
    gasCapacity: 1_050,
    gasContents: { hydrogen: 300, oxygen: 150, nitrogen: 230 },
    gasCost: 42,
    water: 220,
    brine: 220,
    liquidCapacity: 260,
    hazard: {
      gas: {
        contents: { chlorine: 60, ammonia: 25 },
        capacity: 110,
        cost: 22,
        availableFromRound: "outer_store",
      },
      liquid: {
        contents: { hydrochloric_acid: 24 },
        capacity: 36,
        cost: 22,
        availableFromRound: "outer_store",
      },
    },
    waterCost: 13,
    brineCost: 17,
  }),
  site: {
    kind: "fixed",
    map: FIXED_CAMPAIGN_MAPS.vasker_store,
    hullAnchor: { columns: 80, elevations: 0 },
  },
  loadout: {
    ...emptyLoadout(),
    stationary: {
      switchyard: { hematite: 24, magnetite: 10 },
      furnace: { iron_catalyst: 5 },
      gallery: { platinum_catalyst: 4 },
    },
  },
  routes: ROUTES,
  rounds: [
    {
      id: "outer_store",
      wave: wave(
        on("outer_store", enemySequence(7, "flintjack", 0.5, 1.7, -10)),
        on("upper_store", enemySequence(5, "deckmouth", 1, 2.3, -10))
      ),
      availability: AVAILABLE,
    },
    {
      id: "heavy_store",
      wave: wave(
        on("outer_store", enemySequence(5, "splitback", 0.5, 2.5, -9)),
        on("upper_store", enemySequence(5, "redlung", 1, 2.6, -9))
      ),
      availability: AVAILABLE,
    },
    {
      id: "upper_store",
      wave: wave(
        on("outer_store", enemySequence(6, "clatter", 0.5, 1.8, -9)),
        on("upper_store", enemySequence(5, "shear_jelly", 1, 2.2, -9)),
        on("inner_store", enemySequence(4, "glowbag", 1.5, 2.5, -10)),
        on("upper_store", enemySequence(1, "anchor", 3, 1, -10))
      ),
      availability: AVAILABLE,
    },
    {
      id: "overlap_cycle",
      wave: wave(
        on("outer_store", enemySequence(7, "flintjack", 0.5, 1.35, -8)),
        on("upper_store", enemySequence(6, "deckmouth", 1, 1.7, -8)),
        on("inner_store", enemySequence(5, "redlung", 1.5, 2.3, -8)),
        on("inner_store", enemySequence(4, "glowbag", 2, 2.3, -9))
      ),
      availability: AVAILABLE,
    },
    {
      id: "closure_stock",
      wave: wave(
        on("outer_store", enemySequence(6, "flintjack", 0.5, 1.35, -8)),
        on("outer_store", enemySequence(6, "deckmouth", 1, 1.7, -8)),
        on("upper_store", enemySequence(5, "splitback", 1.5, 2.1, -8)),
        on("inner_store", enemySequence(5, "redlung", 2, 2.3, -8)),
        on("upper_store", enemySequence(5, "clatter", 2.5, 1.8, -8)),
        on("inner_store", enemySequence(4, "glowbag", 3, 2.2, -8)),
        on("inner_store", enemySequence(4, "shear_jelly", 3.5, 2.3, -8)),
        on("upper_store", enemySequence(1, "anchor", 5, 1, -9))
      ),
      availability: AVAILABLE,
    },
  ],
};
