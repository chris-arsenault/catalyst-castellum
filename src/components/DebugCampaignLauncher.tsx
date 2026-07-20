import { Bug, Play } from "lucide-react";
import { useCallback, useState } from "react";
import { useGamePresentation } from "../application/presentationContext";
import { SAVE_SLOT_IDS, type SaveSlotCatalog, type SaveSlotId } from "../application/saveSlots";
import { useGameStore } from "../application/store";
import { LEVEL_IDS, type LevelId } from "../game/types";
import { GUIDE_REGISTRATIONS } from "../tutorial/guideModel";

const slotNumber = (slotId: SaveSlotId): string => slotId.slice(-1);

const DebugSaveSlotSelect = ({
  saveSlots,
  value,
  onChange,
}: {
  saveSlots: SaveSlotCatalog;
  value: SaveSlotId;
  onChange: (slotId: SaveSlotId) => void;
}) => {
  const { translator } = useGamePresentation();
  return (
    <label>
      <span>{translator.text("ui.save.debug.slot")}</span>
      <select
        value={value}
        data-testid="debug-start-slot"
        onChange={(event) => onChange(event.target.value as SaveSlotId)}
      >
        {SAVE_SLOT_IDS.map((slotId) => {
          const record = saveSlots[slotId];
          return (
            <option key={slotId} value={slotId}>
              {record
                ? translator.text("ui.save.debug.slotOccupied", {
                    number: slotNumber(slotId).padStart(2, "0"),
                    level: record.game.campaign.levelIndex + 1,
                  })
                : translator.text("ui.save.debug.slotAvailable", {
                    number: slotNumber(slotId).padStart(2, "0"),
                  })}
            </option>
          );
        })}
      </select>
    </label>
  );
};

const DebugLevelSelect = ({
  value,
  onChange,
}: {
  value: LevelId;
  onChange: (id: LevelId) => void;
}) => {
  const { levelCopy, translator } = useGamePresentation();
  return (
    <label>
      <span>{translator.text("ui.save.debug.site")}</span>
      <select
        value={value}
        data-testid="debug-start-level"
        onChange={(event) => onChange(event.target.value as LevelId)}
      >
        {LEVEL_IDS.map((levelId, index) => (
          <option key={levelId} value={levelId}>
            {translator.text("ui.save.debug.siteOption", {
              level: index + 1,
              name: levelCopy.level({ id: levelId }).name,
              kind: translator.text(
                GUIDE_REGISTRATIONS[levelId]
                  ? "ui.save.debug.siteKind.guided"
                  : "ui.save.debug.siteKind.defense"
              ),
            })}
          </option>
        ))}
      </select>
    </label>
  );
};

const DebugLaunchConfirmation = ({
  slotId,
  levelId,
  onCancel,
  onConfirm,
}: {
  slotId: SaveSlotId;
  levelId: LevelId;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const { levelCopy, translator } = useGamePresentation();
  return (
    <div
      className="save-slot-inline-confirmation overwrite"
      role="group"
      aria-label={translator.text("ui.save.debug.confirm.group", {
        number: slotNumber(slotId),
      })}
    >
      <strong>
        {translator.text("ui.save.debug.confirm.title", { number: slotNumber(slotId) })}
      </strong>
      <span>
        {translator.text("ui.save.debug.confirm.detail", {
          level: LEVEL_IDS.indexOf(levelId) + 1,
          name: levelCopy.level({ id: levelId }).name,
        })}
      </span>
      <div>
        <button type="button" onClick={onCancel}>
          {translator.text("ui.save.cancel")}
        </button>
        <button
          className="destructive"
          type="button"
          data-testid="confirm-debug-start"
          onClick={onConfirm}
        >
          {translator.text("ui.save.debug.confirm.action")}
        </button>
      </div>
    </div>
  );
};

export const DebugCampaignLauncher = ({ saveSlots }: { saveSlots: SaveSlotCatalog }) => {
  const { translator } = useGamePresentation();
  const startNewGameAtLevel = useGameStore((state) => state.startNewGameAtLevel);
  const [slotId, setSlotId] = useState<SaveSlotId>(SAVE_SLOT_IDS[0]);
  const [levelId, setLevelId] = useState<LevelId>(LEVEL_IDS[0]);
  const [confirmingOverwrite, setConfirmingOverwrite] = useState(false);
  const launch = useCallback(
    () => startNewGameAtLevel(slotId, levelId),
    [levelId, slotId, startNewGameAtLevel]
  );
  const requestLaunch = useCallback(() => {
    if (saveSlots[slotId]) setConfirmingOverwrite(true);
    else launch();
  }, [launch, saveSlots, slotId]);
  const selectSlot = useCallback((id: SaveSlotId) => {
    setSlotId(id);
    setConfirmingOverwrite(false);
  }, []);
  const selectLevel = useCallback((id: LevelId) => {
    setLevelId(id);
    setConfirmingOverwrite(false);
  }, []);
  const cancelOverwrite = useCallback(() => setConfirmingOverwrite(false), []);

  return (
    <aside className="debug-campaign-launcher" aria-labelledby="debug-campaign-launcher-title">
      <div className="debug-campaign-heading">
        <Bug size={18} />
        <div>
          <strong id="debug-campaign-launcher-title">
            {translator.text("ui.save.debug.title")}
          </strong>
          <span>{translator.text("ui.save.debug.detail")}</span>
        </div>
      </div>
      <DebugSaveSlotSelect saveSlots={saveSlots} value={slotId} onChange={selectSlot} />
      <DebugLevelSelect value={levelId} onChange={selectLevel} />
      <div className="debug-campaign-action">
        {confirmingOverwrite ? (
          <DebugLaunchConfirmation
            slotId={slotId}
            levelId={levelId}
            onCancel={cancelOverwrite}
            onConfirm={launch}
          />
        ) : (
          <button type="button" data-testid="debug-start-game" onClick={requestLaunch}>
            {translator.text("ui.save.debug.start")} <Play size={15} />
          </button>
        )}
      </div>
    </aside>
  );
};
