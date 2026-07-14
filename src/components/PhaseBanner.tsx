import { ArrowRight, Info, LockKeyhole, Radio, Timer, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useGameStore } from "../application/store";
import { levelDefinitionFor, roundDefinitionFor } from "../game/queries";
import type { GamePhase, GameState } from "../game/types";
import { commandDecision as evaluateCommand } from "../presentation/selectors";
import { TUTORIAL_ANCHORS } from "../tutorial/anchors";
import { guidedPhaseActionReason } from "../tutorial/guideModel";
import { commandRejectionCopy } from "../presentation/commandCopy";
import { levelCopy, roundCopy } from "../presentation/levelCopy";

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
  const level = levelDefinitionFor(game);
  const levelText = levelCopy(level);
  const round = roundDefinitionFor(game);
  if (game.phase === "level_briefing") {
    return {
      label: "Checkpoint briefing",
      value: levelText.name,
      detail: "Review the objective and enter planning.",
      tone: "frozen",
    };
  }
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
  if (game.phase === "round_result")
    return {
      label: "Round complete",
      value: `Core ${Math.round(game.coreIntegrity)}%`,
      detail: "Round analysis is ready.",
      tone: "frozen",
    };
  if (game.phase === "level_complete")
    return {
      label: "Checkpoint secured",
      value: levelText.name,
      detail: "The next checkpoint is ready.",
      tone: "frozen",
    };
  if (game.phase === "victory")
    return {
      label: "Campaign complete",
      value: `Core ${Math.round(game.coreIntegrity)}%`,
      detail: "The final campaign record is ready.",
      tone: "frozen",
    };
  return {
    label: "Core lost",
    value: levelText.name,
    detail: "Retry restores this checkpoint for a new defense plan.",
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
  const dismissedGuideIds = useGameStore((state) => state.dismissedGuideIds);
  if (game.phase === "build") {
    const command = { type: "start_prime" } as const;
    const decision = evaluateCommand(game, command);
    const guideReason = guidedPhaseActionReason(game, command.type, dismissedGuideIds);
    return (
      <button
        className="primary-action"
        type="button"
        data-testid="begin-prime"
        data-tutorial-anchor={TUTORIAL_ANCHORS.beginPrime}
        disabled={!decision.allowed || Boolean(guideReason)}
        title={guideReason ?? commandRejectionCopy(decision) ?? undefined}
        onClick={() => dispatch(command)}
      >
        Start prime <ArrowRight size={16} />
      </button>
    );
  }
  if (game.phase !== "prime") return null;
  const command = { type: "start_assault" } as const;
  const decision = evaluateCommand(game, command);
  const guideReason = guidedPhaseActionReason(game, command.type, dismissedGuideIds);
  return (
    <button
      className="primary-action danger-action"
      type="button"
      data-testid="start-assault"
      data-tutorial-anchor={TUTORIAL_ANCHORS.startAssault}
      disabled={!decision.allowed || Boolean(guideReason)}
      title={guideReason ?? commandRejectionCopy(decision) ?? undefined}
      onClick={() => dispatch(command)}
    >
      Start assault <LockKeyhole size={15} />
    </button>
  );
};

const RoundBriefModal = ({ game, onClose }: { game: GameState; onClose: () => void }) => {
  const level = levelDefinitionFor(game);
  const round = roundDefinitionFor(game);
  const roundText = roundCopy(level, round);
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
        <h2 id="round-brief-title">{roundText.title}</h2>
        <p>{roundText.objective}</p>
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
      <section
        className={`phase-hud phase-${model.tone}`}
        data-testid="phase-banner"
        data-tutorial-anchor={TUTORIAL_ANCHORS.phaseBanner}
      >
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
