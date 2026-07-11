import { AlertTriangle, ArrowRight, CheckCircle2, FlaskConical, Radio, Timer } from "lucide-react";
import { SETTLE_DURATION, WAVES, WAVE_BRIEFS } from "../game/config";
import { useGameStore } from "../game/store";

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
};

const BuildBanner = () => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const wave = WAVES[game.cycle] ?? [];
  const brief = WAVE_BRIEFS[game.cycle];
  return (
    <section className="phase-banner build-banner" data-testid="phase-banner">
      <div className="phase-icon">
        <FlaskConical size={20} />
      </div>
      <div className="phase-copy">
        <span>Incoming profile · {wave.length} hostiles</span>
        <strong>{brief?.title}</strong>
        <p>{brief?.detail}</p>
      </div>
      <div className="phase-resource">
        <span>Fabricator</span>
        <strong>{game.buildPoints} pt</strong>
        <small>full salvage refund</small>
      </div>
      <button
        className="primary-action"
        type="button"
        data-testid="begin-prime"
        onClick={() => dispatch({ type: "start_prime" })}
      >
        Begin prime <ArrowRight size={17} />
      </button>
    </section>
  );
};

const PrimeBanner = () => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  return (
    <section className="phase-banner prime-banner" data-testid="phase-banner">
      <div className="phase-icon pulse">
        <Timer size={20} />
      </div>
      <div className="phase-copy">
        <span>Prime simulation live · {formatTime(game.phaseTime)}</span>
        <strong>Prepare the room states</strong>
        <p>
          Trigger installed modules now. There is no time limit; contents persist when the intake
          opens.
        </p>
      </div>
      <div className="prime-checks">
        <span className={game.phaseTime >= 2 ? "ready" : ""}>
          <CheckCircle2 size={14} /> Flow online
        </span>
        <span className={game.phaseTime >= 5 ? "ready" : ""}>
          <CheckCircle2 size={14} /> States stable
        </span>
      </div>
      <button
        className="primary-action danger-action"
        type="button"
        data-testid="start-assault"
        onClick={() => dispatch({ type: "start_assault" })}
      >
        Open intakes <ArrowRight size={17} />
      </button>
    </section>
  );
};

const AssaultBanner = () => {
  const game = useGameStore((state) => state.game);
  const wave = WAVES[game.cycle] ?? [];
  const queued = Math.max(0, wave.length - game.spawnCursor);
  return (
    <section className="phase-banner assault-banner" data-testid="phase-banner">
      <div className="phase-icon pulse danger-pulse">
        <Radio size={20} />
      </div>
      <div className="phase-copy">
        <span>Assault live · {formatTime(game.phaseTime)}</span>
        <strong>
          {game.enemies.length} inside · {queued} inbound
        </strong>
        <p>
          Watch occupancy and trigger chambers at peak exposure. Building is locked until settle.
        </p>
      </div>
      <div className="assault-stats">
        <div>
          <span>Neutralized</span>
          <strong>{game.stats.killed}</strong>
        </div>
        <div>
          <span>Breaches</span>
          <strong className={game.stats.breached > 0 ? "bad" : ""}>{game.stats.breached}</strong>
        </div>
        <div>
          <span>Hazard peak</span>
          <strong>{Math.round(game.stats.peakHazard)}</strong>
        </div>
      </div>
    </section>
  );
};

const SettleBanner = () => {
  const game = useGameStore((state) => state.game);
  const remaining = Math.max(0, SETTLE_DURATION - game.phaseTime);
  const progress = Math.max(0, (remaining / SETTLE_DURATION) * 100);
  return (
    <section className="phase-banner settle-banner" data-testid="phase-banner">
      <div className="phase-icon">
        <CheckCircle2 size={20} />
      </div>
      <div className="phase-copy">
        <span>Automatic settle · {remaining.toFixed(1)}s</span>
        <strong>{game.lastReport?.headline}</strong>
        <p>{game.lastReport?.detail}</p>
      </div>
      <div className="settle-progress" aria-label={`${remaining.toFixed(1)} seconds remaining`}>
        <span style={{ "--settle-progress": `${progress}%` }} />
      </div>
    </section>
  );
};

const TerminalBanner = () => {
  const phase = useGameStore((state) => state.game.phase);
  const victory = phase === "victory";
  return (
    <section className={`phase-banner ${phase}-banner`} data-testid="phase-banner">
      <div className="phase-icon">
        {victory ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
      </div>
      <div className="phase-copy">
        <span>{victory ? "Base neutralized" : "Core integrity zero"}</span>
        <strong>{victory ? "Five cycles survived" : "Catalyst core lost"}</strong>
        <p>Restart the base to test a new defensive machine.</p>
      </div>
    </section>
  );
};

export const PhaseBanner = () => {
  const phase = useGameStore((state) => state.game.phase);
  switch (phase) {
    case "build":
      return <BuildBanner />;
    case "prime":
      return <PrimeBanner />;
    case "assault":
      return <AssaultBanner />;
    case "settle":
      return <SettleBanner />;
    default:
      return <TerminalBanner />;
  }
};
