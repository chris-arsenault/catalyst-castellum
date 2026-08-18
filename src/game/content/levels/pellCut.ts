import type { LevelDefinition, RouteIngressDefinition } from "../../definitionTypes";
import type { ProcessFamilyId, WaveEntry } from "../../types";
import { enemySequence } from "../enemies";
import { FIXED_CAMPAIGN_MAPS } from "../sites/fixedCampaignMaps";
import { actTwoSupplies } from "./actTwoShared";
import { paletteAvailability } from "./fullPlant";
import { emptyLoadout } from "./helpers";

const PALETTE: readonly ProcessFamilyId[] = ["uranium_fluorine", "chlorine_sodium", "nickel"];
const AVAILABLE = paletteAvailability(PALETTE);
const ROUTES: readonly RouteIngressDefinition[] = [
  {
    id: "array_one",
    roomId: "west_intake",
    offset: { column: 0, elevation: 0 },
    movementCost: 1,
    eligibility: "all",
  },
  {
    id: "array_two",
    roomId: "switchyard",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.04,
    eligibility: "all",
  },
  {
    id: "array_three",
    roomId: "furnace",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.08,
    eligibility: "all",
  },
  {
    id: "array_four",
    roomId: "reservoir",
    offset: { column: 0, elevation: 0 },
    movementCost: 1.12,
    eligibility: "all",
  },
];
const on = (routeId: string, entries: readonly WaveEntry[]): WaveEntry[] =>
  entries.map((entry) => ({ ...entry, routeId }));
const wave = (...groups: WaveEntry[][]): WaveEntry[] =>
  groups.flat().sort((left, right) => left.at - right.at);

/** Pell Cut synchronizes four array ingresses; process preparation remains an efficiency option. */
export const PELL_CUT_LEVEL: LevelDefinition = {
  id: "pell_cut",
  number: 8,
  palette: PALETTE,
  enemyLevel: 27,
  focusRoomId: "furnace",
  featuredReactionIds: ["hydrogen_fluoride_electrolysis", "chlor_alkali_electrolysis"],
  startingMatter: 420,
  startingCoreIntegrity: 100,
  assaultTheme: "boss",
  supplies: actTwoSupplies(
    "array_one",
    { capacity: 700, contents: { hydrogen: 220, oxygen: 110, hydrogen_fluoride: 300 }, cost: 36 },
    {
      gas: {
        contents: { chlorine: 30 },
        capacity: 45,
        cost: 16,
        availableFromRound: "array_one",
      },
    }
  ),
  site: {
    kind: "fixed",
    map: FIXED_CAMPAIGN_MAPS.pell_cut,
    hullAnchor: { columns: 74, elevations: 0 },
  },
  loadout: {
    ...emptyLoadout(),
    stationary: {
      furnace: { iron_catalyst: 4 },
      lower_intake: { surface_nickel: 18, nickel_oxide: 12 },
    },
  },
  routes: ROUTES,
  rounds: [
    {
      id: "array_one",
      wave: on("array_one", enemySequence(12, "deckmouth", 0.5, 2.3, -7)),
      availability: AVAILABLE,
    },
    {
      id: "array_two",
      wave: wave(
        on("array_one", enemySequence(8, "flintjack", 0.5, 1.8, -6)),
        on("array_two", enemySequence(7, "clatter", 1, 2, -6)),
        on("array_two", enemySequence(4, "glowbag", 2, 3, -7))
      ),
      availability: AVAILABLE,
    },
    {
      id: "array_three",
      wave: wave(
        on("array_one", enemySequence(6, "splitback", 0.5, 2.8, -5)),
        on("array_two", enemySequence(6, "redlung", 1, 2.9, -5)),
        on("array_three", enemySequence(6, "shear_jelly", 1.5, 2.5, -5))
      ),
      availability: AVAILABLE,
    },
    {
      id: "array_four",
      wave: wave(
        on("array_one", enemySequence(8, "flintjack", 0.5, 1.6, -4)),
        on("array_two", enemySequence(7, "clatter", 1, 1.8, -4)),
        on("array_three", enemySequence(6, "splitback", 1.5, 2.4, -5)),
        on("array_four", enemySequence(5, "glowbag", 2, 2.6, -5))
      ),
      availability: AVAILABLE,
    },
    {
      id: "synchronized_cut",
      wave: wave(
        on("array_one", enemySequence(9, "splitback", 0.5, 2, -4)),
        on("array_two", enemySequence(8, "clatter", 1, 1.7, -4)),
        on("array_three", enemySequence(7, "redlung", 1.5, 2.3, -4)),
        on("array_four", enemySequence(7, "shear_jelly", 2, 2.1, -4)),
        on("array_four", enemySequence(5, "glowbag", 2.5, 2.5, -4)),
        on("array_three", enemySequence(1, "anchor", 4, 5, -5))
      ),
      availability: AVAILABLE,
    },
  ],
};
