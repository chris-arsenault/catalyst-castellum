import type { LevelDefinition, RouteIngressDefinition } from "../../definitionTypes";
import type { ProcessFamilyId, WaveEntry } from "../../types";
import { enemySequence } from "../enemies";
import { FIXED_CAMPAIGN_MAPS } from "../sites/fixedCampaignMaps";
import { actThreeSupplies } from "./actThreeShared";
import { paletteAvailability } from "./fullPlant";
import { emptyLoadout } from "./helpers";

const PALETTE: readonly ProcessFamilyId[] = ["carbon_steam", "nickel", "chlorine_sodium"];
const AVAILABLE = paletteAvailability(PALETTE);
const ROUTES: readonly RouteIngressDefinition[] = [
  {
    id: "west_convoy",
    roomId: "west_intake",
    offset: { column: 0, elevation: 0 },
    movementCost: 1,
    eligibility: "all",
  },
  {
    id: "paired_convoy",
    roomId: "switchyard",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.04,
    eligibility: "all",
  },
];
const on = (routeId: string, entries: readonly WaveEntry[]): WaveEntry[] =>
  entries.map((entry) => ({ ...entry, routeId }));
const wave = (...groups: WaveEntry[][]): WaveEntry[] =>
  groups.flat().sort((left, right) => left.at - right.at);

/** Lane Six compresses alternating convoy columns across a long paired approach. */
export const LANE_SIX_LEVEL: LevelDefinition = {
  id: "lane_six",
  number: 11,
  palette: PALETTE,
  enemyLevel: 30,
  focusRoomId: "gallery",
  featuredReactionIds: ["chlor_alkali_electrolysis", "nickel_carbonyl_deposition"],
  startingMatter: 500,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: actThreeSupplies("lane_marker", {
    gasCapacity: 1_250,
    gasContents: { hydrogen: 360, oxygen: 180, nitrogen: 240, carbon_monoxide: 180 },
    gasCost: 46,
    water: 240,
    brine: 240,
    liquidCapacity: 280,
    waterCost: 14,
    brineCost: 18,
  }),
  site: {
    kind: "fixed",
    map: FIXED_CAMPAIGN_MAPS.lane_six,
    hullAnchor: { columns: 84, elevations: 0 },
  },
  loadout: {
    ...emptyLoadout(),
    stationary: {
      furnace: { solid_carbon: 34, iron_catalyst: 5 },
      gallery: { surface_nickel: 18 },
      lower_intake: { nickel_oxide: 18, surface_nickel: 18 },
    },
  },
  routes: ROUTES,
  rounds: [
    {
      id: "lane_marker",
      wave: wave(
        on("west_convoy", enemySequence(7, "deckmouth", 0.5, 1.8, -11)),
        on("paired_convoy", enemySequence(6, "flintjack", 1, 1.5, -11))
      ),
      availability: AVAILABLE,
    },
    {
      id: "fast_column",
      wave: wave(
        on("west_convoy", enemySequence(9, "flintjack", 0.5, 1.1, -10)),
        on("paired_convoy", enemySequence(7, "clatter", 1, 1.45, -10))
      ),
      availability: AVAILABLE,
    },
    {
      id: "field_column",
      wave: wave(
        on("west_convoy", enemySequence(6, "splitback", 0.5, 2.1, -9)),
        on("paired_convoy", enemySequence(5, "redlung", 1, 2.2, -9)),
        on("paired_convoy", enemySequence(4, "glowbag", 1.5, 2.2, -10)),
        on("paired_convoy", enemySequence(1, "anchor", 3, 1, -10))
      ),
      availability: AVAILABLE,
    },
    {
      id: "convoy_window",
      wave: wave(
        on("west_convoy", enemySequence(9, "flintjack", 0.5, 0.95, -9)),
        on("paired_convoy", enemySequence(7, "deckmouth", 1, 1.35, -9)),
        on("west_convoy", enemySequence(6, "clatter", 1.5, 1.45, -9)),
        on("paired_convoy", enemySequence(5, "shear_jelly", 2, 1.9, -9)),
        on("paired_convoy", enemySequence(4, "glowbag", 2.5, 2, -9))
      ),
      availability: AVAILABLE,
    },
    {
      id: "whole_lane",
      wave: wave(
        on("west_convoy", enemySequence(8, "flintjack", 0.5, 0.95, -9)),
        on("paired_convoy", enemySequence(4, "deckmouth", 1, 1.3, -9)),
        on("west_convoy", enemySequence(6, "splitback", 1.5, 1.9, -9)),
        on("paired_convoy", enemySequence(3, "redlung", 2, 2, -9)),
        on("west_convoy", enemySequence(6, "clatter", 2.5, 1.4, -9)),
        on("paired_convoy", enemySequence(2, "glowbag", 3, 2, -9)),
        on("paired_convoy", enemySequence(3, "shear_jelly", 3.5, 2, -9)),
        on("paired_convoy", enemySequence(1, "anchor", 5, 1, -10))
      ),
      availability: AVAILABLE,
    },
  ],
};
