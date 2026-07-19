import type { BuildArchetypeId } from "../../playtest/types";
import type { ReferenceBuildDefinition } from "../playtestPortfolios";
import {
  buildLine as line,
  GAS_CHARGE,
  install,
  LIQUID_CHARGES,
  portfolioRound as round,
  SPECIALTY_GAS_CHARGE,
  upgrade,
} from "./buildCommands";
import { MORROW_POCKET_REFERENCE_BUILDS } from "./morrowPocket";

const established = (archetype: BuildArchetypeId): ReferenceBuildDefinition => {
  const build = MORROW_POCKET_REFERENCE_BUILDS.find(
    (candidate) => candidate.archetype === archetype
  );
  if (!build) throw new Error(`Morrow Pocket has no ${archetype} reference build.`);
  return build;
};

const establishedOpenBuilds = [
  established("burst"),
  established("continuous"),
  established("control"),
  established("hybrid"),
] as const;

const addCommands = (
  build: ReferenceBuildDefinition,
  roundIndex: number,
  commands: readonly ReturnType<typeof install>[]
): ReferenceBuildDefinition => ({
  ...build,
  rounds: build.rounds.map((buildRound, index) =>
    index === roundIndex
      ? { commands: [...buildRound.commands, ...commands], primeFraction: buildRound.primeFraction }
      : buildRound
  ),
});

const actTwoEstablished = (build: ReferenceBuildDefinition): ReferenceBuildDefinition => {
  if (build.archetype === "continuous") {
    return addCommands(build, 2, [
      install("washlock", "socket_b", "wet_contactor"),
      upgrade("washlock", "socket_b"),
    ]);
  }
  if (build.archetype === "control") {
    const furnace = addCommands(build, 2, [
      ...line("liquid_line", "lower_intake", "furnace"),
      install("furnace", "socket_a", "wet_contactor"),
    ]);
    const gallery = addCommands(furnace, 3, [
      ...line("liquid_line", "furnace", "gallery"),
      install("gallery", "socket_a", "wet_contactor"),
      upgrade("furnace", "socket_a"),
      upgrade("furnace", "socket_a"),
      upgrade("gallery", "socket_a"),
      upgrade("gallery", "socket_a"),
    ]);
    return addCommands(gallery, 4, [upgrade("gallery", "socket_a")]);
  }
  return build;
};

const frontload = (build: ReferenceBuildDefinition): ReferenceBuildDefinition => ({
  ...build,
  rounds: [
    round([...(build.rounds[0]?.commands ?? []), ...(build.rounds[1]?.commands ?? [])]),
    round(),
    ...build.rounds.slice(2),
  ],
});

const carbonCarrier: ReferenceBuildDefinition = {
  id: "carbon_carrier_beds",
  archetype: "carrier",
  rounds: [
    round([
      ...line("gas_line", "core", "furnace"),
      install("furnace", "socket_a", "thermal_coil"),
      install("furnace", "socket_b", "gas_agitator"),
      upgrade("furnace", "socket_a"),
      upgrade("furnace", "socket_a"),
      upgrade("furnace", "socket_b"),
      upgrade("furnace", "socket_b"),
    ]),
    round([
      GAS_CHARGE,
      ...line("gas_line", "furnace", "gallery"),
      install("gallery", "socket_a", "thermal_coil"),
      install("gallery", "socket_b", "gas_agitator"),
      upgrade("gallery", "socket_a"),
      upgrade("gallery", "socket_a"),
      upgrade("gallery", "socket_b"),
      ...line("gas_line", "gallery", "washlock"),
      install("washlock", "socket_a", "gas_agitator"),
    ]),
    round([
      GAS_CHARGE,
      ...line("gas_line", "core", "reservoir"),
      install("reservoir", "socket_a", "thermal_coil"),
      install("reservoir", "socket_b", "gas_agitator"),
    ]),
    round([
      GAS_CHARGE,
      upgrade("gallery", "socket_a"),
      upgrade("gallery", "socket_b"),
      upgrade("reservoir", "socket_a"),
      upgrade("reservoir", "socket_a"),
      upgrade("reservoir", "socket_b"),
      upgrade("reservoir", "socket_b"),
      upgrade("washlock", "socket_a"),
      upgrade("washlock", "socket_a"),
    ]),
    round([GAS_CHARGE]),
  ],
};

const nitrogenTrain: ReferenceBuildDefinition = {
  id: "nitrogen_oxide_train",
  archetype: "catalytic",
  rounds: [
    round([
      ...line("gas_line", "core", "furnace"),
      install("furnace", "socket_a", "thermal_coil"),
      install("furnace", "socket_b", "gas_agitator"),
      upgrade("furnace", "socket_a"),
      upgrade("furnace", "socket_a"),
      upgrade("furnace", "socket_b"),
      upgrade("furnace", "socket_b"),
    ]),
    round([
      GAS_CHARGE,
      ...line("gas_line", "furnace", "gallery"),
      install("gallery", "socket_a", "thermal_coil"),
      install("gallery", "socket_b", "gas_agitator"),
      upgrade("gallery", "socket_a"),
      upgrade("gallery", "socket_a"),
      upgrade("gallery", "socket_b"),
      upgrade("gallery", "socket_b"),
    ]),
    round([
      GAS_CHARGE,
      LIQUID_CHARGES[0]!,
      ...line("gas_line", "gallery", "washlock"),
      ...line("liquid_line", "core", "washlock"),
      install("washlock", "socket_a", "wet_contactor"),
    ]),
    round([
      GAS_CHARGE,
      upgrade("furnace", "socket_b"),
      upgrade("gallery", "socket_b"),
      upgrade("washlock", "socket_a"),
    ]),
    round([GAS_CHARGE]),
  ],
};

const nickelShuttle: ReferenceBuildDefinition = {
  id: "nickel_carbonyl_shuttle",
  archetype: "carrier",
  rounds: [
    round([
      ...line("gas_line", "core", "lower_intake"),
      install("lower_intake", "socket_a", "gas_agitator"),
      upgrade("lower_intake", "socket_a"),
      upgrade("lower_intake", "socket_a"),
      ...line("gas_line", "lower_intake", "gallery"),
      install("gallery", "socket_a", "gas_agitator"),
      upgrade("gallery", "socket_a"),
      upgrade("gallery", "socket_a"),
    ]),
    round([
      GAS_CHARGE,
      ...line("gas_line", "gallery", "washlock"),
      install("washlock", "socket_a", "gas_agitator"),
      upgrade("washlock", "socket_a"),
      upgrade("washlock", "socket_a"),
    ]),
    round([
      GAS_CHARGE,
      ...line("gas_line", "washlock", "furnace"),
      install("furnace", "socket_a", "thermal_coil"),
      install("furnace", "socket_b", "gas_agitator"),
      upgrade("furnace", "socket_a"),
      upgrade("furnace", "socket_a"),
      upgrade("furnace", "socket_b"),
      upgrade("furnace", "socket_b"),
    ]),
    round([
      GAS_CHARGE,
      ...line("gas_line", "core", "reservoir"),
      install("reservoir", "socket_a", "thermal_coil"),
      install("reservoir", "socket_b", "gas_agitator"),
      upgrade("reservoir", "socket_a"),
      upgrade("reservoir", "socket_b"),
    ]),
    round([GAS_CHARGE]),
  ],
};

const junctionControl: ReferenceBuildDefinition = {
  id: "caustic_drag_floor",
  archetype: "control",
  rounds: [
    round([
      install("washlock", "socket_a", "membrane_cell"),
      ...line("liquid_line", "core", "washlock"),
      ...line("liquid_line", "washlock", "reservoir"),
      install("reservoir", "socket_a", "wet_contactor"),
    ]),
    round([
      ...LIQUID_CHARGES,
      ...line("liquid_line", "reservoir", "lower_intake"),
      install("lower_intake", "socket_a", "wet_contactor"),
      upgrade("washlock", "socket_a"),
      upgrade("reservoir", "socket_a"),
      upgrade("lower_intake", "socket_a"),
    ]),
    round([
      ...LIQUID_CHARGES,
      ...line("liquid_line", "lower_intake", "furnace"),
      install("furnace", "socket_a", "wet_contactor"),
      upgrade("washlock", "socket_a"),
      upgrade("reservoir", "socket_a"),
      upgrade("lower_intake", "socket_a"),
    ]),
    round([
      ...LIQUID_CHARGES,
      ...line("liquid_line", "furnace", "gallery"),
      install("gallery", "socket_a", "wet_contactor"),
      upgrade("furnace", "socket_a"),
      upgrade("furnace", "socket_a"),
      upgrade("gallery", "socket_a"),
      upgrade("gallery", "socket_a"),
    ]),
    round([...LIQUID_CHARGES, upgrade("gallery", "socket_a")]),
  ],
};

const fluorineRelease: ReferenceBuildDefinition = {
  id: "fluorine_release_train",
  archetype: "pressure",
  rounds: [
    round([
      ...line("gas_line", "reservoir", "gallery"),
      install("gallery", "socket_a", "fluorine_cell"),
      install("gallery", "socket_b", "gas_agitator"),
      upgrade("gallery", "socket_a"),
      upgrade("gallery", "socket_b"),
    ]),
    round([
      SPECIALTY_GAS_CHARGE,
      ...line("gas_line", "gallery", "washlock"),
      install("washlock", "socket_a", "thermal_coil"),
      install("washlock", "socket_b", "gas_agitator"),
    ]),
    round([SPECIALTY_GAS_CHARGE, upgrade("gallery", "socket_a"), upgrade("washlock", "socket_b")]),
    round([
      SPECIALTY_GAS_CHARGE,
      upgrade("washlock", "socket_a"),
      upgrade("washlock", "socket_a"),
      upgrade("washlock", "socket_b"),
    ]),
    round([SPECIALTY_GAS_CHARGE]),
  ],
};

export const ACT_TWO_REFERENCE_BUILDS = {
  kettleblack: [
    ...establishedOpenBuilds.map(actTwoEstablished).map(frontload),
    frontload(carbonCarrier),
  ],
  cordon_41: [
    ...establishedOpenBuilds.map(actTwoEstablished).map(frontload),
    frontload(nitrogenTrain),
  ],
  junction_l6: [
    ...establishedOpenBuilds
      .map((build) => (build.archetype === "control" ? junctionControl : actTwoEstablished(build)))
      .map(frontload),
    frontload(nickelShuttle),
  ],
  pell_cut: [
    ...establishedOpenBuilds.map(actTwoEstablished).map(frontload),
    frontload(fluorineRelease),
  ],
} as const satisfies Record<string, readonly ReferenceBuildDefinition[]>;
