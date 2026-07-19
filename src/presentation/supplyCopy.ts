import type { GameDefinition } from "../game/definitionTypes";
import type { GameQueries } from "../game/queries";
import type { GameState, SiteSupplyDefinition } from "../game/types";
import type { LocaleFormatters } from "../localization/formatters";
import type { Translator } from "../localization/translator";
import { sourceCopy } from "./entityCopy";

export interface SupplyCardCopy {
  id: string;
  code: string;
  phase: SiteSupplyDefinition["phase"];
  name: string;
  formula: string;
  inventoryLabel: string;
  accent: string;
  amount: number;
  capacity: number;
  available: boolean;
  hostRoomId: string;
  replenishmentKind: SiteSupplyDefinition["replenishment"]["kind"];
  chargeAmount: number;
  chargeCost: number;
}

const total = (contents: object): number =>
  Object.values(contents).reduce<number>((sum, amount) => sum + Number(amount ?? 0), 0);

export const supplyFormula = (definition: GameDefinition, supply: SiteSupplyDefinition): string =>
  Object.entries(supply.replenishment.contents)
    .filter(([, amount]) => (amount ?? 0) > 0)
    .map(([speciesId]) => definition.species[speciesId as keyof typeof definition.species].formula)
    .join(" + ");

const inventoryFor = (game: GameState, supply: SiteSupplyDefinition): object => {
  if (supply.phase === "gas") return game.gasSources[supply.id]?.gas ?? {};
  return game.liquidSources[supply.id]?.liquid ?? {};
};

const inventoryLabel = (
  definition: GameDefinition,
  inventory: object,
  translator: Translator,
  formatters: LocaleFormatters
): string => {
  const entries = Object.entries(inventory)
    .filter(([, amount]) => Number(amount) >= 0.005)
    .sort((left, right) => Number(right[1]) - Number(left[1]));
  if (entries.length === 0) return translator.text("ui.supplies.empty");
  return entries
    .map(
      ([speciesId, amount]) =>
        `${definition.species[speciesId as keyof typeof definition.species].formula} ${formatters.number(Number(amount), 1)}`
    )
    .join(" · ");
};

export const createSupplyPresentation =
  (
    definition: GameDefinition,
    queries: GameQueries,
    translator: Translator,
    formatters: LocaleFormatters
  ) =>
  (game: GameState): readonly SupplyCardCopy[] =>
    queries.supplyDefinitionsFor(game).map((supply) => {
      const inventory = inventoryFor(game, supply);
      const utilityNode = game.map.utilityNodes[supply.id];
      if (!utilityNode) throw new Error(`Supply ${supply.id} has no physical utility node.`);
      return {
        id: supply.id,
        code: supply.code,
        phase: supply.phase,
        name: sourceCopy(supply, translator).name,
        formula: supplyFormula(definition, supply),
        inventoryLabel: inventoryLabel(definition, inventory, translator, formatters),
        accent: supply.accent,
        amount: total(inventory),
        capacity: supply.capacity,
        available: queries.supplyAvailable(game, supply.id),
        hostRoomId: utilityNode.hostRoomId,
        replenishmentKind: supply.replenishment.kind,
        chargeAmount: total(supply.replenishment.contents),
        chargeCost: supply.replenishment.kind === "matter" ? supply.replenishment.cost : 0,
      };
    });
