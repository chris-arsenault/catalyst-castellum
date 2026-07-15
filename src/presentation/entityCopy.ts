import type {
  EnemyDefinition,
  EquipmentDefinition,
  GasBufferDefinition,
  GasSourceDefinition,
  LiquidBufferDefinition,
  LiquidSourceDefinition,
  ProcessDefinition,
  ReactionDefinition,
  RoomDefinition,
  SpeciesDefinition,
  ConnectionId,
} from "../game/types";
import type { Translator } from "../localization/translator";
import { DEFAULT_TRANSLATOR } from "../localization/translator";
import type { LocaleKey } from "../localization/types";
import { instance, type MapCarrier } from "../game/world/instances";

const localized = (translator: Translator, key: string): string =>
  translator.text(key as LocaleKey, {} as never);

const hasLocalized = (translator: Translator, key: string): boolean => {
  try {
    return typeof translator.text(key as LocaleKey, {} as never) === "string";
  } catch {
    return false;
  }
};

export interface NamedEntityCopy {
  name: string;
}

export interface DescribedEntityCopy extends NamedEntityCopy {
  description: string;
}

export const roomCopy = (
  definition: RoomDefinition,
  translator: Translator = DEFAULT_TRANSLATOR
): DescribedEntityCopy => {
  if (hasLocalized(translator, `entities.rooms.${definition.id}.name`)) {
    return {
      name: localized(translator, `entities.rooms.${definition.id}.name`),
      description: localized(translator, `entities.rooms.${definition.id}.description`),
    };
  }
  // Grafted rooms have no authored copy; name them by their code (e.g. "POD-1").
  return {
    name: translator.text(
      "entities.rooms.generic.name" as LocaleKey,
      {
        code: definition.code,
      } as never
    ),
    description: translator.text(
      "entities.rooms.generic.description" as LocaleKey,
      {
        code: definition.code,
      } as never
    ),
  };
};

export const equipmentCopy = (
  definition: EquipmentDefinition,
  translator: Translator = DEFAULT_TRANSLATOR
): DescribedEntityCopy => ({
  name: localized(translator, `entities.equipment.${definition.id}.name`),
  description: localized(translator, `entities.equipment.${definition.id}.description`),
});

export const enemyCopy = (
  definition: EnemyDefinition,
  translator: Translator = DEFAULT_TRANSLATOR
): DescribedEntityCopy => ({
  name: localized(translator, `entities.enemies.${definition.type}.name`),
  description: localized(translator, `entities.enemies.${definition.type}.description`),
});

export const speciesCopy = (
  definition: SpeciesDefinition,
  translator: Translator = DEFAULT_TRANSLATOR
): NamedEntityCopy => ({
  name: localized(translator, `entities.species.${definition.id}.name`),
});

export const reactionCopy = (
  definition: ReactionDefinition,
  translator: Translator = DEFAULT_TRANSLATOR
): NamedEntityCopy => ({
  name: localized(translator, `entities.reactions.${definition.id}.name`),
});

export const processCopy = (
  definition: ProcessDefinition,
  translator: Translator = DEFAULT_TRANSLATOR
): DescribedEntityCopy => ({
  name: localized(translator, `entities.processes.${definition.id}.name`),
  description: localized(translator, `entities.processes.${definition.id}.description`),
});

export const sourceCopy = (
  definition: GasSourceDefinition | LiquidSourceDefinition,
  translator: Translator = DEFAULT_TRANSLATOR
): NamedEntityCopy => ({
  name: localized(translator, `entities.sources.${definition.id}.name`),
});

export const bufferCopy = (
  definition: GasBufferDefinition | LiquidBufferDefinition,
  translator: Translator = DEFAULT_TRANSLATOR
): NamedEntityCopy => ({
  name: localized(translator, `entities.buffers.${definition.id}.name`),
});

export const transportCopy = (
  carrier: MapCarrier,
  connectionId: ConnectionId,
  translator: Translator = DEFAULT_TRANSLATOR
): DescribedEntityCopy => {
  if (hasLocalized(translator, `entities.transport.${connectionId}.name`)) {
    return {
      name: localized(translator, `entities.transport.${connectionId}.name`),
      description: localized(translator, `entities.transport.${connectionId}.description`),
    };
  }
  // Player-built lines have no authored copy; name them from their room pair.
  const connection = instance(carrier.map.connections, connectionId, "connection definition");
  const keyRoot = connection.kind === "liquid_line" ? "generic.liquid" : "generic.gas";
  const parameters = {
    from: instance(carrier.map.rooms, connection.rooms[0], "room definition").code,
    to: instance(carrier.map.rooms, connection.rooms[1], "room definition").code,
  };
  return {
    name: translator.text(`entities.transport.${keyRoot}.name` as LocaleKey, parameters as never),
    description: translator.text(
      `entities.transport.${keyRoot}.description` as LocaleKey,
      parameters as never
    ),
  };
};
