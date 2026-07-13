import { Plus, PackageOpen } from "lucide-react";
import { useCallback } from "react";
import { GAS_SOURCES, LIQUID_SOURCES, SPECIES_DEFINITIONS } from "../game/config";
import { gasAmountTotal, liquidAmountTotal } from "../game/queries";
import {
  GAS_SOURCE_IDS,
  GAS_TYPES,
  LIQUID_SOURCE_IDS,
  type GasAmounts,
  type GasSourceId,
  type LiquidSourceId,
} from "../game/types";
import { commandDecision as evaluateCommand } from "../presentation/selectors";
import { useGameStore } from "../application/store";

const gasComposition = (gas: GasAmounts): string =>
  GAS_TYPES.filter((species) => gas[species] >= 0.005)
    .sort((left, right) => gas[right] - gas[left])
    .map((species) => `${SPECIES_DEFINITIONS[species].formula} ${gas[species].toFixed(1)}`)
    .join(" · ") || "Empty";

interface SupplyProps {
  accent: string;
  amount: number;
  capacity: number;
  chargeAmount: number;
  chargeCost: number;
  detail: string;
  formula: string;
  name: string;
  sourceId: GasSourceId | LiquidSourceId;
  sourceKind: "gas" | "liquid";
}

const Supply = (props: SupplyProps) => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const command =
    props.sourceKind === "gas"
      ? ({ type: "charge_gas_source", sourceId: props.sourceId as GasSourceId } as const)
      : ({ type: "charge_liquid_source", sourceId: props.sourceId as LiquidSourceId } as const);
  const decision = evaluateCommand(game, command);
  const charge = useCallback(() => {
    if (props.sourceKind === "gas") {
      dispatch({ type: "charge_gas_source", sourceId: props.sourceId as GasSourceId });
      return;
    }
    dispatch({ type: "charge_liquid_source", sourceId: props.sourceId as LiquidSourceId });
  }, [dispatch, props.sourceId, props.sourceKind]);
  const fill = Math.min(100, (props.amount / props.capacity) * 100);
  return (
    <article className="supply-card" style={{ "--supply": props.accent }}>
      <span className="supply-formula">{props.formula}</span>
      <span className="supply-name">{props.name}</span>
      <span className="supply-fill" aria-hidden="true">
        <i style={{ "--supply-fill": `${fill}%` }} />
      </span>
      <strong data-testid={`source-${props.sourceId}`}>{props.amount.toFixed(0)}</strong>
      <button
        type="button"
        disabled={!decision.allowed}
        title={decision.reason ?? `Restock ${props.formula}`}
        aria-label={`Restock ${props.name}`}
        onClick={charge}
      >
        <Plus size={13} />
      </button>
      <span className="supply-tooltip" role="tooltip">
        <b>{props.name}</b>
        {props.detail}
        <small>
          {props.amount.toFixed(1)} / {props.capacity} mol-eq · +{props.chargeAmount.toFixed(0)} for{" "}
          {props.chargeCost} matter
        </small>
      </span>
    </article>
  );
};

const GasSupply = ({ sourceId }: { sourceId: GasSourceId }) => {
  const game = useGameStore((state) => state.game);
  const source = GAS_SOURCES[sourceId];
  const gas = game.gasSources[sourceId].gas;
  return (
    <Supply
      accent={source.accent}
      amount={gasAmountTotal(gas)}
      capacity={source.capacity}
      chargeAmount={Object.values(source.chargeGas).reduce(
        (total, amount) => total + (amount ?? 0),
        0
      )}
      chargeCost={source.chargeCost}
      detail={gasComposition(gas)}
      formula={source.formula}
      name={source.name}
      sourceId={sourceId}
      sourceKind="gas"
    />
  );
};

const LiquidSupply = ({ sourceId }: { sourceId: LiquidSourceId }) => {
  const game = useGameStore((state) => state.game);
  const source = LIQUID_SOURCES[sourceId];
  const amount = liquidAmountTotal(game.liquidSources[sourceId].liquid);
  return (
    <Supply
      accent={source.accent}
      amount={amount}
      capacity={source.capacity}
      chargeAmount={source.chargeAmount}
      chargeCost={source.chargeCost}
      detail={`${source.formula} ${amount.toFixed(1)}`}
      formula={source.formula}
      name={source.name}
      sourceId={sourceId}
      sourceKind="liquid"
    />
  );
};

export const FeedstockStrip = () => {
  const game = useGameStore((state) => state.game);
  return (
    <section className="supply-dock" aria-label="Supplies" data-testid="supply-dock">
      <span className="supply-dock-label">
        <PackageOpen size={14} /> Supplies
      </span>
      {GAS_SOURCE_IDS.filter((sourceId) => game.availability.gasSources.includes(sourceId)).map(
        (sourceId) => (
          <GasSupply key={sourceId} sourceId={sourceId} />
        )
      )}
      {LIQUID_SOURCE_IDS.filter((sourceId) =>
        game.availability.liquidSources.includes(sourceId)
      ).map((sourceId) => (
        <LiquidSupply key={sourceId} sourceId={sourceId} />
      ))}
    </section>
  );
};
