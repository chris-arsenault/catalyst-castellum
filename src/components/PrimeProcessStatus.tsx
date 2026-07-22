import { Activity } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGamePresentation } from "../application/presentationContext";
import type { GameState } from "../game/types";
import type { ReactionEngineStatusCopy } from "../presentation/reactionEngine";

const SAMPLE_INTERVAL_SECONDS = 0.5;

export const PrimeProcessStatus = ({ game }: { game: GameState }) => {
  const { reactionEngine, translator } = useGamePresentation();
  const sample = useMemo(() => reactionEngine.sample(game), [game, reactionEngine]);
  const previousSample = useRef(sample);
  const [status, setStatus] = useState<ReactionEngineStatusCopy | null>(null);

  useEffect(() => {
    const previous = previousSample.current;
    if (
      previous.levelId !== sample.levelId ||
      previous.roundIndex !== sample.roundIndex ||
      previous.phase !== sample.phase ||
      sample.elapsed < previous.elapsed
    ) {
      previousSample.current = sample;
      setStatus(null);
      return;
    }
    if (sample.elapsed - previous.elapsed < SAMPLE_INTERVAL_SECONDS) return;
    setStatus(reactionEngine.status(previous, sample));
    previousSample.current = sample;
  }, [reactionEngine, sample]);

  const summary = status?.summary ?? translator.text("ui.reactionEngine.sampling");
  return (
    <div className="prime-process-status" data-testid="prime-process-status">
      <span>
        <Activity size={11} /> {translator.text("ui.reactionEngine.title")}
      </span>
      <small>{summary}</small>
      <progress
        aria-label={summary}
        max={1}
        value={status ? 1 - status.homeostasis : 0}
        data-testid="reaction-change"
      />
    </div>
  );
};
