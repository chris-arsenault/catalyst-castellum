import type { ProcessEncounterState, ProcessSimulationDefinition } from "../encounter/processTypes";
import type {
  CommandDecision,
  CommandRejectionCode,
  GameCommand,
  SiteSupplyDefinition,
} from "../types";

type ChargeCommand = Extract<GameCommand, { type: "charge_gas_source" | "charge_liquid_source" }>;

type DecisionValues = Partial<Pick<CommandDecision, "amount" | "cost">>;

const reject = (code: CommandRejectionCode, values: DecisionValues = {}): CommandDecision => ({
  allowed: false,
  code,
  parameters: values,
  amount: values.amount ?? 0,
  cost: values.cost ?? 0,
  refund: 0,
});

const allow = (amount: number, cost: number): CommandDecision => ({
  allowed: true,
  code: null,
  parameters: {},
  amount,
  cost,
  refund: 0,
});

type MatterSupply = SiteSupplyDefinition & {
  replenishment: Extract<SiteSupplyDefinition["replenishment"], { kind: "matter" }>;
};

const phaseFor = (command: ChargeCommand): SiteSupplyDefinition["phase"] =>
  command.type === "charge_gas_source" ? "gas" : "liquid";

const inventoryFor = (
  state: ProcessEncounterState,
  sourceId: string,
  phase: SiteSupplyDefinition["phase"]
): object | null =>
  phase === "gas"
    ? (state.process.gasSources[sourceId]?.gas ?? null)
    : (state.process.liquidSources[sourceId]?.liquid ?? null);

const matterSupplyFor = (
  sourceId: string,
  phase: SiteSupplyDefinition["phase"],
  gameDefinition: ProcessSimulationDefinition
): MatterSupply | null => {
  const supply = gameDefinition.supplies.find((candidate) => candidate.id === sourceId);
  if (supply?.phase !== phase) return null;
  if (supply.replenishment.kind !== "matter") return null;
  return supply as MatterSupply;
};

export const evaluateSupplyCharge = (
  state: ProcessEncounterState,
  command: ChargeCommand,
  gameDefinition: ProcessSimulationDefinition
): CommandDecision => {
  if (state.phase !== "build") return reject("invalid_phase");
  if (!gameDefinition.availableSupplyIds.includes(command.sourceId)) {
    return reject("unavailable");
  }
  const phase = phaseFor(command);
  const supply = matterSupplyFor(command.sourceId, phase, gameDefinition);
  if (!supply) return reject("unavailable");
  const inventory = inventoryFor(state, command.sourceId, phase);
  if (!inventory) return reject("unavailable");
  const current = Object.values(inventory).reduce((total, amount) => total + amount, 0);
  const ratedAmount = Object.values(supply.replenishment.contents).reduce(
    (total, amount) => total + (amount ?? 0),
    0
  );
  const amount = Math.min(ratedAmount, supply.capacity - current);
  const cost = Math.ceil(supply.replenishment.cost * (amount / ratedAmount));
  if (amount <= 0.01) return reject("capacity", { amount, cost });
  if (state.matter < cost) return reject("insufficient_matter", { amount, cost });
  return allow(amount, cost);
};
