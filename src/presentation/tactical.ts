import {
  createEncounterRuntime,
  effectiveTowerStats,
  resolveTowerPlacement,
  towerCoversPoint,
  type EncounterContext,
  type EncounterState,
  type EncounterTower,
} from "../game/tactical";
import type { TowerChassisId, TowerMountFace } from "../game/types";
import { createTranslator, type Translator } from "../localization/translator";
import { createLocaleFormatters } from "../localization/formatters";
import type { LocaleBundle } from "../localization/types";
import { createCommandCopy } from "./commandCopy";
import { preferredOrientationForMount, chassisKey, chassisProcessKey, roleKey } from "./towerCopy";
import { createSurfaceTowerPlanning } from "./towerPlanning";

const createTacticalTowers = (context: EncounterContext, translator: Translator) => {
  const definition = (id: TowerChassisId) => {
    const tower = context.combat.towers[id];
    if (!tower) throw new Error(`Unknown tactical tower ${id}`);
    return tower;
  };
  const defaultOrientationForMount = (id: TowerChassisId, face: TowerMountFace) =>
    preferredOrientationForMount(definition(id).orientations, face);
  return {
    definition,
    device: (id: TowerChassisId) =>
      context.combat.mechanics.kind === "catalyst"
        ? (context.combat.mechanics.devices[id] ?? null)
        : null,
    name: (id: TowerChassisId) => {
      if (context.combat.mechanics.kind !== "catalyst") return translator.text(chassisKey(id));
      const device = context.combat.mechanics.devices[id];
      if (device?.kind === "field") return translator.text("catalyst.field");
      if (device?.kind === "discharge") return translator.text("catalyst.discharge");
      if (device?.kind === "weapon" && device.chargePerHit > 0)
        return translator.text("catalyst.induction");
      return translator.text(
        definition(id).attack.strategy === "cone" ? "catalyst.cone" : "catalyst.precision"
      );
    },
    description: (id: TowerChassisId) => {
      if (context.combat.mechanics.kind !== "catalyst")
        return translator.text(chassisProcessKey(id));
      const device = context.combat.mechanics.devices[id];
      if (device?.kind === "field") return translator.text("catalyst.fieldRule");
      if (device?.kind === "discharge") return translator.text("catalyst.dischargeRule");
      return translator.text(
        device?.kind === "weapon" && device.chargePerHit > 0
          ? "catalyst.inductionRule"
          : "catalyst.weaponRule"
      );
    },
    role: (id: TowerChassisId) => translator.text(roleKey(definition(id).role)),
    stats: (tower: EncounterTower, state?: EncounterState) =>
      effectiveTowerStats(tower, context.combat, state),
    coversPoint: (
      state: EncounterState,
      tower: EncounterTower,
      point: Parameters<typeof towerCoversPoint>[2],
      layer: "ground" | "flying"
    ) => towerCoversPoint(state, tower, point, layer, context.combat),
    defaultOrientationForMount,
    defaultPlacement: (id: TowerChassisId) => {
      const mountFace = definition(id).mountFaces[0]!;
      return { chassisId: id, mountFace, orientation: defaultOrientationForMount(id, mountFace) };
    },
    packetDamage: (id: TowerChassisId) =>
      definition(id).attack.packets.reduce(
        (sum, packet) =>
          sum + Object.values(packet.channels).reduce((total, amount) => total + amount, 0),
        0
      ),
  };
};

export const createTacticalPresentation = (context: EncounterContext, locale: LocaleBundle) => {
  const translator = createTranslator(locale);
  const runtime = createEncounterRuntime(context);
  return {
    context,
    towers: createTacticalTowers(context, translator),
    translator,
    formatters: createLocaleFormatters(locale.locale),
    commandCopy: createCommandCopy(translator),
    evaluate: runtime.evaluate,
    towerPlanning: createSurfaceTowerPlanning({
      definition: { towers: context.combat.towers },
      evaluate: runtime.evaluate,
      encounterOf: (state: EncounterState) => state,
      resolvePlacement: (id, anchor, face, orientation) =>
        resolveTowerPlacement(id, anchor, face, orientation, context.combat),
    }),
    enemyDefinition: (id: EncounterState["enemies"][number]["type"]) => {
      const enemy = context.combat.enemies[id];
      if (!enemy) throw new Error(`Unknown tactical enemy ${id}`);
      return enemy;
    },
  };
};

export type TacticalPresentation = ReturnType<typeof createTacticalPresentation>;
