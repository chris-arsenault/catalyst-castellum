import { ArrowRight, MessageSquareText, Radio, UserRound } from "lucide-react";
import { useCallback, useState } from "react";
import { useGamePresentation } from "../application/presentationContext";
import type {
  NarrativeDialogueLineDefinition,
  NarrativeSiteDefinition,
  NarrativeSpeakerId,
} from "../presentation/defaultGame";

type NarrativeDialogueProps =
  | Readonly<{
      phase: "briefing";
      site: NarrativeSiteDefinition;
      onComplete: () => void;
    }>
  | Readonly<{
      phase: "debrief";
      site: NarrativeSiteDefinition;
    }>;

const speakerInitials = (name: string): string =>
  name
    .split(/\s+/u)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const SpeakerPortrait = ({ name, speakerId }: { name: string; speakerId: NarrativeSpeakerId }) => {
  const telemetry = speakerId === "rig_telemetry";
  const concealed = speakerId === "surveyor" || speakerId === "buyer";
  return (
    <div
      className={`speaker-portrait speaker-${speakerId}${concealed ? " concealed" : ""}`}
      aria-label={name}
    >
      <div className="speaker-portrait-image" aria-hidden="true">
        {telemetry ? <Radio /> : <UserRound />}
        <span>{concealed ? "••" : speakerInitials(name)}</span>
      </div>
      <i aria-hidden="true" />
    </div>
  );
};

const dialogueLines = (
  phase: NarrativeDialogueProps["phase"],
  site: NarrativeSiteDefinition
): readonly NarrativeDialogueLineDefinition[] =>
  phase === "briefing" ? site.briefingDialogue : site.debriefDialogue;

export const NarrativeDialogue = (props: NarrativeDialogueProps) => {
  const { narrativeCopy, translator } = useGamePresentation();
  const { phase, site } = props;
  const lines = dialogueLines(phase, site);
  const [lineIndex, setLineIndex] = useState(0);
  const line = lines[lineIndex]!;
  const speaker = narrativeCopy.speaker({ id: line.speakerId });
  const finalLine = lineIndex === lines.length - 1;
  const advance = useCallback(() => {
    if (!finalLine) {
      setLineIndex((current) => current + 1);
      return;
    }
    if (props.phase === "briefing") props.onComplete();
  }, [finalLine, props]);
  const showAdvance = !finalLine || phase === "briefing";

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
            current: lineIndex + 1,
            total: lines.length,
          })}
        </small>
      </header>
      <div className="dialogue-turn" key={`${line.speakerId}.${line.id}`}>
        <SpeakerPortrait name={speaker.name} speakerId={line.speakerId} />
        <article>
          <header>
            <strong>{speaker.name}</strong>
            <span>{speaker.role}</span>
          </header>
          <p>{narrativeCopy.dialogue(site, phase, line)}</p>
        </article>
      </div>
      {showAdvance && (
        <footer>
          <button
            className="dialogue-next-button"
            type="button"
            data-testid={finalLine ? "dialogue-open-mission" : "dialogue-next"}
            onClick={advance}
          >
            {translator.text(
              finalLine ? "narrative.ui.dialogue.openBriefing" : "narrative.ui.dialogue.continue"
            )}
            <ArrowRight size={17} />
          </button>
        </footer>
      )}
    </section>
  );
};
