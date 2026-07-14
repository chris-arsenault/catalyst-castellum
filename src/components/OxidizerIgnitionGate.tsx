import { Check } from "lucide-react";
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import { hydrogenOxygenFlashStatus } from "../game/queries";
import type { RoomId } from "../game/types";
import type { LocaleFormatters } from "../localization/formatters";

const formatPercent = (value: number, formatters: LocaleFormatters): string => {
  if (value > 0 && value < 0.001) return `<${formatters.percent(0.001, 1)}`;
  return formatters.percent(value, value < 0.1 ? 1 : 0);
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

const IgnitionLayer = ({ status }: { status: ReturnType<typeof hydrogenOxygenFlashStatus> }) => {
  const { formatters, translator } = useGamePresentation();
  return (
    <article data-testid={`ox1-ignition-${status.zone}`}>
      <div className="ignition-layer-heading">
        <strong>
          {translator.text(status.zone === "upper" ? "ui.gate.upperLayer" : "ui.gate.lowerLayer")}
        </strong>
        <span>{translator.text(status.ready ? "ui.gate.ready" : "ui.gate.building")}</span>
      </div>
      <div className="ignition-condition-grid">
        <IgnitionCondition
          label={translator.text("ui.gate.mix")}
          ready={status.agitationReady}
          value={translator.text(
            status.agitationReady ? "ui.gate.running" : "ui.gate.agitatorRequired"
          )}
        />
        <IgnitionCondition
          label="H₂"
          ready={status.hydrogenReady}
          value={`${formatPercent(status.hydrogenFraction, formatters)} / ${formatPercent(status.minimumHydrogenFraction, formatters)}`}
        />
        <IgnitionCondition
          label="O₂"
          ready={status.oxygenReady}
          value={`${formatPercent(status.oxygenFraction, formatters)} / ${formatPercent(status.minimumOxygenFraction, formatters)}`}
        />
        <IgnitionCondition
          label={translator.text("ui.gate.batch")}
          ready={status.batchReady}
          value={`${formatters.number(status.availableExtent, 2)} / ${formatters.number(status.requiredExtent, 2)}`}
        />
        <IgnitionCondition
          label={translator.text("ui.gate.cycle")}
          ready={status.cooldownReady}
          value={
            status.cooldownReady
              ? translator.text("ui.gate.ready")
              : formatters.duration(Number(status.cooldownSeconds.toFixed(1)))
          }
        />
      </div>
    </article>
  );
};

export const OxidizerIgnitionGate = ({ roomId }: { roomId: RoomId }) => {
  const { translator } = useGamePresentation();
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
          <span>{translator.text("ui.gate.ox.title")}</span>
          <p>{translator.text("ui.gate.ox.detail")}</p>
        </div>
        <strong className={ignitionReady ? "ready" : "charging"}>
          {translator.text(ignitionReady ? "ui.gate.ox.ready" : "ui.gate.ox.charging")}
        </strong>
      </header>
      <div className="ignition-layer-list">
        {statuses.map((status) => (
          <IgnitionLayer key={status.zone} status={status} />
        ))}
      </div>
      <footer>{translator.text("ui.gate.ox.footer")}</footer>
    </section>
  );
};
