import { Check } from "lucide-react";
import { useGameStore } from "../application/store";
import { hydrogenOxygenFlashStatus } from "../game/queries";
import type { RoomId } from "../game/types";

const formatPercent = (value: number): string => {
  if (value > 0 && value < 0.001) return "<0.1%";
  if (value < 0.1) return `${(value * 100).toFixed(1)}%`;
  return `${Math.round(value * 100)}%`;
};

const IgnitionCondition = ({
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

export const OxidizerIgnitionGate = ({ roomId }: { roomId: RoomId }) => {
  const game = useGameStore((state) => state.game);
  const room = game.rooms[roomId];
  const statuses = (["upper", "lower"] as const).map((zone) =>
    hydrogenOxygenFlashStatus(room, zone)
  );
  const ignitionReady = statuses.some((status) => status.ready);
  return (
    <section className="ignition-gate" data-testid="ox1-ignition-gate">
      <header>
        <div>
          <span>OX-1 ignition gate</span>
          <p>
            Each gas layer qualifies through composition, combustible batch, agitation, and cycle
            cooldown.
          </p>
        </div>
        <strong className={ignitionReady ? "ready" : "charging"}>
          {ignitionReady ? "IGNITION READY" : "CHARGING"}
        </strong>
      </header>
      <div className="ignition-layer-list">
        {statuses.map((status) => (
          <article key={status.zone} data-testid={`ox1-ignition-${status.zone}`}>
            <div className="ignition-layer-heading">
              <strong>{status.zone === "upper" ? "Upper layer" : "Lower layer"}</strong>
              <span>{status.ready ? "READY" : "BUILDING"}</span>
            </div>
            <div className="ignition-condition-grid">
              <IgnitionCondition
                label="Mix"
                ready={status.agitationReady}
                value={status.agitationReady ? "Running" : "Agitator required"}
              />
              <IgnitionCondition
                label="H₂"
                ready={status.hydrogenReady}
                value={`${formatPercent(status.hydrogenFraction)} / ${formatPercent(
                  status.minimumHydrogenFraction
                )}`}
              />
              <IgnitionCondition
                label="O₂"
                ready={status.oxygenReady}
                value={`${formatPercent(status.oxygenFraction)} / ${formatPercent(
                  status.minimumOxygenFraction
                )}`}
              />
              <IgnitionCondition
                label="Batch"
                ready={status.batchReady}
                value={`${status.availableExtent.toFixed(2)} / ${status.requiredExtent.toFixed(2)}`}
              />
              <IgnitionCondition
                label="Cycle"
                ready={status.cooldownReady}
                value={status.cooldownReady ? "Ready" : `${status.cooldownSeconds.toFixed(1)}s`}
              />
            </div>
          </article>
        ))}
      </div>
      <footer>
        Static pressure follows retained inventory, gas temperature, and free volume.
        Pressure-driven passage outflow grows with the chamber-to-neighbor difference. Each flash
        adds a decaying shock pulse.
      </footer>
    </section>
  );
};
