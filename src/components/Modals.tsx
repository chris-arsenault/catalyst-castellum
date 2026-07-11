import {
  Activity,
  ArrowRight,
  Biohazard,
  CheckCircle2,
  DoorClosed,
  Droplets,
  Flame,
  Gauge,
  RotateCcw,
  Wind,
  X,
} from "lucide-react";
import { useGameStore } from "../game/store";

const BriefingGraphic = () => (
  <div className="briefing-graphic" aria-hidden="true">
    <div className="graphic-grid" />
    <div className="graphic-pipe pipe-one" />
    <div className="graphic-pipe pipe-two" />
    <div className="graphic-chamber chamber-one">
      <Biohazard />
    </div>
    <div className="graphic-chamber chamber-two">
      <Droplets />
    </div>
    <div className="graphic-core">
      <span />
      <span />
      <span />
    </div>
    <div className="graphic-enemy enemy-one" />
    <div className="graphic-enemy enemy-two" />
    <div className="graphic-label">FLOW DEFENSE ARRAY // CASTELLUM-01</div>
  </div>
);

const BriefingVerbs = () => (
  <div className="briefing-verbs">
    <div>
      <span>
        <Wind size={18} />
      </span>
      <strong>Fill & hold</strong>
      <p>Build a lethal atmosphere, then seal it in place.</p>
    </div>
    <div>
      <span>
        <Flame size={18} />
      </span>
      <strong>Convert</strong>
      <p>Ignite, boil, neutralize, and exploit the output.</p>
    </div>
    <div>
      <span>
        <Activity size={18} />
      </span>
      <strong>Time</strong>
      <p>Trigger the machine when occupancy reaches its peak.</p>
    </div>
  </div>
);

const ManualPhases = () => (
  <div className="manual-phases">
    <div>
      <em>01</em>
      <strong>Build</strong>
      <p>Install or salvage room modules. Salvage returns full value.</p>
    </div>
    <div>
      <em>02</em>
      <strong>Prime</strong>
      <p>Run modules without enemies present. There is no prime time limit.</p>
    </div>
    <div>
      <em>03</em>
      <strong>Assault</strong>
      <p>Watch room occupancy and fire installed controls at the right moment.</p>
    </div>
    <div>
      <em>04</em>
      <strong>Settle</strong>
      <p>Gases equalize, drains work, reactions finish, and all resulting state persists.</p>
    </div>
  </div>
);

const ManualTips = () => (
  <div className="manual-tips">
    <div>
      <DoorClosed size={18} />
      <p>
        <strong>Seal before filling.</strong> A sealed room holds extra pressure and slows
        occupants.
      </p>
    </div>
    <div>
      <Flame size={18} />
      <p>
        <strong>Check oxygen before ignition.</strong> CO₂ suppresses fuel combustion.
      </p>
    </div>
    <div>
      <Droplets size={18} />
      <p>
        <strong>Water is not harmless.</strong> It dilutes acid and sludge, but feeds the boiler.
      </p>
    </div>
    <div>
      <Biohazard size={18} />
      <p>
        <strong>Read the trace.</strong> Bellows, dilution, failed reactions, and breaches are all
        recorded.
      </p>
    </div>
  </div>
);

export const BriefingModal = () => {
  const show = useGameStore((state) => state.showBriefing);
  const dismiss = useGameStore((state) => state.dismissBriefing);
  if (!show) return null;

  return (
    <div
      className="modal-backdrop briefing-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="briefing-title"
    >
      <div className="briefing-modal">
        <BriefingGraphic />

        <div className="briefing-content">
          <div className="eyebrow">
            <span /> Defense system commissioning
          </div>
          <h1 id="briefing-title">
            <span>Catalyst</span> Castellum
          </h1>
          <p className="briefing-lede">
            Defend the core by deciding <strong>what each room is full of</strong> when enemies
            enter it. Your towers are tanks, ducts, pumps, valves, and reactions.
          </p>

          <BriefingVerbs />

          <div className="briefing-objective">
            <div>
              <Gauge size={19} />
              <span>Commissioning objective</span>
            </div>
            <p>
              Survive five persistent assault cycles. Chamber contents, heat, residue, and core
              damage carry forward.
            </p>
          </div>

          <button
            className="enter-button"
            type="button"
            data-testid="enter-control-room"
            onClick={dismiss}
          >
            Enter control room <ArrowRight size={18} />
          </button>
          <small className="briefing-hint">
            Recommended: inspect the Switchyard, then begin the prime phase.
          </small>
        </div>
      </div>
    </div>
  );
};

export const HelpModal = () => {
  const show = useGameStore((state) => state.showHelp);
  const setShow = useGameStore((state) => state.setShowHelp);
  if (!show) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="manual-title">
      <div className="help-modal">
        <button
          className="modal-close"
          type="button"
          aria-label="Close field manual"
          onClick={() => setShow(false)}
        >
          <X size={18} />
        </button>
        <div className="eyebrow">
          <span /> Operations field manual
        </div>
        <h2 id="manual-title">Run the defense machine</h2>
        <p>Each cycle moves through four phases. The base never resets between them.</p>

        <ManualPhases />
        <ManualTips />

        <button className="secondary-action wide" type="button" onClick={() => setShow(false)}>
          Return to controls
        </button>
      </div>
    </div>
  );
};

export const OutcomeModal = () => {
  const game = useGameStore((state) => state.game);
  const reset = useGameStore((state) => state.reset);
  if (game.phase !== "victory" && game.phase !== "defeat") return null;
  const victory = game.phase === "victory";

  return (
    <div
      className="modal-backdrop outcome-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="outcome-title"
    >
      <div className={`outcome-modal ${victory ? "outcome-victory" : "outcome-defeat"}`}>
        <div className="outcome-seal">
          {victory ? <CheckCircle2 size={42} /> : <Biohazard size={42} />}
        </div>
        <div className="eyebrow">
          <span /> Base record finalized
        </div>
        <h2 id="outcome-title">{victory ? "Castellum holds" : "Catalyst core lost"}</h2>
        <p>
          {victory
            ? `Five assault cycles survived with ${Math.round(game.coreIntegrity)}% core integrity remaining.`
            : `The defense machine failed during cycle ${game.cycle}. The trace below preserves the cause.`}
        </p>
        <div className="outcome-stats">
          <div>
            <span>Cycles</span>
            <strong>{game.cycle} / 5</strong>
          </div>
          <div>
            <span>Core</span>
            <strong>{Math.round(game.coreIntegrity)}%</strong>
          </div>
          <div>
            <span>Final kills</span>
            <strong>{game.stats.killed}</strong>
          </div>
          <div>
            <span>Peak hazard</span>
            <strong>{Math.round(game.stats.peakHazard)}</strong>
          </div>
        </div>
        <button className="enter-button" type="button" onClick={reset}>
          <RotateCcw size={17} /> Commission new base
        </button>
      </div>
    </div>
  );
};

export const NoticeToast = () => {
  const notice = useGameStore((state) => state.notice);
  const clear = useGameStore((state) => state.clearNotice);
  if (!notice) return null;
  return (
    <button
      className="notice-toast"
      type="button"
      onClick={clear}
      aria-label={`${notice}. Dismiss`}
    >
      <Biohazard size={16} /> <span>{notice}</span> <X size={14} />
    </button>
  );
};
