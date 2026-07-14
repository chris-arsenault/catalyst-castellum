import type { GameDefinition } from "../game/definition";
import {
  gasPartialRatio,
  installedEquipment,
  liquidMovementMultiplier,
  liquidStrength,
  pressureMovementMultiplier,
  roomHazards,
  type GameQueries,
} from "../game/queries";
import type { GasZone, RoomState } from "../game/types";
import { equipmentCopy as localizedEquipmentCopy } from "./entityCopy";
import { DEFAULT_GAME_DEFINITION } from "./defaultGame";
import { DEFAULT_TRANSLATOR, type Translator } from "../localization/translator";

export type HazardLabel = "CLEAR" | "LOW" | "HOSTILE" | "LETHAL";

export const hazardLabel = (hazard: number): HazardLabel => {
  if (hazard >= 65) return "LETHAL";
  if (hazard >= 32) return "HOSTILE";
  if (hazard >= 10) return "LOW";
  return "CLEAR";
};

const flashExposureEffect = (
  room: RoomState,
  zone: GasZone,
  label: string,
  definition: GameDefinition,
  queries: Pick<GameQueries, "gasPartialRatio">,
  translator: Translator
): string | null => {
  const behavior = definition.reactions.hydrogen_oxygen_combustion.behavior;
  if (behavior.kind !== "flash") throw new Error("Hydrogen flash reaction is misconfigured");
  if (
    queries.gasPartialRatio(room, "hydrogen", zone) < 0.005 ||
    queries.gasPartialRatio(room, "oxygen", zone) < behavior.minimumOxygenFraction
  )
    return null;
  const extent = Math.min(room.gas[zone].hydrogen / 2, room.gas[zone].oxygen);
  const charge = Math.min(1, extent / (behavior.ignitionExtent / 2));
  return translator.text("presentation.room.flash", {
    zone: label,
    percent: Math.round(charge * 100),
  });
};

const zoneEffects = (
  room: RoomState,
  zone: GasZone,
  definition: GameDefinition,
  queries: Pick<GameQueries, "gasPartialRatio">,
  translator: Translator
): string[] => {
  const effects: string[] = [];
  const label = translator.text(
    zone === "lower" ? "presentation.room.zone.lower" : "presentation.room.zone.upper"
  );
  const chlorine = queries.gasPartialRatio(room, "chlorine", zone);
  const hydrogenChloride = queries.gasPartialRatio(room, "hydrogen_chloride", zone);
  const hydrogen = queries.gasPartialRatio(room, "hydrogen", zone);
  const oxygen = queries.gasPartialRatio(room, "oxygen", zone);
  if (chlorine >= 0.006)
    effects.push(
      translator.text("presentation.room.chlorine", {
        zone: label,
        severity: chlorine >= 0.04 ? "severe" : "active",
      })
    );
  if (hydrogenChloride >= 0.009)
    effects.push(translator.text("presentation.room.hcl", { zone: label }));
  if (chlorine >= 0.01 && hydrogen >= 0.01)
    effects.push(translator.text("presentation.room.mixture", { zone: label }));
  const flash = flashExposureEffect(room, zone, label, definition, queries, translator);
  if (flash) effects.push(flash);
  if (oxygen < 0.13) effects.push(translator.text("presentation.room.oxygen", { zone: label }));
  if (room.gasTemperature[zone] >= 55)
    effects.push(
      translator.text("presentation.room.heat", {
        zone: label,
        temperature: Math.round(room.gasTemperature[zone]),
      })
    );
  return effects;
};

const liquidEffects = (
  room: RoomState,
  queries: Pick<GameQueries, "liquidStrength">,
  translator: Translator
): string[] => {
  const effects: string[] = [];
  if (queries.liquidStrength(room, "sodium_hydroxide") >= 4)
    effects.push(translator.text("presentation.room.naoh"));
  if (queries.liquidStrength(room, "hydrochloric_acid") >= 4)
    effects.push(translator.text("presentation.room.acid"));
  if (queries.liquidStrength(room, "sodium_hypochlorite") >= 7)
    effects.push(translator.text("presentation.room.hypochlorite"));
  return effects;
};

const movementEffects = (
  room: RoomState,
  queries: Pick<
    GameQueries,
    "liquidMovementMultiplier" | "pressureMovementMultiplier" | "roomHazards"
  >,
  translator: Translator
): string[] => {
  const effects: string[] = [];
  const liquidMovement = queries.liquidMovementMultiplier(room, false);
  const pressureMovement = queries.pressureMovementMultiplier(room);
  if (liquidMovement < 0.99)
    effects.push(
      translator.text("presentation.room.liquid_drag", {
        percent: Math.round((1 - liquidMovement) * 100),
      })
    );
  if (pressureMovement < 0.99)
    effects.push(
      translator.text("presentation.room.pressure_drag", {
        percent: Math.round((1 - pressureMovement) * 100),
      })
    );
  const pressureHazard = queries.roomHazards(room, true, true, "lower").pressure;
  if (pressureHazard > 0.01)
    effects.push(
      translator.text("presentation.room.pressure_hazard", { rate: pressureHazard.toFixed(1) })
    );
  if (room.pressurePulse > 1)
    effects.push(
      translator.text("presentation.room.pressure_pulse", {
        pressure: Math.round(room.pressurePulse),
      })
    );
  return effects;
};

export const roomEffects = (
  room: RoomState,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION,
  queries: GameQueries | null = null,
  translator: Translator = DEFAULT_TRANSLATOR
): string[] => {
  const q = queries ?? {
    gasPartialRatio,
    liquidStrength,
    liquidMovementMultiplier,
    pressureMovementMultiplier,
    roomHazards,
  };
  const effects = [
    ...zoneEffects(room, "lower", definition, q, translator),
    ...zoneEffects(room, "upper", definition, q, translator),
    ...liquidEffects(room, q, translator),
    ...movementEffects(room, q, translator),
  ];
  return effects.length > 0 ? effects : [translator.text("presentation.room.safe")];
};

export const equipmentFunctionalSummary = (
  room: RoomState,
  definition: GameDefinition = DEFAULT_GAME_DEFINITION,
  translator: Translator = DEFAULT_TRANSLATOR
): string => {
  const equipment = installedEquipment(room);
  if (equipment.length === 0) return translator.text("presentation.room.empty_equipment");
  return equipment
    .map(
      (instance) =>
        `${localizedEquipmentCopy(definition.equipment[instance.equipmentId], translator).name} ${instance.level}${instance.enabled ? "" : translator.text("presentation.room.equipment_off")}`
    )
    .join(" · ");
};

export const roomRingDescription = (
  roomId: RoomState["id"],
  definition: GameDefinition = DEFAULT_GAME_DEFINITION,
  translator: Translator = DEFAULT_TRANSLATOR
): string => {
  const room = definition.rooms[roomId];
  if (room.structure === "entry") return translator.text("presentation.room.entry");
  if (room.structure === "room") return translator.text("presentation.room.standard");
  return translator.text("presentation.room.core");
};
