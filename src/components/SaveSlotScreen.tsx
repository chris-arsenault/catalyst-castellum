import { Compass, Database, FlaskConical, Play, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import { SAVE_SLOT_IDS, type SaveSlotId, type SaveSlotRecord } from "../application/saveSlots";
import { levelDefinitionFor } from "../game/queries";
import type { Translator } from "../localization/translator";
import { DebugCampaignLauncher } from "./DebugCampaignLauncher";

const DEBUG_BUILD = import.meta.env.DEV;

const slotNumber = (slotId: SaveSlotId): string => slotId.slice(-1);

const phaseLabel = (phase: SaveSlotRecord["game"]["phase"], translator: Translator): string => {
  const keys = {
    level_briefing: "ui.save.phase.briefing",
    build: "ui.save.phase.planning",
    prime: "ui.save.phase.prime",
    assault: "ui.save.phase.assault",
    round_result: "ui.save.phase.roundComplete",
    level_complete: "ui.save.phase.checkpointComplete",
    travel: "ui.save.phase.travel",
    victory: "ui.save.phase.campaignComplete",
    defeat: "ui.save.phase.coreLost",
  } as const;
  return translator.text(keys[phase]);
};

const GuidanceChoice = ({
  id,
  enabled,
  onChange,
}: {
  id: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) => {
  const { translator } = useGamePresentation();
  return (
    <div className="save-guidance-choice">
      <input
        id={`guidance-${id}`}
        type="checkbox"
        checked={enabled}
        data-testid={`new-game-guidance-${id}`}
        title={translator.text("ui.save.guidance.detail")}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <label htmlFor={`guidance-${id}`} title={translator.text("ui.save.guidance.detail")}>
        <Compass size={13} /> {translator.text("ui.save.guidance.title")}
      </label>
    </div>
  );
};

type PendingSlotAction = "overwrite" | "delete";

interface GuidanceControl {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const SlotInlineConfirmation = ({
  action,
  number,
  slotId,
  guidance,
  onCancel,
  onConfirm,
}: {
  action: PendingSlotAction;
  number: string;
  slotId: SaveSlotId;
  guidance: GuidanceControl | null;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const { translator } = useGamePresentation();
  const overwrite = action === "overwrite";
  return (
    <div
      className={`save-slot-inline-confirmation ${action}`}
      role="group"
      aria-label={translator.text("ui.save.confirm.group", {
        action: translator.text(
          overwrite ? "ui.save.confirm.overwrite.action" : "ui.save.confirm.delete.action"
        ),
        number,
      })}
      data-testid={`confirmation-${action}-${slotId}`}
    >
      <strong>
        {translator.text(
          overwrite ? "ui.save.confirm.overwrite.title" : "ui.save.confirm.delete.title"
        )}
      </strong>
      <span>
        {translator.text(
          overwrite ? "ui.save.confirm.overwrite.detail" : "ui.save.confirm.delete.detail"
        )}
      </span>
      {guidance && (
        <GuidanceChoice id={slotId} enabled={guidance.enabled} onChange={guidance.onChange} />
      )}
      <div>
        <button type="button" data-testid={`cancel-${action}-${slotId}`} onClick={onCancel}>
          {translator.text("ui.save.cancel")}
        </button>
        <button
          className="destructive"
          type="button"
          data-testid={`confirm-${action}-${slotId}`}
          onClick={onConfirm}
        >
          {translator.text(
            overwrite ? "ui.save.confirm.overwrite.action" : "ui.save.confirm.delete.action"
          )}
        </button>
      </div>
    </div>
  );
};

const EmptySlot = ({ slotId }: { slotId: SaveSlotId }) => {
  const { translator } = useGamePresentation();
  const startNewGame = useGameStore((state) => state.startNewGame);
  const [guidance, setGuidance] = useState(true);
  return (
    <article className="save-slot-card empty" data-testid={`save-slot-${slotNumber(slotId)}`}>
      <header>
        <span>
          {translator.text("ui.save.slot", { number: slotNumber(slotId).padStart(2, "0") })}
        </span>
        <strong>{translator.text("ui.save.available")}</strong>
      </header>
      <div className="save-slot-empty-mark">
        <Plus size={28} />
      </div>
      <div className="save-slot-copy">
        <h2>{translator.text("ui.save.newCampaign")}</h2>
        <p>{translator.text("ui.save.newDetail")}</p>
      </div>
      <GuidanceChoice id={slotId} enabled={guidance} onChange={setGuidance} />
      <button
        className="save-slot-primary"
        type="button"
        data-testid={`new-game-${slotId}`}
        onClick={() => startNewGame(slotId, guidance)}
      >
        {translator.text("ui.save.start")} <Play size={16} />
      </button>
    </article>
  );
};

const OccupiedSlotSummary = ({ record }: { record: SaveSlotRecord }) => {
  const { formatters, levelCopy: localizedLevelCopy, translator } = useGamePresentation();
  const level = levelDefinitionFor(record.game);
  const copy = localizedLevelCopy.level(level);
  return (
    <>
      <div className="save-slot-level">
        <span>
          {translator.text("ui.save.level", {
            number: String(level.number).padStart(2, "0"),
          })}
        </span>
        <h2>{copy.name}</h2>
        <p>{copy.lesson}</p>
      </div>
      <dl className="save-slot-telemetry">
        <div>
          <dt>{translator.text("ui.save.round")}</dt>
          <dd>
            {record.game.campaign.roundIndex + 1} / {level.rounds.length}
          </dd>
        </div>
        <div>
          <dt>{translator.text("ui.save.plantState")}</dt>
          <dd>{phaseLabel(record.game.phase, translator)}</dd>
        </div>
        <div>
          <dt>{translator.text("ui.save.core")}</dt>
          <dd>{formatters.percent(record.game.coreIntegrity / 100, 0)}</dd>
        </div>
      </dl>
      <small className="save-slot-updated">
        {translator.text("ui.save.lastSaved", { date: formatters.date(new Date(record.savedAt)) })}
      </small>
    </>
  );
};

const OccupiedSlot = ({ record }: { record: SaveSlotRecord }) => {
  const { translator } = useGamePresentation();
  const selectSaveSlot = useGameStore((state) => state.selectSaveSlot);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const deleteSaveSlot = useGameStore((state) => state.deleteSaveSlot);
  const number = slotNumber(record.id);
  const [pendingAction, setPendingAction] = useState<PendingSlotAction | null>(null);
  const [guidance, setGuidance] = useState(true);
  const confirmPendingAction = useCallback(() => {
    if (pendingAction === "overwrite") startNewGame(record.id, guidance);
    if (pendingAction === "delete") deleteSaveSlot(record.id);
  }, [deleteSaveSlot, guidance, pendingAction, record.id, startNewGame]);
  const cancelPendingAction = useCallback(() => setPendingAction(null), [setPendingAction]);

  return (
    <article className="save-slot-card occupied" data-testid={`save-slot-${number}`}>
      <header>
        <span>{translator.text("ui.save.slot", { number: number.padStart(2, "0") })}</span>
        <strong>{translator.text("ui.save.ready")}</strong>
      </header>
      <OccupiedSlotSummary record={record} />
      <button
        className="save-slot-primary"
        type="button"
        data-testid={`load-save-${record.id}`}
        onClick={() => selectSaveSlot(record.id)}
      >
        {translator.text("ui.save.load")} <Play size={16} />
      </button>
      {pendingAction ? (
        <SlotInlineConfirmation
          action={pendingAction}
          number={number}
          slotId={record.id}
          guidance={
            pendingAction === "overwrite" ? { enabled: guidance, onChange: setGuidance } : null
          }
          onCancel={cancelPendingAction}
          onConfirm={confirmPendingAction}
        />
      ) : (
        <div className="save-slot-secondary-actions">
          <button
            type="button"
            data-testid={`overwrite-${record.id}`}
            onClick={() => setPendingAction("overwrite")}
          >
            <RotateCcw size={14} /> {translator.text("ui.save.newGame")}
          </button>
          <button
            type="button"
            aria-label={translator.text("ui.save.deleteSlot", { number })}
            onClick={() => setPendingAction("delete")}
          >
            <Trash2 size={14} /> {translator.text("ui.save.delete")}
          </button>
        </div>
      )}
    </article>
  );
};

export const SaveSlotScreen = () => {
  const { translator } = useGamePresentation();
  const saveSlots = useGameStore((state) => state.saveSlots);
  return (
    <main className="save-selection" data-testid="save-selection">
      <div className="save-selection-grid" aria-hidden="true" />
      <header className="save-selection-header">
        <div className="save-selection-brand">
          <div className="save-selection-mark">
            <FlaskConical size={25} />
          </div>
          <div>
            <span>{translator.text("ui.brand.first").toUpperCase()}</span>
            <strong>{translator.text("ui.brand.second").toUpperCase()}</strong>
          </div>
        </div>
        <div className="save-selection-status">
          <Database size={15} /> {translator.text("ui.save.archive")}
        </div>
      </header>

      <section className="save-selection-content" aria-labelledby="save-selection-title">
        <div className="save-selection-heading">
          <span>{translator.text("ui.save.control")}</span>
          <h1 id="save-selection-title">{translator.text("ui.save.select")}</h1>
          <p>{translator.text("ui.save.description")}</p>
        </div>
        <div className="save-slot-grid">
          {SAVE_SLOT_IDS.map((slotId) => {
            const record = saveSlots[slotId];
            return record ? (
              <OccupiedSlot key={slotId} record={record} />
            ) : (
              <EmptySlot key={slotId} slotId={slotId} />
            );
          })}
        </div>
        {DEBUG_BUILD ? <DebugCampaignLauncher saveSlots={saveSlots} /> : null}
      </section>

      <footer className="save-selection-footer">
        <span>{translator.text("ui.save.records")}</span>
        <span>{translator.text("ui.save.resetWarning")}</span>
      </footer>
    </main>
  );
};
