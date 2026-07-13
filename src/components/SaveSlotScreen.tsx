import { Database, FlaskConical, Play, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useGameStore } from "../application/store";
import { SAVE_SLOT_IDS, type SaveSlotId, type SaveSlotRecord } from "../application/saveSlots";
import { levelDefinitionFor } from "../game/queries";

const slotNumber = (slotId: SaveSlotId): string => slotId.slice(-1);

const phaseLabel = (phase: SaveSlotRecord["game"]["phase"]): string =>
  ({
    level_briefing: "Briefing",
    build: "Planning",
    prime: "Priming",
    assault: "Assault",
    round_result: "Round complete",
    level_complete: "Checkpoint complete",
    victory: "Campaign complete",
    defeat: "Core lost",
  })[phase];

const savedAtLabel = (savedAt: number): string =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(savedAt));

type PendingSlotAction = "overwrite" | "delete";

const SlotInlineConfirmation = ({
  action,
  number,
  slotId,
  onCancel,
  onConfirm,
}: {
  action: PendingSlotAction;
  number: string;
  slotId: SaveSlotId;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <div
    className={`save-slot-inline-confirmation ${action}`}
    role="group"
    aria-label={`Confirm ${action} save slot ${number}`}
    data-testid={`confirmation-${action}-${slotId}`}
  >
    <strong>{action === "overwrite" ? "Start over in this slot?" : "Delete this save?"}</strong>
    <span>
      {action === "overwrite"
        ? "Plant, campaign, and tutorial progress will be replaced."
        : "This local record cannot be recovered."}
    </span>
    <div>
      <button type="button" data-testid={`cancel-${action}-${slotId}`} onClick={onCancel}>
        Cancel
      </button>
      <button
        className="destructive"
        type="button"
        data-testid={`confirm-${action}-${slotId}`}
        onClick={onConfirm}
      >
        {action === "overwrite" ? "Start new game" : "Delete save"}
      </button>
    </div>
  </div>
);

const EmptySlot = ({ slotId }: { slotId: SaveSlotId }) => {
  const selectSaveSlot = useGameStore((state) => state.selectSaveSlot);
  return (
    <article className="save-slot-card empty" data-testid={`save-slot-${slotNumber(slotId)}`}>
      <header>
        <span>SAVE SLOT {slotNumber(slotId).padStart(2, "0")}</span>
        <strong>EMPTY</strong>
      </header>
      <div className="save-slot-empty-mark">
        <Plus size={28} />
      </div>
      <div className="save-slot-copy">
        <h2>New campaign</h2>
        <p>Initialize a clean plant, campaign, and guided tutorial record in this slot.</p>
      </div>
      <button
        className="save-slot-primary"
        type="button"
        data-testid={`new-game-${slotId}`}
        onClick={() => selectSaveSlot(slotId)}
      >
        Start new game <Play size={16} />
      </button>
    </article>
  );
};

const OccupiedSlotSummary = ({ record }: { record: SaveSlotRecord }) => {
  const level = levelDefinitionFor(record.game);
  return (
    <>
      <div className="save-slot-level">
        <span>LEVEL {String(level.number).padStart(2, "0")}</span>
        <h2>{level.name}</h2>
        <p>{level.lesson}</p>
      </div>
      <dl className="save-slot-telemetry">
        <div>
          <dt>Round</dt>
          <dd>
            {record.game.campaign.roundIndex + 1} / {level.rounds.length}
          </dd>
        </div>
        <div>
          <dt>Plant state</dt>
          <dd>{phaseLabel(record.game.phase)}</dd>
        </div>
        <div>
          <dt>Core</dt>
          <dd>{Math.round(record.game.coreIntegrity)}%</dd>
        </div>
      </dl>
      <small className="save-slot-updated">Last saved {savedAtLabel(record.savedAt)}</small>
    </>
  );
};

const OccupiedSlot = ({ record }: { record: SaveSlotRecord }) => {
  const selectSaveSlot = useGameStore((state) => state.selectSaveSlot);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const deleteSaveSlot = useGameStore((state) => state.deleteSaveSlot);
  const number = slotNumber(record.id);
  const [pendingAction, setPendingAction] = useState<PendingSlotAction | null>(null);
  const confirmPendingAction = useCallback(() => {
    if (pendingAction === "overwrite") startNewGame(record.id);
    if (pendingAction === "delete") deleteSaveSlot(record.id);
  }, [deleteSaveSlot, pendingAction, record.id, startNewGame]);
  const cancelPendingAction = useCallback(() => setPendingAction(null), [setPendingAction]);

  return (
    <article className="save-slot-card occupied" data-testid={`save-slot-${number}`}>
      <header>
        <span>SAVE SLOT {number.padStart(2, "0")}</span>
        <strong>READY</strong>
      </header>
      <OccupiedSlotSummary record={record} />
      <button
        className="save-slot-primary"
        type="button"
        data-testid={`load-save-${record.id}`}
        onClick={() => selectSaveSlot(record.id)}
      >
        Load save <Play size={16} />
      </button>
      {pendingAction ? (
        <SlotInlineConfirmation
          action={pendingAction}
          number={number}
          slotId={record.id}
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
            <RotateCcw size={14} /> New game
          </button>
          <button
            type="button"
            aria-label={`Delete save slot ${number}`}
            onClick={() => setPendingAction("delete")}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </article>
  );
};

export const SaveSlotScreen = () => {
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
            <span>CATALYST</span>
            <strong>CASTELLUM</strong>
          </div>
        </div>
        <div className="save-selection-status">
          <Database size={15} /> LOCAL OPERATIONS ARCHIVE
        </div>
      </header>

      <section className="save-selection-content" aria-labelledby="save-selection-title">
        <div className="save-selection-heading">
          <span>CAMPAIGN CONTROL</span>
          <h1 id="save-selection-title">Select a save slot</h1>
          <p>
            Each slot owns its plant state and tutorial progress. Loading the page always returns
            here before a simulation is initialized.
          </p>
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
      </section>

      <footer className="save-selection-footer">
        <span>THREE ISOLATED LOCAL RECORDS</span>
        <span>SELECTING NEW GAME PERFORMS A COMPLETE STATE RESET</span>
      </footer>
    </main>
  );
};
