import { ArrowRight, MessageSquareText, Radio, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGamePresentation } from "../application/presentationContext";
import type {
  NarrativeDialogueLineDefinition,
  NarrativeSiteDefinition,
  NarrativeSpeakerId,
} from "../presentation/defaultGame";

export type NarrativeDialoguePhase = "briefing" | "debrief";

interface NarrativeDialogueProps {
  readonly phase: NarrativeDialoguePhase;
  readonly site: NarrativeSiteDefinition;
}

const speakerInitials = (name: string): string =>
  name
    .split(/\s+/u)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const SpeakerAvatar = ({ name, speakerId }: { name: string; speakerId: NarrativeSpeakerId }) => {
  const telemetry = speakerId === "rig_telemetry";
  const concealed = speakerId === "surveyor" || speakerId === "buyer";
  return (
    <div
      className={`dialogue-avatar speaker-${speakerId}${concealed ? " concealed" : ""}`}
      aria-label={name}
    >
      {telemetry ? <Radio /> : <UserRound />}
      <span>{concealed ? "••" : speakerInitials(name)}</span>
    </div>
  );
};

const dialogueLines = (
  phase: NarrativeDialoguePhase,
  site: NarrativeSiteDefinition
): readonly NarrativeDialogueLineDefinition[] =>
  phase === "briefing" ? site.briefingDialogue : site.debriefDialogue;

/**
 * Channel transcript: each advance reveals the next line while every earlier
 * line stays on screen. The conversation never gates surrounding actions.
 */
export const NarrativeDialogue = ({ phase, site }: NarrativeDialogueProps) => {
  const { narrativeCopy, translator } = useGamePresentation();
  const lines = dialogueLines(phase, site);
  const [revealedCount, setRevealedCount] = useState(1);
  const feedRef = useRef<HTMLOListElement>(null);
  const allRevealed = revealedCount >= lines.length;
  const advance = useCallback(
    () => setRevealedCount((current) => Math.min(current + 1, lines.length)),
    [lines.length]
  );
  useEffect(() => {
    if (revealedCount === 1) return;
    feedRef.current?.lastElementChild?.scrollIntoView?.({ block: "nearest" });
  }, [revealedCount]);

  return (
    <section className={`narrative-dialogue ${phase}`}>
      <header>
        <span>
          <MessageSquareText size={16} />
          {translator.text(
            phase === "briefing" ? "narrative.ui.briefing.channel" : "narrative.ui.debrief.channel"
          )}
        </span>
        <small>
          {translator.text("narrative.ui.dialogue.progress", {
            current: revealedCount,
            total: lines.length,
          })}
        </small>
      </header>
      <ol className="dialogue-feed" ref={feedRef} data-testid="dialogue-feed">
        {lines.slice(0, revealedCount).map((line) => {
          const speaker = narrativeCopy.speaker({ id: line.speakerId });
          return (
            <li className="dialogue-message" key={`${line.speakerId}.${line.id}`}>
              <SpeakerAvatar name={speaker.name} speakerId={line.speakerId} />
              <div className="dialogue-message-body">
                <header>
                  <strong>{speaker.name}</strong>
                  <span>{speaker.role}</span>
                </header>
                <p>{narrativeCopy.dialogue(site, phase, line)}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {!allRevealed && (
        <footer>
          <button
            className="dialogue-next-button"
            type="button"
            data-testid="dialogue-next"
            onClick={advance}
          >
            {translator.text("narrative.ui.dialogue.continue")}
            <ArrowRight size={17} />
          </button>
        </footer>
      )}
    </section>
  );
};
