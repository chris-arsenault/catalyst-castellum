import {
  Check,
  ChevronRight,
  Circle,
  ClipboardList,
  Eye,
  MousePointerClick,
  PanelLeftClose,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import type { Translator } from "../localization/translator";
import type { GameState } from "../game/types";
import type { GuideDefinition, GuideStepDefinition } from "./guideModel";
import { tutorialText } from "./tutorialCopy";

interface TutorialTaskCardProps {
  activeStep: GuideStepDefinition | null;
  game: GameState;
  guide: GuideDefinition;
}

const taskClassName = (done: boolean, active: boolean): string => {
  if (done) return "complete";
  return active ? "active" : "";
};

const CurrentStepIcon = ({ kind }: Pick<GuideStepDefinition, "kind">) => {
  if (kind === "complete") return <Check size={15} />;
  return kind === "observe" ? <Eye size={15} /> : <MousePointerClick size={15} />;
};

const currentActionKicker = (kind: GuideStepDefinition["kind"], translator: Translator): string => {
  if (kind === "complete") return translator.text("tutorial.common.lessonComplete");
  if (kind === "observe") return translator.text("tutorial.common.watchNow");
  return translator.text("tutorial.common.doNow");
};

const CollapsedTaskRail = ({
  completed,
  guide,
  onExpand,
  translator,
}: {
  completed: number;
  guide: GuideDefinition;
  onExpand: () => void;
  translator: Translator;
}) => (
  <button
    type="button"
    className="tutorial-task-rail-toggle"
    aria-label={translator.text("tutorial.common.expandTasks")}
    onClick={onExpand}
  >
    <ClipboardList size={16} />
    <span>{translator.text("tutorial.common.tasks")}</span>
    <em>
      {completed}/{guide.mission.tasks.length}
    </em>
    <ChevronRight size={15} />
  </button>
);

const TaskHeader = ({
  completed,
  dismiss,
  guide,
  onCollapse,
  translator,
}: {
  completed: number;
  dismiss: () => void;
  guide: GuideDefinition;
  onCollapse: () => void;
  translator: Translator;
}) => (
  <header className="tutorial-task-header">
    <div className="tutorial-task-identity">
      <small>{tutorialText(translator, guide.label)}</small>
      <h2>{tutorialText(translator, guide.mission.title)}</h2>
      <p>{tutorialText(translator, guide.mission.summary)}</p>
    </div>
    <button
      type="button"
      className="tutorial-task-collapse"
      aria-label={translator.text("tutorial.common.collapseTasks")}
      onClick={onCollapse}
    >
      <PanelLeftClose size={15} />
    </button>
    <div className="tutorial-task-header-actions">
      <span className="tutorial-task-progress">
        {translator.text("tutorial.common.complete", {
          completed,
          total: guide.mission.tasks.length,
        })}
      </span>
      <button
        type="button"
        aria-label={translator.text("tutorial.common.skipLesson")}
        onClick={dismiss}
      >
        <X size={12} /> {translator.text("tutorial.common.skipGuide")}
      </button>
    </div>
  </header>
);

const MissionTaskList = ({
  activeIndex,
  game,
  guide,
  translator,
}: {
  activeIndex: number;
  game: GameState;
  guide: GuideDefinition;
  translator: Translator;
}) => (
  <ol className="tutorial-task-list" aria-label={translator.text("tutorial.common.missionTasks")}>
    {guide.mission.tasks.map((task, index) => {
      const done = task.completed(game);
      const active = index === activeIndex;
      return (
        <li key={task.id} className={taskClassName(done, active)} aria-current={active}>
          <span className="tutorial-task-marker">
            {done ? <Check size={13} /> : <Circle size={11} />}
          </span>
          <span>{tutorialText(translator, task.label)}</span>
        </li>
      );
    })}
  </ol>
);

const CurrentAction = ({
  activeStep,
  guide,
  translator,
}: {
  activeStep: GuideStepDefinition | null;
  guide: GuideDefinition;
  translator: Translator;
}) => {
  const presentation = activeStep ?? { kind: "complete" as const, ...guide.completion };
  return (
    <section
      className="tutorial-current-action"
      aria-label={translator.text("tutorial.common.currentAction")}
    >
      <span className="tutorial-current-action-kicker">
        <CurrentStepIcon kind={presentation.kind} />
        {currentActionKicker(presentation.kind, translator)}
      </span>
      <h3>{tutorialText(translator, presentation.title)}</h3>
      <p>{tutorialText(translator, presentation.explanation)}</p>
      <strong>{tutorialText(translator, presentation.instruction)}</strong>
    </section>
  );
};

export const TutorialTaskCard = ({ activeStep, game, guide }: TutorialTaskCardProps) => {
  const { translator } = useGamePresentation();
  const [expanded, setExpanded] = useState(true);
  const dismiss = useGameStore((state) => state.dismissTutorialGuide);
  const completed = guide.mission.tasks.filter((task) => task.completed(game)).length;
  const activeIndex = guide.mission.tasks.findIndex((task) => !task.completed(game));
  const collapse = useCallback(() => setExpanded(false), []);
  const expand = useCallback(() => setExpanded(true), []);

  return (
    <aside
      className={`tutorial-task-card ${expanded ? "expanded" : "collapsed"}`}
      data-testid="tutorial-task-card"
      data-expanded={expanded}
    >
      {expanded ? (
        <>
          <TaskHeader
            completed={completed}
            dismiss={dismiss}
            guide={guide}
            onCollapse={collapse}
            translator={translator}
          />
          <MissionTaskList
            activeIndex={activeIndex}
            game={game}
            guide={guide}
            translator={translator}
          />
          <CurrentAction activeStep={activeStep} guide={guide} translator={translator} />
        </>
      ) : (
        <CollapsedTaskRail
          completed={completed}
          guide={guide}
          onExpand={expand}
          translator={translator}
        />
      )}
    </aside>
  );
};
