import { Plus, PackageOpen } from "lucide-react";
import { useCallback } from "react";
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import type { SupplyCardCopy } from "../presentation/supplyCopy";

const Supply = ({ supply }: { supply: SupplyCardCopy }) => {
  const { commandCopy, formatters, selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const command =
    supply.phase === "gas"
      ? ({ type: "charge_gas_source", sourceId: supply.id } as const)
      : ({ type: "charge_liquid_source", sourceId: supply.id } as const);
  const decision = selectors.commandDecision(game, command);
  const charge = useCallback(() => {
    if (supply.phase === "gas") {
      dispatch({ type: "charge_gas_source", sourceId: supply.id });
      return;
    }
    dispatch({ type: "charge_liquid_source", sourceId: supply.id });
  }, [dispatch, supply.id, supply.phase]);
  const unlimited = supply.replenishmentKind === "unlimited";
  const fill = unlimited ? 100 : Math.min(100, (supply.amount / supply.capacity) * 100);
  return (
    <article className="supply-card" style={{ "--supply": supply.accent }}>
      <span className="supply-formula">{supply.formula}</span>
      <span className="supply-name">{supply.name}</span>
      <span className="supply-fill" aria-hidden="true">
        <i style={{ "--supply-fill": `${fill}%` }} />
      </span>
      <strong data-testid={`source-${supply.id}`}>
        {unlimited ? "∞" : formatters.number(supply.amount, 0)}
      </strong>
      {!unlimited && (
        <button
          type="button"
          disabled={!decision.allowed}
          title={
            commandCopy(decision) ??
            translator.text("ui.supplies.restockFormula", { formula: supply.formula })
          }
          aria-label={translator.text("ui.supplies.restock", { name: supply.name })}
          onClick={charge}
        >
          <Plus size={13} />
        </button>
      )}
      <span className="supply-tooltip" role="tooltip">
        <b>{supply.name}</b>
        {supply.inventoryLabel}
        <small>
          {unlimited
            ? translator.text("ui.supplies.detailInfinite")
            : translator.text("ui.supplies.detail", {
                amount: formatters.measurement(supply.amount, "mol-eq", 1),
                capacity: formatters.measurement(supply.capacity, "mol-eq", 1),
                charge: formatters.number(supply.chargeAmount, 0),
                cost: formatters.number(supply.chargeCost, 0),
              })}
        </small>
      </span>
    </article>
  );
};

export const FeedstockStrip = () => {
  const { supplies, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  return (
    <section
      className="supply-dock"
      aria-label={translator.text("ui.supplies.title")}
      data-testid="supply-dock"
    >
      <span className="supply-dock-label">
        <PackageOpen size={14} /> {translator.text("ui.supplies.title")}
      </span>
      {supplies(game)
        .filter((supply) => supply.available)
        .map((supply) => (
          <Supply key={supply.id} supply={supply} />
        ))}
    </section>
  );
};
