import { ArrowRight, CheckCircle2, FlaskConical, LockKeyhole, Radio, Timer } from "lucide-react";
import { levelDefinitionFor, roundDefinitionFor } from "../game/simulation";
import { useGameStore } from "../game/store";

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remainder = Math.ceil(safe % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
};

const BuildBanner = () => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const round = roundDefinitionFor(game);
  return (
    <section className="phase-banner build-banner" data-testid="phase-banner">
      <div className="phase-icon">
        <FlaskConical size={20} />
      </div>
      <div className="phase-copy">
        <span>
          Frozen planning · {round.wave.length} hostiles · {round.primeSeconds}s maximum prime
        </span>
        <strong>{round.title}</strong>
        <p>{round.objective}</p>
      </div>
      <div className="phase-resource">
        <span>Available matter</span>
        <strong>{Math.floor(game.matter)}</strong>
        <small>configure freely before priming</small>
      </div>
      <button
        className="primary-action"
        type="button"
        data-testid="begin-prime"
        onClick={() => dispatch({ type: "start_prime" })}
      >
        Begin timed prime <ArrowRight size={17} />
      </button>
    </section>
  );
};

const PrimeBanner = () => {
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const round = roundDefinitionFor(game);
  const remaining = round.primeSeconds - game.phaseTime;
  return (
    <section className="phase-banner prime-banner" data-testid="phase-banner">
      <div className="phase-icon pulse">
        <Timer size={20} />
      </div>
      <div className="phase-copy">
        <span>Live prime · automatic lock in {formatTime(remaining)}</span>
        <strong>{round.objective}</strong>
        <p>Controls remain live. Feedstocks, products, and byproducts persist.</p>
      </div>
      <div className="prime-checks">
        <span className={game.stats.reactions > 0.1 ? "ready" : ""}>
          <CheckCircle2 size={14} /> Reactions {game.stats.reactions.toFixed(1)}
        </span>
        <span className={game.stats.combustionFlashes > 0 ? "ready" : ""}>
          <CheckCircle2 size={14} /> Flashes {game.stats.combustionFlashes}
        </span>
        <span className={game.stats.peakHazard > 10 ? "ready" : ""}>
          <CheckCircle2 size={14} /> Peak hazard {Math.round(game.stats.peakHazard)}
        </span>
      </div>
      <button
        className="primary-action danger-action"
        type="button"
        data-testid="start-assault"
        onClick={() => dispatch({ type: "start_assault" })}
      >
        Lock early <LockKeyhole size={16} />
      </button>
    </section>
  );
};

const AssaultBanner = () => {
  const game = useGameStore((state) => state.game);
  const round = roundDefinitionFor(game);
  const queued = Math.max(0, round.wave.length - game.spawnCursor);
  return (
    <section className="phase-banner assault-banner" data-testid="phase-banner">
      <div className="phase-icon pulse danger-pulse">
        <Radio size={20} />
      </div>
      <div className="phase-copy">
        <span>Autonomous assault · {formatTime(game.phaseTime)} · controls locked</span>
        <strong>
          {game.enemies.length} inside · {queued} inbound
        </strong>
        <p>The plant is running the configuration and inventories established during prime.</p>
      </div>
      <div className="assault-stats">
        <div>
          <span>Neutralized</span>
          <strong>{game.stats.killed}</strong>
        </div>
        <div>
          <span>Matter</span>
          <strong>+{game.pendingMatter}</strong>
        </div>
        <div>
          <span>Breaches</span>
          <strong className={game.stats.breached > 0 ? "bad" : ""}>{game.stats.breached}</strong>
        </div>
      </div>
    </section>
  );
};

const FrozenBanner = () => {
  const game = useGameStore((state) => state.game);
  const level = levelDefinitionFor(game);
  const defeat = game.phase === "defeat";
  const complete = game.phase === "victory" || game.phase === "level_complete";
  return (
    <section className={`phase-banner ${game.phase}-banner`} data-testid="phase-banner">
      <div className="phase-icon">
        {complete ? <CheckCircle2 size={20} /> : <LockKeyhole size={20} />}
      </div>
      <div className="phase-copy">
        <span>{defeat ? "Core integrity zero" : "Simulation frozen"}</span>
        <strong>{game.lastReport?.headline ?? level.name}</strong>
        <p>{game.lastReport?.detail ?? level.lesson}</p>
      </div>
    </section>
  );
};

export const PhaseBanner = () => {
  const phase = useGameStore((state) => state.game.phase);
  if (phase === "build") return <BuildBanner />;
  if (phase === "prime") return <PrimeBanner />;
  if (phase === "assault") return <AssaultBanner />;
  return <FrozenBanner />;
};
