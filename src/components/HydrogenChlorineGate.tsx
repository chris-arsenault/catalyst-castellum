import { Check } from "lucide-react";
import { useGameStore } from "../application/store";
import { hydrogenChlorineReactionStatus } from "../game/queries";

const formatAmount = (value: number): string =>
  value > 0 && value < 0.01 ? "<0.01 mol-eq" : `${value.toFixed(2)} mol-eq`;

const ReactionCondition = ({
  label,
  ready,
  value,
}: {
  label: string;
  ready: boolean;
  value: string;
}) => (
  <span className={ready ? "ready" : "charging"}>
    {ready && <Check size={11} />}
    <em>{label}</em>
    <strong>{value}</strong>
  </span>
);

export const HydrogenChlorineGate = () => {
  const room = useGameStore((state) => state.game.rooms.furnace);
  const statuses = (["upper", "lower"] as const).map((zone) =>
    hydrogenChlorineReactionStatus(room, zone)
  );
  const reactionReady = statuses.some((status) => status.ready);
  return (
    <section className="ignition-gate acid-reaction-gate" data-testid="cl2-reaction-gate">
      <header>
        <div>
          <span>CL-2 reaction gate</span>
          <p>Each gas layer combines equal H₂ and Cl₂ above its activation temperature.</p>
        </div>
        <strong className={reactionReady ? "ready" : "charging"}>
          {reactionReady ? "REACTION READY" : "CONDITIONING"}
        </strong>
      </header>
      <div className="ignition-layer-list">
        {statuses.map((status) => (
          <article key={status.zone} data-testid={`cl2-reaction-${status.zone}`}>
            <div className="ignition-layer-heading">
              <strong>{status.zone === "upper" ? "Upper layer" : "Lower layer"}</strong>
              <span>{status.ready ? "ACTIVE" : "BUILDING"}</span>
            </div>
            <div className="ignition-condition-grid">
              <ReactionCondition
                label="Heat"
                ready={status.temperatureReady}
                value={`${status.temperature.toFixed(0)}°C / >${status.activationTemperature}°C`}
              />
              <ReactionCondition
                label="H₂"
                ready={status.hydrogenReady}
                value={formatAmount(status.hydrogenAmount)}
              />
              <ReactionCondition
                label="Cl₂"
                ready={status.chlorineReady}
                value={formatAmount(status.chlorineAmount)}
              />
              <ReactionCondition
                label="Batch"
                ready={status.availableExtent > 0}
                value={formatAmount(status.availableExtent)}
              />
              <ReactionCondition
                label="Rate"
                ready={status.temperatureReady}
                value={`${Math.round(status.activation * 100)}% · ${status.reactionMultiplier.toFixed(
                  1
                )}×`}
              />
            </div>
          </article>
        ))}
      </div>
      <footer>
        CL-2 activation rises from {statuses[0]!.activationTemperature}°C to full rate at{" "}
        {statuses[0]!.fullActivationTemperature}°C. The Thermal Coil supplies heat, the Gas Agitator
        distributes both layers and multiplies kinetics, and each 1:1 batch creates two parts HCl.
      </footer>
    </section>
  );
};
