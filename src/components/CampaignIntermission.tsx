import { ArrowRight, Blocks, CheckCircle2, Footprints, Gauge, LogOut } from "lucide-react";
import { useCallback } from "react";
import { useGamePresentation } from "../application/presentationContext";
import { useGameStore } from "../application/store";
import { LEVEL_DEFINITIONS, nextLevelId } from "../presentation/defaultGame";
import { levelDefinitionFor } from "../game/queries";
import { GraftBoard } from "./GraftBoard";

const WalkingCastellum = () => {
  const { translator } = useGamePresentation();
  return (
    <svg
      className="walking-castellum"
      viewBox="0 0 640 320"
      role="img"
      aria-label={translator.text("ui.intermission.walkingLabel")}
    >
      <defs>
        <linearGradient id="hull-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#285c4e" />
          <stop offset="1" stopColor="#102820" />
        </linearGradient>
        <filter id="hull-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <g className="walking-ground">
        <path d="M30 270 H610" />
        <path d="M60 292 H220 M260 292 H430 M470 292 H590" />
      </g>
      <ellipse className="walking-shadow" cx="320" cy="263" rx="180" ry="19" />
      <g className="walking-leg walking-leg-a">
        <path d="M220 190 L166 229 L126 274" />
        <path d="M290 196 L248 239 L232 278" />
        <path d="M390 194 L431 236 L456 276" />
      </g>
      <g className="walking-leg walking-leg-b">
        <path d="M250 194 L209 239 L184 278" />
        <path d="M350 196 L383 241 L396 279" />
        <path d="M420 188 L481 226 L520 273" />
      </g>
      <g className="walking-hull">
        <rect className="walking-hull-glow" x="174" y="112" width="292" height="90" rx="28" />
        <path
          className="walking-hull-body"
          d="M176 148 Q176 115 210 112 H432 Q466 115 466 148 V174 Q466 202 436 204 H204 Q176 201 176 174 Z"
        />
        <rect className="walking-room" x="205" y="87" width="86" height="71" rx="13" />
        <rect
          className="walking-room walking-core"
          x="304"
          y="62"
          width="106"
          height="96"
          rx="16"
        />
        <path className="walking-bracket" d="M318 78 V68 H396 V78 M318 141 V151 H396 V141" />
        <circle className="walking-reactor" cx="357" cy="109" r="22" />
        <path className="walking-pipe" d="M226 132 H319 M395 132 H442" />
        <circle className="walking-light" cx="205" cy="172" r="4" />
        <circle className="walking-light" cx="224" cy="172" r="4" />
        <circle className="walking-light" cx="243" cy="172" r="4" />
      </g>
    </svg>
  );
};

const SummaryStats = () => {
  const { formatters, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  return (
    <dl className="intermission-stats">
      <div>
        <dt>{translator.text("ui.progress.neutralized")}</dt>
        <dd>{game.lastReport?.killed ?? 0}</dd>
      </div>
      <div>
        <dt>{translator.text("ui.progress.breaches")}</dt>
        <dd>{game.lastReport?.breached ?? 0}</dd>
      </div>
      <div>
        <dt>{translator.text("ui.progress.core")}</dt>
        <dd>{formatters.percent(game.coreIntegrity / 100, 0)}</dd>
      </div>
      <div>
        <dt>{translator.text("ui.progress.reactions")}</dt>
        <dd>{formatters.number(game.lastReport?.reactions ?? 0, 1)}</dd>
      </div>
    </dl>
  );
};

const IntermissionChoices = ({
  onGraft,
  onTravel,
}: {
  onGraft: () => void;
  onTravel: () => void;
}) => {
  const { translator } = useGamePresentation();
  return (
    <div className="intermission-choice">
      <button
        type="button"
        className="graft-choice"
        data-testid="intermission-graft"
        onClick={onGraft}
      >
        <Blocks size={20} />
        <span>
          <strong>{translator.text("ui.intermission.graft.action")}</strong>
          <small>{translator.text("ui.intermission.graft.detail")}</small>
        </span>
      </button>
      <button
        type="button"
        className="travel-choice"
        data-testid="travel-to-next-site"
        onClick={onTravel}
      >
        <ArrowRight size={20} />
        <span>
          <strong>{translator.text("ui.intermission.travel.action")}</strong>
          <small>{translator.text("ui.intermission.travel.detail")}</small>
        </span>
      </button>
    </div>
  );
};

const IntermissionSummary = () => {
  const { levelCopy, roundReportCopy, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const setGraftMode = useGameStore((state) => state.setGraftMode);
  const returnToMainMenu = useGameStore((state) => state.returnToMainMenu);
  const level = levelDefinitionFor(game);
  const report = game.lastReport ? roundReportCopy(game.lastReport) : null;
  const nextId = nextLevelId(level.id);
  const nextLevel = nextId ? LEVEL_DEFINITIONS[nextId] : null;
  const nextText = nextLevel ? levelCopy.level(nextLevel) : null;
  const travel = useCallback(() => {
    setGraftMode(false);
    if (dispatch({ type: "start_next_level" })) dispatch({ type: "dock_at_site" });
  }, [dispatch, setGraftMode]);
  const graft = useCallback(() => setGraftMode(true), [setGraftMode]);

  return (
    <main className="intermission-stage" data-testid="level-intermission">
      <section className="intermission-screen">
        <div className="intermission-visual">
          <WalkingCastellum />
          <div className="intermission-motion-copy">
            <Footprints size={18} />
            <div>
              <strong>{translator.text("ui.intermission.motion.title")}</strong>
              <span>{translator.text("ui.intermission.motion.detail")}</span>
            </div>
          </div>
        </div>
        <article className="intermission-summary">
          <header>
            <span className="intermission-seal">
              <CheckCircle2 size={28} />
            </span>
            <div>
              <em>{translator.text("ui.progress.level.eyebrow")}</em>
              <h1>
                {translator.text("ui.progress.level.complete", {
                  name: levelCopy.level(level).name,
                })}
              </h1>
            </div>
          </header>
          <p>{report?.detail ?? translator.text("ui.progress.level.securedRecord")}</p>
          <SummaryStats />
          <div className="intermission-next">
            <span>
              <Gauge size={16} /> {translator.text("ui.progress.level.next")}
            </span>
            <strong>{nextText?.name ?? translator.text("ui.progress.level.campaign")}</strong>
            <p>{nextText?.briefing ?? translator.text("ui.progress.level.curriculum")}</p>
          </div>
          <IntermissionChoices onGraft={graft} onTravel={travel} />
          <footer>
            <button className="menu-return-button" type="button" onClick={returnToMainMenu}>
              <LogOut size={15} /> {translator.text("ui.topbar.saveSlots")}
            </button>
          </footer>
        </article>
      </section>
    </main>
  );
};

const TravelRecovery = () => {
  const { levelCopy, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const nextId = nextLevelId(game.campaign.levelId);
  const nextLevel = nextId ? LEVEL_DEFINITIONS[nextId] : null;
  const dock = useCallback(() => dispatch({ type: "dock_at_site" }), [dispatch]);
  return (
    <main className="intermission-stage" data-testid="travel-intermission">
      <section className="travel-recovery">
        <WalkingCastellum />
        <em>{translator.text("ui.progress.travel.eyebrow")}</em>
        <h1>
          {translator.text("ui.progress.travel.title", {
            name: nextLevel
              ? levelCopy.level(nextLevel).name
              : translator.text("ui.progress.level.campaign"),
          })}
        </h1>
        <p>{translator.text("ui.progress.travel.detail")}</p>
        <button
          className="travel-choice compact"
          type="button"
          data-testid="travel-to-next-site"
          onClick={dock}
        >
          <ArrowRight size={20} /> {translator.text("ui.intermission.travel.action")}
        </button>
      </section>
    </main>
  );
};

export const CampaignIntermission = () => {
  const phase = useGameStore((state) => state.game.phase);
  const graftMode = useGameStore((state) => state.graftMode);
  if (phase === "travel") return <TravelRecovery />;
  if (graftMode) return <GraftBoard />;
  return <IntermissionSummary />;
};
