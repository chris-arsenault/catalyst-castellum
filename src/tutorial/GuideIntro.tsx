import { Flame, MapPinned } from "lucide-react";
import type { GuideDefinition } from "./guideModel";
import { useGamePresentation } from "../application/presentationContext";
import { tutorialText } from "./tutorialCopy";

/**
 * A guide's field story, teaching model, and objective. Rendered by the
 * surface that precedes the guide: the arrival briefing for a level-opening
 * guide, the round report for a guide that starts on a later round.
 */
export const GuideIntro = ({ guide }: { guide: GuideDefinition }) => {
  const { translator } = useGamePresentation();
  return (
    <section className="guide-intro" data-testid="guide-intro">
      <span className="guide-intro-kicker">
        <MapPinned size={15} /> {tutorialText(translator, guide.story.kicker)}
      </span>
      <h3 id="guide-intro-title">{tutorialText(translator, guide.story.title)}</h3>
      <div className="guide-intro-story">
        {guide.story.paragraphs.map((paragraph) => (
          <p key={paragraph}>{tutorialText(translator, paragraph)}</p>
        ))}
      </div>
      <div className="guide-intro-goal">
        <span>
          <Flame size={16} /> {translator.text("tutorial.common.fieldObjective")}
        </span>
        <strong>{tutorialText(translator, guide.mission.title)}</strong>
        <p>{tutorialText(translator, guide.mission.summary)}</p>
      </div>
    </section>
  );
};
