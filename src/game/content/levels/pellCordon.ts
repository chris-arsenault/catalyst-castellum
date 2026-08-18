import type { LevelDefinition, RouteIngressDefinition } from "../../definitionTypes";
import type { ProcessFamilyId, WaveEntry } from "../../types";
import { enemySequence } from "../enemies";
import { FIXED_CAMPAIGN_MAPS } from "../sites/fixedCampaignMaps";
import { actThreeSupplies } from "./actThreeShared";
import { paletteAvailability } from "./fullPlant";
import { emptyLoadout } from "./helpers";

const PALETTE: readonly ProcessFamilyId[] = [
  "chlorine_sodium",
  "nitrogen_oxide",
  "uranium_fluorine",
];
const AVAILABLE = paletteAvailability(PALETTE);
const ROUTES: readonly RouteIngressDefinition[] = [
  {
    id: "outer_boundary",
    roomId: "west_intake",
    offset: { column: 0, elevation: 0 },
    movementCost: 1,
    eligibility: "all",
  },
  {
    id: "copied_cadence",
    roomId: "furnace",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.04,
    eligibility: "all",
  },
  {
    id: "closure_load",
    roomId: "reservoir",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.08,
    eligibility: "all",
  },
  {
    id: "near_voice",
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

/** Pell Cordon changes Near Voice formations across four routes and rewards steam-wake cadence breaks. */
export const PELL_CORDON_LEVEL: LevelDefinition = {
  id: "pell_cordon",
  number: 12,
  palette: PALETTE,
  enemyLevel: 31,
  focusRoomId: "furnace",
  featuredReactionIds: [
    "chlor_alkali_electrolysis",
    "hydrogen_fluoride_electrolysis",
    "ammonia_oxidation",
  ],
  startingMatter: 540,
  startingCoreIntegrity: 100,
  assaultTheme: "boss",
  supplies: actThreeSupplies("outer_boundary", {
    gasCapacity: 1_500,
    gasContents: { hydrogen: 420, oxygen: 210, nitrogen: 260, hydrogen_fluoride: 260 },
    gasCost: 52,
    water: 260,
    brine: 260,
    liquidCapacity: 300,
    hazard: {
      gas: {
        contents: { chlorine: 45, ammonia: 45, nitrogen_dioxide: 20 },
        capacity: 140,
        cost: 26,
        availableFromRound: "outer_boundary",
      },
      liquid: {
        contents: { sodium_hypochlorite: 28 },
        capacity: 40,
        cost: 24,
        availableFromRound: "outer_boundary",
      },
    },
    waterCost: 15,
    brineCost: 19,
  }),
  site: {
    kind: "fixed",
    map: FIXED_CAMPAIGN_MAPS.pell_cordon,
    hullAnchor: { columns: 82, elevations: 0 },
  },
  loadout: {
    ...emptyLoadout(),
    stationary: {
      furnace: { iron_catalyst: 6 },
      gallery: { platinum_catalyst: 5, uranyl_fluoride: 48 },
    },
  },
  routes: ROUTES,
  rounds: [
    {
      id: "outer_boundary",
      wave: wave(
        on("outer_boundary", enemySequence(7, "deckmouth", 0.5, 1.8, -12)),
        on("copied_cadence", enemySequence(6, "clatter", 1, 1.6, -12))
      ),
      availability: AVAILABLE,
    },
    {
      id: "copied_cadence",
      wave: wave(
        on("outer_boundary", enemySequence(9, "flintjack", 0.5, 1.05, -11)),
        on("copied_cadence", enemySequence(5, "glowbag", 1, 2, -12)),
        on("closure_load", enemySequence(5, "shear_jelly", 1.5, 2, -11))
      ),
      availability: AVAILABLE,
    },
    {
      id: "closure_load",
      wave: wave(
        on("outer_boundary", enemySequence(6, "splitback", 0.5, 2, -11)),
        on("copied_cadence", enemySequence(5, "redlung", 1, 2.1, -11)),
        on("closure_load", enemySequence(6, "clatter", 1.5, 1.6, -11)),
        on("closure_load", enemySequence(1, "anchor", 3, 1, -12))
      ),
      availability: AVAILABLE,
    },
    {
      id: "counter_pattern",
      wave: wave(
        on("outer_boundary", enemySequence(9, "flintjack", 0.5, 0.95, -10)),
        on("copied_cadence", enemySequence(7, "deckmouth", 1, 1.3, -10)),
        on("closure_load", enemySequence(6, "splitback", 1.5, 1.9, -10)),
        on("near_voice", enemySequence(5, "redlung", 2, 2, -10)),
        on("near_voice", enemySequence(5, "glowbag", 2.5, 2, -10)),
        on("near_voice", enemySequence(4, "shear_jelly", 3, 2, -10))
      ),
      availability: AVAILABLE,
    },
    {
      id: "near_voice",
      wave: wave(
        on("outer_boundary", enemySequence(9, "flintjack", 0.5, 0.9, -9)),
        on("copied_cadence", enemySequence(7, "deckmouth", 1, 1.25, -9)),
        on("closure_load", enemySequence(6, "splitback", 1.5, 1.8, -9)),
        on("near_voice", enemySequence(5, "redlung", 2, 1.9, -9)),
        on("copied_cadence", enemySequence(7, "clatter", 2.5, 1.3, -9)),
        on("near_voice", enemySequence(5, "glowbag", 3, 1.9, -9)),
        on("near_voice", enemySequence(5, "shear_jelly", 3.5, 1.9, -9)),
        on("closure_load", enemySequence(1, "anchor", 5, 1, -10))
      ),
      availability: AVAILABLE,
    },
  ],
};
