/* eslint-disable max-lines -- Authored campaign data remains a single inspectable catalog. */
import type {
  EquipmentInstance,
  EquipmentSocketId,
  GameCommand,
  GasAmounts,
  GasBufferId,
  GasSourceId,
  LevelId,
  LiquidAmounts,
  LiquidBufferId,
  LiquidSourceId,
  RoomId,
  ScenarioAvailability,
  TransportRunId,
  WaveEntry,
} from "../types";
import { EQUIPMENT_IDS, LEVEL_IDS, TRANSPORT_RUN_IDS } from "../types";
import { COMMISSIONING_WAVES, COMMISSIONING_WAVE_BRIEFS, enemySequence } from "./enemies";
import { TUTORIAL_EQUIPMENT, TUTORIAL_INITIAL_TEMPERATURES } from "./scenario";
import { TRANSPORT_RUNS } from "./transportRuns";

export type ScenarioRoomEquipment = Partial<
  Record<RoomId, Partial<Record<EquipmentSocketId, EquipmentInstance>>>
>;

export interface GasConduitLoadout {
  installed: boolean;
  enabled: boolean;
  gas: Partial<GasAmounts> | null;
}

export interface LiquidConduitLoadout {
  installed: boolean;
  enabled: boolean;
  liquid: Partial<LiquidAmounts> | null;
}

export interface FacilityLoadout {
  equipment: ScenarioRoomEquipment;
  initialTemperatures: Partial<Record<RoomId, number>>;
  gasConduits: Partial<Record<TransportRunId, GasConduitLoadout>>;
  liquidConduits: Partial<Record<TransportRunId, LiquidConduitLoadout>>;
  gasSourceGas: Partial<Record<GasSourceId, Partial<GasAmounts>>>;
  liquidSourceAmounts: Partial<Record<LiquidSourceId, number>>;
  gasBuffers: Partial<Record<GasBufferId, Partial<GasAmounts>>>;
  liquidBuffers: Partial<Record<LiquidBufferId, Partial<LiquidAmounts>>>;
}

export interface RoundDefinition {
  id: string;
  title: string;
  detail: string;
  objective: string;
  primeSeconds: number;
  wave: WaveEntry[];
  availability: ScenarioAvailability;
}

export interface LevelDefinition {
  id: LevelId;
  number: number;
  name: string;
  kicker: string;
  briefing: string;
  lesson: string;
  focusRoomId: RoomId;
  startingMatter: number;
  startingCoreIntegrity: number;
  loadout: FacilityLoadout;
  rounds: RoundDefinition[];
  playtestActions: GameCommand[];
}

const availability = (options: Partial<ScenarioAvailability>): ScenarioAvailability => ({
  equipment: options.equipment ?? [],
  gasRuns: options.gasRuns ?? [],
  liquidRuns: options.liquidRuns ?? [],
  gasSources: options.gasSources ?? [],
  liquidSources: options.liquidSources ?? [],
});

const emptyLoadout = (): FacilityLoadout => ({
  equipment: {},
  initialTemperatures: {},
  gasConduits: {},
  liquidConduits: {},
  gasSourceGas: {},
  liquidSourceAmounts: {},
  gasBuffers: {},
  liquidBuffers: {},
});

const gasRun = (enabled = false, gas: Partial<GasAmounts> | null = null): GasConduitLoadout => ({
  installed: true,
  enabled,
  gas,
});

const liquidRun = (
  enabled = false,
  liquid: Partial<LiquidAmounts> | null = null
): LiquidConduitLoadout => ({
  installed: true,
  enabled,
  liquid,
});

const flashAvailability = availability({
  equipment: ["gas_agitator"],
  gasRuns: ["core_furnace"],
  gasSources: ["starter_gas_header"],
});

const flashPoint: LevelDefinition = {
  id: "flash_point",
  number: 1,
  name: "Flash Point",
  kicker: "Lesson 01 · Build one dangerous room",
  briefing:
    "The Core starter header holds H₂ and O₂ near their combustion ratio. Its gas duct reaches R-02, a chamber on the hostile route; the fan begins offline.",
  lesson:
    "Install agitation in R-02, start its gas fan, and use transport delay to charge a repeating combustion attack.",
  focusRoomId: "furnace",
  startingMatter: 16,
  startingCoreIntegrity: 100,
  loadout: {
    ...emptyLoadout(),
    gasConduits: { core_furnace: gasRun(false) },
    gasSourceGas: { starter_gas_header: { hydrogen: 76, oxygen: 38 } },
  },
  rounds: [
    {
      id: "first_spark",
      title: "First spark",
      detail:
        "Eight crawlers are approaching Core. Time R-02’s OX-1 cycle to catch them inside the chamber.",
      objective: "Install a Gas Agitator in R-02 and switch on the Core–R-02 gas duct.",
      primeSeconds: 24,
      wave: enemySequence(8, "crawler", 0.5, 2.2),
      availability: flashAvailability,
    },
    {
      id: "stored_momentum",
      title: "Stored momentum",
      detail:
        "A faster follow-up tests the chamber inventory and the timing of its discrete flash cycle.",
      objective: "Run the established R-02 cycle and inspect each incident before adjusting it.",
      primeSeconds: 10,
      wave: [
        ...enemySequence(6, "skimmer", 0.5, 1.65),
        ...enemySequence(2, "crawler", 2.2, 2.5),
      ].sort((left, right) => left.at - right.at),
      availability: flashAvailability,
    },
  ],
  playtestActions: [
    {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      equipmentId: "gas_agitator",
    },
    { type: "set_conduit", runId: "core_furnace", phase: "gas", enabled: true },
  ],
};

const reagentRoundOne = availability({
  equipment: ["membrane_cell"],
  gasRuns: ["cell_absorber"],
  liquidRuns: ["core_cell"],
  liquidSources: ["water_tank", "sodium_chloride_tank"],
});

const reagentRoundTwo = availability({
  ...reagentRoundOne,
  gasRuns: ["cell_absorber", "core_cell"],
});

const makeTheReagent: LevelDefinition = {
  id: "make_the_reagent",
  number: 2,
  name: "Make the Reagent",
  kicker: "Lesson 02 · One reaction, one junction",
  briefing:
    "A Core–R-05 feed pipe carries mixed water and brine to a membrane-cell manifold. The cell’s separated outlets feed a shared gas junction and a liquid junction.",
  lesson:
    "The membrane cell produces Cl₂, H₂, and NaOH together. Outlet pressure and shared-junction flow determine how long the cell can sustain production.",
  focusRoomId: "lower_intake",
  startingMatter: 28,
  startingCoreIntegrity: 100,
  loadout: {
    ...emptyLoadout(),
    gasConduits: { cell_absorber: gasRun(true), core_cell: gasRun(false) },
    liquidConduits: { core_cell: liquidRun(false) },
    liquidSourceAmounts: { water_tank: 120, sodium_chloride_tank: 120 },
  },
  rounds: [
    {
      id: "co_products",
      title: "Co-products",
      detail: "A crawler column will cross R-03 as the R-05 gas stream arrives.",
      objective: "Install the Membrane Cell and observe all three conserved outputs.",
      primeSeconds: 25,
      wave: enemySequence(10, "crawler", 0.5, 2),
      availability: reagentRoundOne,
    },
    {
      id: "shared_relief",
      title: "Shared relief",
      detail:
        "The R-05 recovery duct draws the gas-junction stream into Core recovery, relieving outlet pressure while consuming both H₂ and Cl₂.",
      objective: "Use the R-05 recovery fan when shared outlet pressure stalls the cell.",
      primeSeconds: 14,
      wave: enemySequence(9, "skimmer", 0.5, 1.45),
      availability: reagentRoundTwo,
    },
  ],
  playtestActions: [
    {
      type: "install_equipment",
      roomId: "lower_intake",
      socketId: "socket_a",
      equipmentId: "membrane_cell",
    },
    { type: "set_conduit", runId: "core_cell", phase: "liquid", enabled: true },
    { type: "set_conduit", runId: "cell_absorber", phase: "gas", enabled: true },
  ],
};

const acidAvailability = availability({
  equipment: ["membrane_cell", "thermal_coil", "gas_agitator"],
  gasRuns: ["cell_furnace", "furnace_return", "return_final"],
  liquidRuns: ["core_cell"],
  liquidSources: ["water_tank", "sodium_chloride_tank"],
});

const acidLine: LevelDefinition = {
  id: "acid_line",
  number: 3,
  name: "Acid Line",
  kicker: "Lesson 03 · Turn a mixed output into a second reaction",
  briefing:
    "R-05 stores Cl₂ and H₂ in separated buffers, then combines them at its gas junction for routing. R-02 and the R-04 return await commissioning.",
  lesson:
    "Heat and agitation turn the transported H₂/Cl₂ mixture into HCl. Route length and shared inventory determine when it reaches the wave.",
  focusRoomId: "furnace",
  startingMatter: 42,
  startingCoreIntegrity: 100,
  loadout: {
    ...emptyLoadout(),
    equipment: {
      lower_intake: {
        socket_a: { equipmentId: "membrane_cell", level: 1, enabled: true },
      },
    },
    gasConduits: {
      cell_furnace: gasRun(false),
      furnace_return: gasRun(false),
      return_final: gasRun(false),
    },
    liquidConduits: { core_cell: liquidRun(false) },
    liquidSourceAmounts: { water_tank: 130, sodium_chloride_tank: 130 },
    gasBuffers: { anode_header: { chlorine: 16 }, cathode_header: { hydrogen: 16 } },
  },
  rounds: [
    {
      id: "hot_mix",
      title: "Hot mix",
      detail: "Armored shells demand a concentrated corrosive or thermal exposure.",
      objective: "Equip R-02, start the mixed-gas feed, and build the downstream return.",
      primeSeconds: 30,
      wave: enemySequence(7, "shell", 0.5, 2.5),
      availability: acidAvailability,
    },
    {
      id: "residence_time",
      title: "Residence time",
      detail: "Skimmers race the inventory retained in the physical headers.",
      objective: "Read conduit fill and room conditions; adjust the limiting run.",
      primeSeconds: 14,
      wave: [...enemySequence(8, "skimmer", 0.5, 1.2), ...enemySequence(3, "floater", 2, 2.1)].sort(
        (left, right) => left.at - right.at
      ),
      availability: acidAvailability,
    },
  ],
  playtestActions: [
    {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_a",
      equipmentId: "thermal_coil",
    },
    {
      type: "install_equipment",
      roomId: "furnace",
      socketId: "socket_b",
      equipmentId: "gas_agitator",
    },
    { type: "set_conduit", runId: "cell_furnace", phase: "gas", enabled: true },
    { type: "set_conduit", runId: "furnace_return", phase: "gas", enabled: true },
    { type: "set_conduit", runId: "return_final", phase: "gas", enabled: true },
  ],
};

const allGasRuns = TRANSPORT_RUN_IDS.filter((runId) => TRANSPORT_RUNS[runId].gas !== null);
const allLiquidRuns = TRANSPORT_RUN_IDS.filter((runId) => TRANSPORT_RUNS[runId].liquid !== null);
const allAvailability = availability({
  equipment: [...EQUIPMENT_IDS],
  gasRuns: allGasRuns,
  liquidRuns: allLiquidRuns,
  gasSources: ["starter_gas_header"],
  liquidSources: ["water_tank", "sodium_chloride_tank"],
});

const storedChlorine: LevelDefinition = {
  id: "stored_chlorine",
  number: 4,
  name: "Stored Chlorine",
  kicker: "Lesson 04 · Build a delayed second-order weapon",
  briefing:
    "The acid line is commissioned. R-03 can bind chlorine as NaOCl, then transfer its stored liquid to R-06.",
  lesson:
    "A wet contactor forms NaOCl in R-03. Pumping that stored liquid into acidic R-06 releases Cl₂ and leaves its byproducts in the chamber.",
  focusRoomId: "reservoir",
  startingMatter: 42,
  startingCoreIntegrity: 100,
  loadout: {
    ...emptyLoadout(),
    equipment: {
      furnace: {
        socket_a: { equipmentId: "thermal_coil", level: 1, enabled: true },
        socket_b: { equipmentId: "gas_agitator", level: 1, enabled: true },
      },
      lower_intake: {
        socket_a: { equipmentId: "membrane_cell", level: 1, enabled: true },
      },
    },
    gasConduits: {
      cell_furnace: gasRun(true),
      cell_absorber: gasRun(false),
      furnace_return: gasRun(true),
      return_final: gasRun(true),
      core_final: gasRun(true),
    },
    liquidConduits: {
      core_cell: liquidRun(false),
      cell_absorber: liquidRun(true),
      core_final: liquidRun(true),
      absorber_final: liquidRun(false),
      core_absorber: liquidRun(false),
    },
    liquidSourceAmounts: { water_tank: 150, sodium_chloride_tank: 150 },
  },
  rounds: [
    {
      id: "store",
      title: "Store the oxidizer",
      detail: "A slow armored wave crosses R-03 while its first NaOCl inventory forms.",
      objective: "Install a Wet Contactor in R-03 and monitor the forming liquid inventory.",
      primeSeconds: 34,
      wave: [...enemySequence(5, "shell", 0.5, 2.8), ...enemySequence(3, "bellows", 2, 3.1)].sort(
        (left, right) => left.at - right.at
      ),
      availability: allAvailability,
    },
    {
      id: "release",
      title: "Move, then release",
      detail: "The R-03–R-06 pipe now carries the persisted stored mixture into acid.",
      objective: "Build and enable the transfer, then inspect delayed Cl₂ release in R-06.",
      primeSeconds: 25,
      wave: [
        ...enemySequence(5, "bellows", 0.5, 2.25),
        ...enemySequence(5, "shell", 1.8, 2.35),
      ].sort((left, right) => left.at - right.at),
      availability: allAvailability,
    },
  ],
  playtestActions: [
    { type: "set_conduit", runId: "cell_absorber", phase: "gas", enabled: true },
    { type: "set_conduit", runId: "core_cell", phase: "liquid", enabled: true },
    {
      type: "install_equipment",
      roomId: "reservoir",
      socketId: "socket_a",
      equipmentId: "wet_contactor",
    },
    {
      type: "install_equipment",
      roomId: "washlock",
      socketId: "socket_a",
      equipmentId: "wet_contactor",
    },
    { type: "set_conduit", runId: "absorber_final", phase: "liquid", enabled: true },
  ],
};

const fullGasLoadout = Object.fromEntries(
  allGasRuns.map((runId) => [runId, gasRun(false)])
) as Partial<Record<TransportRunId, GasConduitLoadout>>;
const fullLiquidLoadout = Object.fromEntries(
  allLiquidRuns.map((runId) => [runId, liquidRun(false)])
) as Partial<Record<TransportRunId, LiquidConduitLoadout>>;

const commissioningExam: LevelDefinition = {
  id: "commissioning_exam",
  number: 5,
  name: "Commissioning Exam",
  kicker: "Checkpoint 05 · Full process plant",
  briefing:
    "The full plant is commissioned: rooms, junctions, and conduits follow their physical routes and carry mixed inventories.",
  lesson:
    "Balance finite feedstocks, mixed junctions, conduit capacity, acid production, stored oxidizer, relief, and persistent waste over three assaults.",
  focusRoomId: "lower_intake",
  startingMatter: 58,
  startingCoreIntegrity: 100,
  loadout: {
    ...emptyLoadout(),
    equipment: TUTORIAL_EQUIPMENT,
    initialTemperatures: TUTORIAL_INITIAL_TEMPERATURES,
    gasConduits: fullGasLoadout,
    liquidConduits: fullLiquidLoadout,
    gasSourceGas: { starter_gas_header: { hydrogen: 40, oxygen: 20 } },
    liquidSourceAmounts: { water_tank: 140, sodium_chloride_tank: 140 },
  },
  rounds: COMMISSIONING_WAVES.map((wave, index) => ({
    id: `commissioning_${index + 1}`,
    title: COMMISSIONING_WAVE_BRIEFS[index]?.title ?? `Assault ${index + 1}`,
    detail: COMMISSIONING_WAVE_BRIEFS[index]?.detail ?? "Full plant trial.",
    objective: "Tune the plant’s coupled flows, then lock it for assault.",
    primeSeconds: 72,
    wave,
    availability: allAvailability,
  })),
  playtestActions: [
    { type: "set_conduit", runId: "core_cell", phase: "liquid", enabled: true },
    { type: "set_conduit", runId: "cell_furnace", phase: "gas", enabled: true },
    { type: "set_conduit", runId: "cell_absorber", phase: "gas", enabled: true },
    { type: "set_conduit", runId: "cell_absorber", phase: "liquid", enabled: true },
    { type: "charge_liquid_source", sourceId: "water_tank" },
    { type: "charge_liquid_source", sourceId: "sodium_chloride_tank" },
  ],
};

export const LEVEL_DEFINITIONS: Record<LevelId, LevelDefinition> = {
  flash_point: flashPoint,
  make_the_reagent: makeTheReagent,
  acid_line: acidLine,
  stored_chlorine: storedChlorine,
  commissioning_exam: commissioningExam,
};

export const CAMPAIGN_LEVELS: LevelDefinition[] = LEVEL_IDS.map((id) => LEVEL_DEFINITIONS[id]);

export const currentLevel = (levelId: LevelId): LevelDefinition => LEVEL_DEFINITIONS[levelId];

export const currentRound = (levelId: LevelId, roundIndex: number): RoundDefinition => {
  const level = currentLevel(levelId);
  return level.rounds[Math.min(roundIndex, level.rounds.length - 1)] as RoundDefinition;
};

export const nextLevelId = (levelId: LevelId): LevelId | null => {
  const index = LEVEL_IDS.indexOf(levelId);
  return LEVEL_IDS[index + 1] ?? null;
};
