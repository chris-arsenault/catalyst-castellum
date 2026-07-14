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
import type { GameState } from "../game/types";
import type { GuideDefinition, GuideStepDefinition } from "./guideModel";

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

const currentActionKicker = (kind: GuideStepDefinition["kind"]): string => {
  if (kind === "complete") return "Lesson complete";
  if (kind === "observe") return "Watch now";
  return "Do this now";
};

const CollapsedTaskRail = ({
  completed,
  guide,
  onExpand,
}: {
  completed: number;
  guide: GuideDefinition;
  onExpand: () => void;
}) => (
  <button
    type="button"
    className="tutorial-task-rail-toggle"
    aria-label="Expand tutorial tasks"
    onClick={onExpand}
  >
    <ClipboardList size={16} />
    <span>Tasks</span>
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
}: {
  completed: number;
  dismiss: () => void;
  guide: GuideDefinition;
  onCollapse: () => void;
}) => (
  <header className="tutorial-task-header">
    <div className="tutorial-task-identity">
      <small>{guide.label}</small>
      <h2>{guide.mission.title}</h2>
      <p>{guide.mission.summary}</p>
    </div>
    <button
      type="button"
      className="tutorial-task-collapse"
      aria-label="Collapse tutorial tasks"
      onClick={onCollapse}
    >
      <PanelLeftClose size={15} />
    </button>
    <div className="tutorial-task-header-actions">
      <span className="tutorial-task-progress">
        {completed} / {guide.mission.tasks.length} complete
      </span>
      <button type="button" aria-label="Skip guided lesson" onClick={dismiss}>
        <X size={12} /> Skip guide
      </button>
    </div>
  </header>
);

const MissionTaskList = ({
  activeIndex,
  game,
  guide,
}: {
  activeIndex: number;
  game: GameState;
  guide: GuideDefinition;
}) => (
  <ol className="tutorial-task-list" aria-label="Mission tasks">
    {guide.mission.tasks.map((task, index) => {
      const done = task.completed(game);
      const active = index === activeIndex;
      return (
        <li key={task.id} className={taskClassName(done, active)} aria-current={active}>
          <span className="tutorial-task-marker">
            {done ? <Check size={13} /> : <Circle size={11} />}
          </span>
          <span>{task.label}</span>
        </li>
      );
    })}
  </ol>
);

const CurrentAction = ({
  activeStep,
  guide,
}: {
  activeStep: GuideStepDefinition | null;
  guide: GuideDefinition;
}) => {
  const presentation = activeStep ?? { kind: "complete" as const, ...guide.completion };
  return (
    <section className="tutorial-current-action" aria-label="Current action">
      <span className="tutorial-current-action-kicker">
        <CurrentStepIcon kind={presentation.kind} />
        {currentActionKicker(presentation.kind)}
      </span>
      <h3>{presentation.title}</h3>
      <p>{presentation.explanation}</p>
      <strong>{presentation.instruction}</strong>
    </section>
  );
};

export const TutorialTaskCard = ({ activeStep, game, guide }: TutorialTaskCardProps) => {
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
          <TaskHeader completed={completed} dismiss={dismiss} guide={guide} onCollapse={collapse} />
          <MissionTaskList activeIndex={activeIndex} game={game} guide={guide} />
          <CurrentAction activeStep={activeStep} guide={guide} />
        </>
      ) : (
        <CollapsedTaskRail completed={completed} guide={guide} onExpand={expand} />
      )}
    </aside>
  );
};
