import { ArrowRight, Info, LockKeyhole, Radio, Timer, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useGameStore } from "../application/store";
import { levelDefinitionFor, roundDefinitionFor } from "../game/queries";
import type { GamePhase, GameState } from "../game/types";
import { commandDecision as evaluateCommand } from "../presentation/selectors";
import { TUTORIAL_ANCHORS } from "../tutorial/anchors";

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(Math.ceil(safe % 60)).padStart(2, "0")}`;
};

interface PhaseHudModel {
  detail: string;
  label: string;
  tone: "plan" | "prime" | "assault" | "frozen";
  value: string;
}

const phaseHudModel = (game: GameState): PhaseHudModel => {
  const round = roundDefinitionFor(game);
  if (game.phase === "build") {
    return {
      label: "Planning",
      value: `Prepare for ${round.wave.length} hostiles`,
      detail: "Build the defense, then start material flow.",
      tone: "plan",
    };
  }
  if (game.phase === "prime") {
    return {
      label: "Live prime",
      value: formatTime(round.primeSeconds - game.phaseTime),
      detail: "The plant is live. Assault locks the controls.",
      tone: "prime",
    };
  }
  if (game.phase === "assault") {
    const inbound = Math.max(0, round.wave.length - game.spawnCursor);
    return {
      label: "Autonomous assault",
      value: `${game.enemies.length} inside · ${inbound} inbound`,
      detail: `${game.stats.killed} neutralized · ${game.stats.breached} breached`,
      tone: "assault",
    };
  }
  return {
    label: game.phase === "defeat" ? "Core lost" : "Round frozen",
    value: game.phase === "victory" ? "Campaign complete" : "Review the result",
    detail: "Open the round brief for the full objective and outcome.",
    tone: "frozen",
  };
};

const PhaseIcon = ({ phase }: { phase: GamePhase }) => {
  if (phase === "prime") return <Timer size={18} />;
  if (phase === "assault") return <Radio size={18} />;
  return <LockKeyhole size={18} />;
};

const PhaseAction = ({ game }: { game: GameState }) => {
  const dispatch = useGameStore((state) => state.dispatch);
  if (game.phase === "build") {
    const command = { type: "start_prime" } as const;
    const decision = evaluateCommand(game, command);
    return (
      <button
        className="primary-action"
        type="button"
        data-testid="begin-prime"
        data-tutorial-anchor={TUTORIAL_ANCHORS.beginPrime}
        disabled={!decision.allowed}
        title={decision.reason ?? undefined}
        onClick={() => dispatch(command)}
      >
        Start prime <ArrowRight size={16} />
      </button>
    );
  }
  if (game.phase !== "prime") return null;
  const command = { type: "start_assault" } as const;
  const decision = evaluateCommand(game, command);
  return (
    <button
      className="primary-action danger-action"
      type="button"
      data-testid="start-assault"
      data-tutorial-anchor={TUTORIAL_ANCHORS.startAssault}
      disabled={!decision.allowed}
      title={decision.reason ?? undefined}
      onClick={() => dispatch(command)}
    >
      Start assault <LockKeyhole size={15} />
    </button>
  );
};

const RoundBriefModal = ({ game, onClose }: { game: GameState; onClose: () => void }) => {
  const level = levelDefinitionFor(game);
  const round = roundDefinitionFor(game);
  return (
    <div className="modal-backdrop round-brief-backdrop">
      <section
        className="round-brief-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="round-brief-title"
      >
        <button
          type="button"
          className="modal-close"
          aria-label="Close round brief"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <span className="round-brief-kicker">
          Level {level.number} · Round {game.campaign.roundIndex + 1}
        </span>
        <h2 id="round-brief-title">{round.title}</h2>
        <p>{round.objective}</p>
        <dl>
          <div>
            <dt>Incoming</dt>
            <dd>{round.wave.length} hostiles</dd>
          </div>
          <div>
            <dt>Prime window</dt>
            <dd>{round.primeSeconds} seconds</dd>
          </div>
          <div>
            <dt>Current phase</dt>
            <dd>{phaseHudModel(game).label}</dd>
          </div>
        </dl>
        <button type="button" className="secondary-action wide" onClick={onClose}>
          Back to the map
        </button>
      </section>
    </div>
  );
};

export const PhaseBanner = () => {
  const game = useGameStore((state) => state.game);
  const [showBrief, setShowBrief] = useState(false);
  const openBrief = useCallback(() => setShowBrief(true), [setShowBrief]);
  const closeBrief = useCallback(() => setShowBrief(false), [setShowBrief]);
  const model = phaseHudModel(game);
  return (
    <>
      <section className={`phase-hud phase-${model.tone}`} data-testid="phase-banner">
        <div className="phase-hud-icon">
          <PhaseIcon phase={game.phase} />
        </div>
        <div className="phase-hud-copy">
          <span>{model.label}</span>
          <strong>{model.value}</strong>
          <small>{model.detail}</small>
        </div>
        <button className="round-info-button" type="button" onClick={openBrief}>
          <Info size={15} /> Round brief
        </button>
        <PhaseAction game={game} />
      </section>
      {showBrief && <RoundBriefModal game={game} onClose={closeBrief} />}
    </>
  );
};
