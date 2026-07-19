import type { ReferenceBuildDefinition } from "../playtestPortfolios";
import { ACT_TWO_REFERENCE_BUILDS } from "./actTwo";
import {
  buildLine as line,
  install,
  LIQUID_CHARGES,
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
  vasker_store: [...establishedActThreeBuilds, withSpecialistId("vasker_store")],
  lane_six: [...establishedActThreeBuilds, withSpecialistId("lane_six")],
  pell_cordon: [...establishedActThreeBuilds, withSpecialistId("pell_cordon")],
} as const satisfies Record<string, readonly ReferenceBuildDefinition[]>;
