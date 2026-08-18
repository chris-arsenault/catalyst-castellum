import type { LevelDefinition, RouteIngressDefinition } from "../../definitionTypes";
import type { ProcessFamilyId, WaveEntry } from "../../types";
import { enemySequence } from "../enemies";
import { FIXED_CAMPAIGN_MAPS } from "../sites/fixedCampaignMaps";
import { actThreeSupplies } from "./actThreeShared";
import { paletteAvailability } from "./fullPlant";
import { emptyLoadout } from "./helpers";

const PALETTE: readonly ProcessFamilyId[] = ["uranium_fluorine", "carbon_steam", "chlorine_sodium"];
const AVAILABLE = paletteAvailability(PALETTE);
const ROUTES: readonly RouteIngressDefinition[] = [
  {
    id: "council_west",
    roomId: "west_intake",
    offset: { column: 0, elevation: 0 },
    movementCost: 1,
    eligibility: "all",
  },
  {
    id: "council_high",
    roomId: "gallery",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.05,
    eligibility: "flying",
  },
  {
    id: "council_lower",
    roomId: "switchyard",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.1,
    eligibility: "all",
  },
];
const on = (routeId: string, entries: readonly WaveEntry[]): WaveEntry[] =>
  entries.map((entry) => ({ ...entry, routeId }));
const wave = (...groups: WaveEntry[][]): WaveEntry[] =>
  groups.flat().sort((left, right) => left.at - right.at);

/** Station 14 divides Council formations between the west deck, upper air, and lower approach. */
export const STATION_14_LEVEL: LevelDefinition = {
  id: "station_14",
  number: 9,
  palette: PALETTE,
  enemyLevel: 28,
  focusRoomId: "reservoir",
  featuredReactionIds: ["hydrogen_fluoride_electrolysis", "chlor_alkali_electrolysis"],
  startingMatter: 440,
  startingCoreIntegrity: 100,
  assaultTheme: "standard",
  supplies: actThreeSupplies("first_beacon", {
    gasCapacity: 950,
    gasContents: { hydrogen: 320, oxygen: 160, hydrogen_fluoride: 220, nitrogen: 80 },
    gasCost: 38,
    water: 200,
    brine: 200,
    liquidCapacity: 240,
    waterCost: 12,
    brineCost: 16,
  }),
  site: {
    kind: "fixed",
    map: FIXED_CAMPAIGN_MAPS.station_14,
    hullAnchor: { columns: 76, elevations: 0 },
  },
  loadout: {
    ...emptyLoadout(),
    stationary: {
      furnace: { solid_carbon: 24, iron_catalyst: 4 },
      gallery: { uranyl_fluoride: 36 },
    },
  },
  routes: ROUTES,
  rounds: [
    {
      id: "first_beacon",
      wave: wave(
        on("council_west", enemySequence(6, "deckmouth", 0.5, 2.2, -9)),
        on("council_high", enemySequence(2, "glowbag", 1.5, 3, -10))
      ),
      availability: AVAILABLE,
    },
    {
      id: "split_position",
      wave: wave(
        on("council_west", enemySequence(6, "flintjack", 0.5, 1.7, -9)),
        on("council_lower", enemySequence(5, "clatter", 1, 1.9, -9)),
        on("council_high", enemySequence(2, "glowbag", 1.5, 2.6, -10))
      ),
      availability: AVAILABLE,
    },
    {
      id: "shielded_return",
      wave: wave(
        on("council_west", enemySequence(5, "splitback", 0.5, 2.5, -9)),
        on("council_lower", enemySequence(5, "redlung", 1, 2.5, -9)),
        on("council_high", enemySequence(2, "shear_jelly", 1.5, 2.4, -9)),
        on("council_lower", enemySequence(1, "anchor", 3, 1, -10))
      ),
      availability: AVAILABLE,
    },
    {
      id: "fourth_signal",
      wave: wave(
        on("council_west", enemySequence(7, "flintjack", 0.5, 1.4, -8)),
        on("council_lower", enemySequence(6, "clatter", 1, 1.7, -8)),
        on("council_high", enemySequence(3, "glowbag", 1.5, 2.2, -9)),
        on("council_lower", enemySequence(2, "shear_jelly", 2, 2.2, -8))
      ),
      availability: AVAILABLE,
    },
    {
      id: "near_echo",
      wave: wave(
        on("council_west", enemySequence(6, "deckmouth", 0.5, 1.8, -8)),
        on("council_west", enemySequence(6, "flintjack", 1, 1.4, -8)),
        on("council_lower", enemySequence(5, "splitback", 1.5, 2.1, -8)),
        on("council_lower", enemySequence(5, "redlung", 2, 2.3, -8)),
        on("council_lower", enemySequence(5, "clatter", 2.5, 1.8, -8)),
        on("council_high", enemySequence(2, "glowbag", 3, 2.3, -8)),
        on("council_high", enemySequence(2, "shear_jelly", 3.5, 2.4, -8)),
        on("council_lower", enemySequence(1, "anchor", 5, 1, -9))
      ),
      availability: AVAILABLE,
    },
  ],
};
