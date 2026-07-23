import type { ReferenceBuildDefinition } from "../playtestPortfolios";
import { ACT_TWO_REFERENCE_BUILDS } from "./actTwo";
import {
  buildLine as line,
  GAS_CHARGE,
  HAZARD_GAS_CHARGE,
  install,
  LIQUID_CHARGES,
  loadMedium,
  portfolioRound as round,
  SPECIALTY_GAS_CHARGE,
  upgrade,
} from "./buildCommands";

/**
 * Four established defenses prove that the uranium feed remains optional. The fifth
 * recovers room-bound uranyl fluoride with HF-derived fluorine and dry heat, then
 * carries the resulting UF6 into a wet chamber. This produces a physical
 * radiation/corrosion signature unavailable to the inherited builds.
 */
const deployEstablishedStage = (build: ReferenceBuildDefinition): ReferenceBuildDefinition => ({
  ...build,
  rounds: build.rounds.map((buildRound, index) => {
    if (index === 0) {
      return {
        ...buildRound,
        commands: [...buildRound.commands, ...(build.rounds[2]?.commands ?? [])],
      };
    }
    return index === 2 ? round() : buildRound;
  }),
});

const adaptEstablishedBuild = (build: ReferenceBuildDefinition): ReferenceBuildDefinition => {
  const deployed = deployEstablishedStage(build);
  if (deployed.archetype === "continuous") {
    return {
      ...deployed,
      rounds: deployed.rounds.map((buildRound, index) =>
        index === 0
          ? {
              ...buildRound,
              commands: [
                ...buildRound.commands,
                ...line("gas_line", "gallery", "switchyard"),
                install("switchyard", "socket_a", "gas_agitator"),
                upgrade("switchyard", "socket_a"),
                upgrade("switchyard", "socket_a"),
              ],
            }
          : buildRound
      ),
    };
  }
  if (deployed.archetype !== "control") return deployed;
  return {
    ...deployed,
    rounds: deployed.rounds.map((buildRound, index) => {
      if (index === 0) {
        return {
          ...buildRound,
          commands: [
            ...buildRound.commands,
            ...line("gas_line", "lower_intake", "furnace"),
            ...line("gas_line", "furnace", "gallery"),
            install("furnace", "socket_b", "thermal_coil"),
            install("gallery", "socket_b", "gas_agitator"),
            upgrade("furnace", "socket_b"),
            upgrade("gallery", "socket_b"),
            ...line("gas_line", "core", "switchyard"),
            install("switchyard", "socket_b", "gas_agitator"),
            upgrade("switchyard", "socket_b"),
          ],
        };
      }
      if (index === 3) {
        return {
          ...buildRound,
          commands: [
            ...buildRound.commands,
            ...line("liquid_line", "gallery", "switchyard"),
            install("switchyard", "socket_a", "wet_contactor"),
            upgrade("switchyard", "socket_a"),
          ],
        };
      }
      return buildRound;
    }),
  };
};

const establishedActThreeBuilds = ACT_TWO_REFERENCE_BUILDS.pell_cut
  .slice(0, 4)
  .map(adaptEstablishedBuild);

/** Burst builds route the site's G-3 hazard packet into their first flash room once income exists (ADR-0009). */
const hazardBackedBurst = (
  site: string,
  build: ReferenceBuildDefinition
): ReferenceBuildDefinition => {
  if (build.archetype !== "burst") return build;
  return {
    ...build,
    id: `${site}_hazard_flash_battery`,
    rounds: build.rounds.map((buildRound, index) => {
      if (index < 2) return buildRound;
      if (index === 2)
        return {
          ...buildRound,
          commands: [
            ...buildRound.commands,
            ...line("gas_line", "washlock", "furnace"),
            HAZARD_GAS_CHARGE,
          ],
        };
      return { ...buildRound, commands: [...buildRound.commands, HAZARD_GAS_CHARGE] };
    }),
  };
};

const monoxideCorridor: ReferenceBuildDefinition = {
  id: "lane_six_monoxide_corridor",
  archetype: "continuous",
  rounds: [
    round([
      ...line("gas_line", "core", "furnace"),
      ...line("gas_line", "washlock", "furnace"),
      install("furnace", "socket_a", "gas_agitator"),
      GAS_CHARGE,
    ]),
    round([
      GAS_CHARGE,
      HAZARD_GAS_CHARGE,
      ...line("gas_line", "furnace", "gallery"),
      install("gallery", "socket_a", "gas_agitator"),
      upgrade("furnace", "socket_a"),
    ]),
    round([
      GAS_CHARGE,
      HAZARD_GAS_CHARGE,
      upgrade("furnace", "socket_a"),
      upgrade("gallery", "socket_a"),
    ]),
    round([
      GAS_CHARGE,
      HAZARD_GAS_CHARGE,
      ...line("gas_line", "gallery", "switchyard"),
      install("switchyard", "socket_a", "gas_agitator"),
      upgrade("gallery", "socket_a"),
    ]),
    round([GAS_CHARGE, HAZARD_GAS_CHARGE, upgrade("switchyard", "socket_a")]),
  ],
};

const nitricFloor: ReferenceBuildDefinition = {
  id: "lane_six_nitric_floor",
  archetype: "control",
  rounds: [
    round([
      ...line("gas_line", "washlock", "furnace"),
      install("furnace", "socket_a", "gas_agitator"),
    ]),
    round([
      HAZARD_GAS_CHARGE,
      LIQUID_CHARGES[0]!,
      ...line("liquid_line", "core", "lower_intake"),
      ...line("gas_line", "furnace", "lower_intake"),
      install("lower_intake", "socket_a", "absorber_column"),
    ]),
    round([
      HAZARD_GAS_CHARGE,
      LIQUID_CHARGES[0]!,
      install("lower_intake", "socket_b", "gas_agitator"),
      upgrade("lower_intake", "socket_a"),
    ]),
    round([
      HAZARD_GAS_CHARGE,
      LIQUID_CHARGES[0]!,
      upgrade("lower_intake", "socket_a"),
      upgrade("furnace", "socket_a"),
    ]),
    round([HAZARD_GAS_CHARGE, LIQUID_CHARGES[0]!]),
  ],
};

const oxideCarrier: ReferenceBuildDefinition = {
  id: "vasker_store_oxide_carrier",
  archetype: "carrier",
  rounds: [
    round([
      ...line("gas_line", "core", "switchyard"),
      install("switchyard", "socket_a", "packed_bed"),
      loadMedium("switchyard", "socket_a", "hematite"),
      install("switchyard", "socket_b", "gas_agitator"),
    ]),
    round([
      GAS_CHARGE,
      ...line("gas_line", "washlock", "furnace"),
      HAZARD_GAS_CHARGE,
      install("furnace", "socket_a", "gas_agitator"),
    ]),
    round([
      GAS_CHARGE,
      HAZARD_GAS_CHARGE,
      upgrade("switchyard", "socket_a"),
      upgrade("furnace", "socket_a"),
    ]),
    round([GAS_CHARGE, HAZARD_GAS_CHARGE, upgrade("switchyard", "socket_b")]),
    round([GAS_CHARGE, HAZARD_GAS_CHARGE]),
  ],
};

const flashAmmoniaHybrid: ReferenceBuildDefinition = {
  id: "lane_six_flash_ammonia_hybrid",
  archetype: "hybrid",
  rounds: [
    round([
      ...line("gas_line", "core", "furnace"),
      install("furnace", "socket_a", "thermal_coil"),
      install("furnace", "socket_b", "gas_agitator"),
      upgrade("furnace", "socket_b"),
    ]),
    round([
      GAS_CHARGE,
      HAZARD_GAS_CHARGE,
      ...line("gas_line", "washlock", "gallery"),
      install("gallery", "socket_a", "gas_agitator"),
    ]),
    round([GAS_CHARGE, HAZARD_GAS_CHARGE, upgrade("furnace", "socket_b")]),
    round([GAS_CHARGE, HAZARD_GAS_CHARGE, upgrade("gallery", "socket_a")]),
    round([GAS_CHARGE, HAZARD_GAS_CHARGE]),
  ],
};

const carbonylCarrierLine: ReferenceBuildDefinition = {
  id: "lane_six_carbonyl_carrier",
  archetype: "carrier",
  rounds: [
    round([
      ...line("gas_line", "core", "lower_intake"),
      install("lower_intake", "socket_a", "packed_bed"),
      loadMedium("lower_intake", "socket_a", "nickel_oxide"),
      install("lower_intake", "socket_b", "gas_agitator"),
    ]),
    round([
      GAS_CHARGE,
      ...line("gas_line", "lower_intake", "furnace"),
      upgrade("lower_intake", "socket_a"),
    ]),
    round([GAS_CHARGE, upgrade("lower_intake", "socket_a"), upgrade("lower_intake", "socket_b")]),
    round([GAS_CHARGE, upgrade("lower_intake", "socket_b")]),
    round([GAS_CHARGE]),
  ],
};

const uraniumDepositionLine: ReferenceBuildDefinition = {
  id: "uranium_deposition_line",
  archetype: "carrier",
  rounds: [
    round([
      ...line("gas_line", "reservoir", "gallery"),
      install("gallery", "socket_a", "fluorine_cell"),
      install("gallery", "socket_b", "thermal_coil"),
      upgrade("gallery", "socket_a"),
      upgrade("gallery", "socket_a"),
      upgrade("gallery", "socket_b"),
      upgrade("gallery", "socket_b"),
    ]),
    round([
      SPECIALTY_GAS_CHARGE,
      LIQUID_CHARGES[0]!,
      ...line("gas_line", "gallery", "washlock"),
      install("washlock", "socket_a", "gas_agitator"),
      install("washlock", "socket_b", "wet_contactor"),
      upgrade("washlock", "socket_a"),
    ]),
    round([
      SPECIALTY_GAS_CHARGE,
      LIQUID_CHARGES[0]!,
      ...line("liquid_line", "core", "washlock"),
      upgrade("washlock", "socket_a"),
      upgrade("washlock", "socket_b"),
    ]),
    round([SPECIALTY_GAS_CHARGE, LIQUID_CHARGES[0]!, upgrade("washlock", "socket_b")]),
    round([SPECIALTY_GAS_CHARGE, LIQUID_CHARGES[0]!]),
  ],
};

const withSpecialistId = (site: string): ReferenceBuildDefinition => ({
  ...uraniumDepositionLine,
  id: `${site}_uranium_deposition`,
});

export const ACT_THREE_REFERENCE_BUILDS = {
  station_14: [...establishedActThreeBuilds, withSpecialistId("station_14")],
  vasker_store: [
    hazardBackedBurst("vasker_store", establishedActThreeBuilds[0]!),
    ...establishedActThreeBuilds.slice(1),
    oxideCarrier,
  ],
  lane_six: [
    hazardBackedBurst("lane_six", establishedActThreeBuilds[0]!),
    nitricFloor,
    monoxideCorridor,
    flashAmmoniaHybrid,
    carbonylCarrierLine,
  ],
  pell_cordon: [
    hazardBackedBurst("pell_cordon", establishedActThreeBuilds[0]!),
    ...establishedActThreeBuilds.slice(1),
    withSpecialistId("pell_cordon"),
  ],
} as const satisfies Record<string, readonly ReferenceBuildDefinition[]>;
