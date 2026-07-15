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

const localized = (translator: Translator, key: string): string =>
  translator.text(key as LocaleKey, {} as never);

export interface NamedEntityCopy {
  name: string;
}

export interface DescribedEntityCopy extends NamedEntityCopy {
  description: string;
}

export const roomCopy = (
  definition: RoomDefinition,
  translator: Translator = DEFAULT_TRANSLATOR
): DescribedEntityCopy => ({
  name: localized(translator, `entities.rooms.${definition.id}.name`),
  description: localized(translator, `entities.rooms.${definition.id}.description`),
});

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
  connectionId: ConnectionId,
  translator: Translator = DEFAULT_TRANSLATOR
): DescribedEntityCopy => ({
  name: localized(translator, `entities.transport.${connectionId}.name`),
  description: localized(translator, `entities.transport.${connectionId}.description`),
});
