import { ArrowRight, Info, LockKeyhole, Radio, Timer, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import { levelDefinitionFor, roundDefinitionFor } from "../game/queries";
import type { GamePhase, GameState } from "../game/types";
import { TUTORIAL_ANCHORS } from "../tutorial/anchors";
import { guidedPhaseActionReason } from "../tutorial/guideModel";
import type { LocaleFormatters } from "../localization/formatters";
import type { Translator } from "../localization/translator";
import { WaveForecastDetails, WaveForecastStrip } from "./WaveForecast";

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

const integrityValue = (
  game: GameState,
  translator: Translator,
  formatters: LocaleFormatters
): string =>
  translator.text("ui.phaseHud.result.value", {
    integrity: formatters.percent(game.coreIntegrity / 100, 0),
  });

const phaseHudModel = (
  game: GameState,
  translator: Translator,
  formatters: LocaleFormatters,
  levelName: string
): PhaseHudModel => {
  const round = roundDefinitionFor(game);
  if (game.phase === "level_briefing") {
    return {
      label: translator.text("ui.phaseHud.briefing.label"),
      value: levelName,
      detail: translator.text("ui.phaseHud.briefing.detail"),
      tone: "frozen",
    };
  }
  if (game.phase === "build") {
    return {
      label: translator.text("ui.phaseHud.build.label"),
      value: translator.text("ui.phaseHud.build.value", { count: round.wave.length }),
      detail: translator.text("ui.phaseHud.build.detail"),
      tone: "plan",
    };
  }
  if (game.phase === "prime") {
    return {
      label: translator.text("ui.phaseHud.prime.label"),
      value: formatTime(round.primeSeconds - game.phaseTime),
      detail: translator.text("ui.phaseHud.prime.detail"),
      tone: "prime",
    };
  }
  if (game.phase === "assault") {
    const inbound = Math.max(0, round.wave.length - game.spawnCursor);
    return {
      label: translator.text("ui.phaseHud.assault.label"),
      value: translator.text("ui.phaseHud.assault.value", {
        inside: game.enemies.length,
        inbound,
      }),
      detail: translator.text("ui.phaseHud.assault.detail", {
        killed: game.stats.killed,
        breached: game.stats.breached,
      }),
      tone: "assault",
    };
  }
  if (game.phase === "round_result")
    return {
      label: translator.text("ui.phaseHud.result.label"),
      value: integrityValue(game, translator, formatters),
      detail: translator.text("ui.phaseHud.result.detail"),
      tone: "frozen",
    };
  if (game.phase === "level_complete")
    return {
      label: translator.text("ui.phaseHud.level.label"),
      value: levelName,
      detail: translator.text("ui.phaseHud.level.detail"),
      tone: "frozen",
    };
  if (game.phase === "victory")
    return {
      label: translator.text("ui.phaseHud.victory.label"),
      value: integrityValue(game, translator, formatters),
      detail: translator.text("ui.phaseHud.victory.detail"),
      tone: "frozen",
    };
  return {
    label: translator.text("ui.phaseHud.defeat.label"),
    value: levelName,
    detail: translator.text("ui.phaseHud.defeat.detail"),
    tone: "frozen",
  };
};

const PhaseIcon = ({ phase }: { phase: GamePhase }) => {
  if (phase === "prime") return <Timer size={18} />;
  if (phase === "assault") return <Radio size={18} />;
  return <LockKeyhole size={18} />;
};

const PhaseAction = ({ game }: { game: GameState }) => {
  const { commandCopy, selectors, translator } = useGamePresentation();
  const dispatch = useGameStore((state) => state.dispatch);
  const dismissedGuideIds = useGameStore((state) => state.dismissedGuideIds);
  if (game.phase === "build") {
    const command = { type: "start_prime" } as const;
    const decision = selectors.commandDecision(game, command);
    const guideReason = guidedPhaseActionReason(game, command.type, dismissedGuideIds);
    return (
      <button
        className="primary-action"
        type="button"
        data-testid="begin-prime"
        data-tutorial-anchor={TUTORIAL_ANCHORS.beginPrime}
        disabled={!decision.allowed || Boolean(guideReason)}
        title={guideReason ? translator.text(guideReason) : (commandCopy(decision) ?? undefined)}
        onClick={() => dispatch(command)}
      >
        {translator.text("ui.phaseHud.startPrime")} <ArrowRight size={16} />
      </button>
    );
  }
  if (game.phase !== "prime") return null;
  const command = { type: "start_assault" } as const;
  const decision = selectors.commandDecision(game, command);
  const guideReason = guidedPhaseActionReason(game, command.type, dismissedGuideIds);
  return (
    <button
      className="primary-action danger-action"
      type="button"
      data-testid="start-assault"
      data-tutorial-anchor={TUTORIAL_ANCHORS.startAssault}
      disabled={!decision.allowed || Boolean(guideReason)}
      title={guideReason ? translator.text(guideReason) : (commandCopy(decision) ?? undefined)}
      onClick={() => dispatch(command)}
    >
      {translator.text("ui.phaseHud.startAssault")} <LockKeyhole size={15} />
    </button>
  );
};

const RoundBriefModal = ({ game, onClose }: { game: GameState; onClose: () => void }) => {
  const { formatters, levelCopy: localizedLevelCopy, translator } = useGamePresentation();
  const level = levelDefinitionFor(game);
  const round = roundDefinitionFor(game);
  const roundText = localizedLevelCopy.round(level, round);
  const levelText = localizedLevelCopy.level(level);
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
          aria-label={translator.text("ui.phaseHud.closeBrief")}
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <span className="round-brief-kicker">
          {translator.text("ui.phaseHud.levelRound", {
            level: level.number,
            round: game.campaign.roundIndex + 1,
          })}
        </span>
        <h2 id="round-brief-title">{roundText.title}</h2>
        <p>{roundText.objective}</p>
        <dl>
          <div>
            <dt>{translator.text("ui.phaseHud.incoming")}</dt>
            <dd>{translator.text("ui.phaseHud.hostiles", { count: round.wave.length })}</dd>
          </div>
          <div>
            <dt>{translator.text("ui.phaseHud.primeWindow")}</dt>
            <dd>{formatters.duration(round.primeSeconds)}</dd>
          </div>
          <div>
            <dt>{translator.text("ui.phaseHud.currentPhase")}</dt>
            <dd>{phaseHudModel(game, translator, formatters, levelText.name).label}</dd>
          </div>
        </dl>
        <WaveForecastDetails game={game} />
        <button type="button" className="secondary-action wide" onClick={onClose}>
          {translator.text("ui.phaseHud.back")}
        </button>
      </section>
    </div>
  );
};

export const PhaseBanner = () => {
  const { formatters, levelCopy: localizedLevelCopy, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const [showBrief, setShowBrief] = useState(false);
  const openBrief = useCallback(() => setShowBrief(true), [setShowBrief]);
  const closeBrief = useCallback(() => setShowBrief(false), [setShowBrief]);
  const model = phaseHudModel(
    game,
    translator,
    formatters,
    localizedLevelCopy.level(levelDefinitionFor(game)).name
  );
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
          <Info size={15} />{" "}
          {translator.text(
            game.phase === "build" ? "ui.phaseHud.waveForecast" : "ui.phaseHud.roundBrief"
          )}
        </button>
        <PhaseAction game={game} />
        {game.phase === "build" && <WaveForecastStrip game={game} />}
      </section>
      {showBrief && <RoundBriefModal game={game} onClose={closeBrief} />}
    </>
  );
};
