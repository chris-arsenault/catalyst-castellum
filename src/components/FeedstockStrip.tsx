import { useCallback } from "react";
import { Atom, Plus, Recycle, Wind } from "lucide-react";
import {
  GAS_JUNCTIONS,
  GAS_LABELS,
  GAS_SOURCES,
  LIQUID_LABELS,
  LIQUID_SOURCES,
  SPECIES_DEFINITIONS,
} from "../game/config";
import { gasAmountTotal, liquidAmountTotal } from "../game/simulation";
import { useGameStore } from "../game/store";
import {
  GAS_SOURCE_IDS,
  GAS_TYPES,
  LIQUID_SOURCE_IDS,
  LIQUID_TYPES,
  type GasAmounts,
  type GasSourceId,
  type LiquidSourceId,
} from "../game/types";

const MIN_VISIBLE_AMOUNT = 0.005;

const gasComposition = (gas: GasAmounts): string => {
  const entries = GAS_TYPES.filter((species) => gas[species] >= MIN_VISIBLE_AMOUNT);
  if (entries.length === 0) return "empty";
  return entries
    .sort((left, right) => gas[right] - gas[left])
    .map((species) => `${SPECIES_DEFINITIONS[species].formula} ${gas[species].toFixed(1)}`)
    .join(" · ");
};

interface InventoryCardProps {
  accent: string;
  amount: number;
  canCharge: boolean;
  capacity: number;
  chargeAmount: number;
  chargeCost: number;
  detail: string;
  detailTestId: string;
  formula: string;
  name: string;
  sourceId: GasSourceId | LiquidSourceId;
  sourceKind: "gas" | "liquid";
}

const InventoryCard = (props: InventoryCardProps) => {
  const dispatch = useGameStore((state) => state.dispatch);
  const handleCharge = useCallback(() => {
    if (props.sourceKind === "gas") {
      dispatch({ type: "charge_gas_source", sourceId: props.sourceId as GasSourceId });
      return;
    }
    dispatch({ type: "charge_liquid_source", sourceId: props.sourceId as LiquidSourceId });
  }, [dispatch, props.sourceId, props.sourceKind]);
  return (
    <div className="feedstock-card" style={{ "--feedstock": props.accent }}>
      <span>
        {props.formula} · {props.name}
      </span>
      <strong data-testid={`source-${props.sourceId}`}>
        {props.amount.toFixed(1)} / {props.capacity} <small>mol-eq</small>
      </strong>
      <small data-testid={props.detailTestId}>{props.detail}</small>
      <button
        type="button"
        disabled={!props.canCharge || props.amount >= props.capacity}
        onClick={handleCharge}
      >
        <Plus size={12} /> {props.chargeAmount.toFixed(0)} · {props.chargeCost}m
      </button>
    </div>
  );
};

const GasSourceCard = ({ sourceId }: { sourceId: GasSourceId }) => {
  const game = useGameStore((state) => state.game);
  const source = GAS_SOURCES[sourceId];
  const gas = game.gasSources[sourceId].gas;
  const amount = gasAmountTotal(gas);
  const chargeAmount = Object.values(source.chargeGas).reduce(
    (total, entry) => total + (entry ?? 0),
    0
  );
  const detailTestId =
    sourceId === "starter_gas_header"
      ? "starter-gas-composition"
      : `source-${sourceId}-composition`;
  return (
    <>
      <InventoryCard
        accent={source.accent}
        amount={amount}
        canCharge={game.phase === "build" && game.matter >= source.chargeCost}
        capacity={source.capacity}
        chargeAmount={chargeAmount}
        chargeCost={source.chargeCost}
        detail={gasComposition(gas)}
        detailTestId={detailTestId}
        formula={source.formula}
        name={source.name}
        sourceId={sourceId}
        sourceKind="gas"
      />
      {sourceId === "starter_gas_header" && (
        <div className="feedstock-card" style={{ "--feedstock": "#d0855b" }}>
          <span>CORE · Mixed gas service junction</span>
          <strong data-testid="core-gas-junction">
            {gasAmountTotal(game.gasJunctions.core.gas).toFixed(1)} / {GAS_JUNCTIONS.core.capacity}{" "}
            <small>mol-eq</small>
          </strong>
          <small data-testid="core-gas-junction-composition">
            {gasComposition(game.gasJunctions.core.gas)} · feeds Core–R-02 gas duct
          </small>
        </div>
      )}
    </>
  );
};

const LiquidSourceCard = ({ sourceId }: { sourceId: LiquidSourceId }) => {
  const game = useGameStore((state) => state.game);
  const source = LIQUID_SOURCES[sourceId];
  const amount = liquidAmountTotal(game.liquidSources[sourceId].liquid);
  return (
    <InventoryCard
      accent={source.accent}
      amount={amount}
      canCharge={game.phase === "build" && game.matter >= source.chargeCost}
      capacity={source.capacity}
      chargeAmount={source.chargeAmount}
      chargeCost={source.chargeCost}
      detail={`${source.formula} ${amount.toFixed(1)}`}
      detailTestId={`source-${sourceId}-composition`}
      formula={source.formula}
      name={source.name}
      sourceId={sourceId}
      sourceKind="liquid"
    />
  );
};

export const FeedstockStrip = () => {
  const game = useGameStore((state) => state.game);
  const ventTotal = gasAmountTotal(game.gasVent);
  const drainTotal = liquidAmountTotal(game.liquidDrain);
  const ventDominant = GAS_TYPES.reduce((best, type) =>
    game.gasVent[type] > game.gasVent[best] ? type : best
  );
  const drainDominant = LIQUID_TYPES.reduce((best, type) =>
    game.liquidDrain[type] > game.liquidDrain[best] ? type : best
  );
  return (
    <section className="feedstock-strip" aria-label="Core material inventories">
      <div className="feedstock-heading">
        <span>Core material manifold</span>
        <small>
          <Atom size={12} /> EXOTIC TRANSMUTATION · elemental conservation waived
        </small>
      </div>
      {GAS_SOURCE_IDS.filter((sourceId) => game.availability.gasSources.includes(sourceId)).map(
        (sourceId) => (
          <GasSourceCard key={sourceId} sourceId={sourceId} />
        )
      )}
      {LIQUID_SOURCE_IDS.filter((sourceId) =>
        game.availability.liquidSources.includes(sourceId)
      ).map((sourceId) => (
        <LiquidSourceCard key={sourceId} sourceId={sourceId} />
      ))}
      <div className="feedstock-card recovery-card" style={{ "--feedstock": "#69c5cd" }}>
        <span>
          <Wind size={12} /> Gas vent inventory
        </span>
        <strong data-testid="gas-vent-total">{ventTotal.toFixed(1)} mol-eq</strong>
        <small>
          {ventTotal > 0.01 ? `${GAS_LABELS[ventDominant]} dominant` : "isolated · empty"}
        </small>
      </div>
      <div className="feedstock-card recovery-card" style={{ "--feedstock": "#548ada" }}>
        <span>
          <Recycle size={12} /> Liquid recovery
        </span>
        <strong data-testid="liquid-drain-total">{drainTotal.toFixed(1)} mol-eq</strong>
        <small>
          {drainTotal > 0.01 ? `${LIQUID_LABELS[drainDominant]} dominant` : "isolated · empty"}
        </small>
      </div>
    </section>
  );
};
