import { Check } from "lucide-react";
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import { hydrogenChlorineReactionStatus } from "../game/queries";
import type { RoomId } from "../game/types";
import type { LocaleFormatters } from "../localization/formatters";
import { roomState } from "../game/world/instances";

const formatAmount = (value: number, formatters: LocaleFormatters): string =>
  value > 0 && value < 0.01
    ? `<${formatters.measurement(0.01, "mol-eq", 2)}`
    : formatters.measurement(value, "mol-eq", 2);

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

export const HydrogenChlorineGate = ({ roomId }: { roomId: RoomId }) => {
  const { formatters, translator } = useGamePresentation();
  const room = useGameStore((state) => roomState(state.game, roomId));
  const statuses = (["upper", "lower"] as const).map((zone) =>
    hydrogenChlorineReactionStatus(room, zone)
  );
  const reactionReady = statuses.some((status) => status.ready);
  return (
    <section className="ignition-gate acid-reaction-gate" data-testid="cl2-reaction-gate">
      <header>
        <div>
          <span>{translator.text("ui.gate.acid.title")}</span>
          <p>{translator.text("ui.gate.acid.detail")}</p>
        </div>
        <strong className={reactionReady ? "ready" : "charging"}>
          {translator.text(reactionReady ? "ui.gate.acid.ready" : "ui.gate.acid.charging")}
        </strong>
      </header>
      <div className="ignition-layer-list">
        {statuses.map((status) => (
          <article key={status.zone} data-testid={`cl2-reaction-${status.zone}`}>
            <div className="ignition-layer-heading">
              <strong>
                {translator.text(
                  status.zone === "upper" ? "ui.gate.upperLayer" : "ui.gate.lowerLayer"
                )}
              </strong>
              <span>
                {translator.text(status.ready ? "ui.gate.acid.active" : "ui.gate.building")}
              </span>
            </div>
            <div className="ignition-condition-grid">
              <ReactionCondition
                label={translator.text("ui.gate.heat")}
                ready={status.temperatureReady}
                value={`${formatters.number(status.temperature, 0)}°C / >${formatters.number(status.activationTemperature, 0)}°C`}
              />
              <ReactionCondition
                label="H₂"
                ready={status.hydrogenReady}
                value={formatAmount(status.hydrogenAmount, formatters)}
              />
              <ReactionCondition
                label="Cl₂"
                ready={status.chlorineReady}
                value={formatAmount(status.chlorineAmount, formatters)}
              />
              <ReactionCondition
                label={translator.text("ui.gate.batch")}
                ready={status.availableExtent > 0}
                value={formatAmount(status.availableExtent, formatters)}
              />
              <ReactionCondition
                label={translator.text("ui.gate.rate")}
                ready={status.temperatureReady}
                value={`${formatters.percent(status.activation, 0)} · ${formatters.number(status.reactionMultiplier, 1)}×`}
              />
            </div>
          </article>
        ))}
      </div>
      <footer>
        {translator.text("ui.gate.acid.footer", {
          minimum: formatters.number(statuses[0]!.activationTemperature, 0),
          maximum: formatters.number(statuses[0]!.fullActivationTemperature, 0),
        })}
      </footer>
    </section>
  );
};
