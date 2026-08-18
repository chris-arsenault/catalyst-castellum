import type { LevelDefinition, RouteIngressDefinition } from "../../definitionTypes";
import type { ProcessFamilyId, WaveEntry } from "../../types";
import { enemySequence } from "../enemies";
import { FIXED_CAMPAIGN_MAPS } from "../sites/fixedCampaignMaps";
import { actTwoSupplies } from "./actTwoShared";
import { paletteAvailability } from "./fullPlant";
import { emptyLoadout } from "./helpers";

const PALETTE: readonly ProcessFamilyId[] = ["nickel", "carbon_steam", "chlorine_sodium"];
const AVAILABLE = paletteAvailability(PALETTE);
const ROUTES: readonly RouteIngressDefinition[] = [
  {
    id: "west_freight",
    roomId: "west_intake",
    offset: { column: 0, elevation: 0 },
    movementCost: 1,
    eligibility: "all",
  },
  {
    id: "upper_freight",
    roomId: "reservoir",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.08,
    eligibility: "all",
  },
  {
    id: "lower_freight",
    roomId: "lower_intake",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.12,
    eligibility: "all",
  },
];
const on = (routeId: string, entries: readonly WaveEntry[]): WaveEntry[] =>
  entries.map((entry) => ({ ...entry, routeId }));
const wave = (...groups: WaveEntry[][]): WaveEntry[] =>
  groups.flat().sort((left, right) => left.at - right.at);

/** Junction L-6 separates three freight lanes and introduces sustained pipe-assisted projection. */
export const JUNCTION_L6_LEVEL: LevelDefinition = {
  id: "junction_l6",
  number: 7,
  palette: PALETTE,
  enemyLevel: 26,
  focusRoomId: "lower_intake",
  featuredReactionIds: ["chlor_alkali_electrolysis"],
  startingMatter: 370,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: actTwoSupplies("freight_intake", {
    capacity: 760,
    contents: { hydrogen: 300, oxygen: 120, carbon_monoxide: 260 },
    cost: 31,
  }),
  site: {
    kind: "fixed",
    map: FIXED_CAMPAIGN_MAPS.junction_l6,
    hullAnchor: { columns: 78, elevations: 0 },
  },
  loadout: {
    ...emptyLoadout(),
    stationary: {
      lower_intake: { surface_nickel: 28, nickel_oxide: 18 },
      furnace: { surface_nickel: 12 },
      reservoir: { iron_catalyst: 4, solid_carbon: 20 },
    },
  },
  routes: ROUTES,
  rounds: [
    {
      id: "freight_intake",
      wave: wave(
        on("west_freight", enemySequence(7, "deckmouth", 0.5, 2.5, -6)),
        on("upper_freight", enemySequence(6, "flintjack", 1, 2.2, -6))
      ),
      availability: AVAILABLE,
    },
    {
      id: "emitter_manifest",
      wave: wave(
        on("west_freight", enemySequence(8, "flintjack", 0.5, 1.8, -5)),
        on("upper_freight", enemySequence(5, "clatter", 1, 2.1, -5)),
        on("lower_freight", enemySequence(4, "glowbag", 2, 3, -6))
      ),
      availability: AVAILABLE,
    },
    {
      id: "carrier_transfer",
      wave: wave(
        on("west_freight", enemySequence(6, "splitback", 0.5, 2.7, -5)),
        on("upper_freight", enemySequence(6, "redlung", 1, 2.8, -5)),
        on("lower_freight", enemySequence(5, "shear_jelly", 1.5, 2.6, -5))
      ),
      availability: AVAILABLE,
    },
    {
      id: "industrial_feed",
      wave: wave(
        on("west_freight", enemySequence(9, "flintjack", 0.5, 1.55, -4)),
        on("upper_freight", enemySequence(7, "clatter", 1, 1.8, -4)),
        on("lower_freight", enemySequence(6, "glowbag", 1.5, 2.5, -5)),
        on("upper_freight", enemySequence(1, "anchor", 3, 1, -6))
      ),
      availability: AVAILABLE,
    },
    {
      id: "qualification_run",
      wave: wave(
        on("west_freight", enemySequence(9, "splitback", 0.5, 2, -4)),
        on("upper_freight", enemySequence(8, "redlung", 1, 2.3, -4)),
        on("lower_freight", enemySequence(8, "shear_jelly", 1.25, 2, -4)),
        on("lower_freight", enemySequence(6, "glowbag", 2, 2.4, -4)),
        on("upper_freight", enemySequence(1, "anchor", 3.5, 5, -5))
      ),
      availability: AVAILABLE,
    },
  ],
};
