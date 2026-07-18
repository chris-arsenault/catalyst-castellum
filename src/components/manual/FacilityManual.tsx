import { LogOut, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useGameStore } from "../../application/store";
import { useGamePresentation } from "../../application/presentationContext";
import type { ManualSection } from "../../application/storeTypes";
import { LEVEL_DEFINITIONS } from "../../presentation/defaultGame";
import type { EnemyType, EquipmentId, ReactionId } from "../../game/types";
import { guideDefinitionFor } from "../../tutorial/guideModel";
import { BuildCatalog } from "./BuildCatalog";
import { Encyclopedia, type EncyclopediaKind } from "./Encyclopedia";
import { ManualNav } from "./ManualNav";
import { OperationsManual } from "./OperationsManual";
import { ThreatCatalog } from "./ThreatCatalog";
import { tutorialText } from "../../tutorial/tutorialCopy";

const ManualPage = ({
  encyclopediaKind,
  onOpenEquipment,
  onOpenReaction,
  onSelectEnemy,
  onSelectEncyclopediaKind,
  onSelectEquipment,
  section,
  selectedEnemyType,
  selectedEquipmentId,
  selectedReactionId,
}: {
  encyclopediaKind: EncyclopediaKind;
  onOpenEquipment: (equipmentId: EquipmentId) => void;
  onOpenReaction: (reactionId: ReactionId) => void;
  onSelectEnemy: (enemyType: EnemyType) => void;
  onSelectEncyclopediaKind: (kind: EncyclopediaKind) => void;
  onSelectEquipment: (equipmentId: EquipmentId) => void;
  section: ManualSection;
  selectedEnemyType: EnemyType;
  selectedEquipmentId: EquipmentId;
  selectedReactionId: ReactionId;
}) => {
  if (section === "operations") return <OperationsManual />;
  if (section === "build")
    return (
      <BuildCatalog
        selectedEquipmentId={selectedEquipmentId}
        onOpenEntry={onOpenEquipment}
        onSelectEquipment={onSelectEquipment}
      />
    );
  if (section === "threats") return <ThreatCatalog />;
  return (
    <Encyclopedia
      kind={encyclopediaKind}
      selectedEnemyType={selectedEnemyType}
      selectedEquipmentId={selectedEquipmentId}
      selectedReactionId={selectedReactionId}
      onSelectEnemy={onSelectEnemy}
      onSelectEquipment={onOpenEquipment}
      onSelectKind={onSelectEncyclopediaKind}
      onSelectReaction={onOpenReaction}
    />
  );
};

const ManualShellHeader = () => {
  const { levelCopy: localizedLevelCopy, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const buildTarget = useGameStore((state) => state.equipmentBuildTarget);
  const closeManual = useGameStore((state) => state.closeManual);
  const level = LEVEL_DEFINITIONS[game.campaign.levelId];
  const copy = localizedLevelCopy.level(level);
  return (
    <header className="manual-shell-header">
      <div className="manual-title-block">
        <span>{translator.text("ui.manual.archive")}</span>
        <h1 id="facility-manual-title">{translator.text("ui.manual.title")}</h1>
      </div>
      <div className="manual-record-context">
        <small>{translator.text("ui.manual.currentRecord")}</small>
        <strong>
          {level.number.toString().padStart(2, "0")} · {copy.name}
        </strong>
        {buildTarget && <em>{translator.text("ui.manual.buildTarget")}</em>}
      </div>
      <button
        className="modal-close manual-close"
        type="button"
        aria-label={translator.text("ui.manual.close")}
        onClick={closeManual}
      >
        <X size={18} />
      </button>
    </header>
  );
};

const ManualShellFooter = () => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const closeManual = useGameStore((state) => state.closeManual);
  const restartTutorialGuide = useGameStore((state) => state.restartTutorialGuide);
  const returnToMainMenu = useGameStore((state) => state.returnToMainMenu);
  const guide = guideDefinitionFor(game);
  return (
    <footer className="manual-shell-footer">
      <div>
        {guide && (
          <button type="button" data-testid="replay-guided-lesson" onClick={restartTutorialGuide}>
            <RotateCcw size={14} />{" "}
            {translator.text("ui.manual.replay", {
              guide: tutorialText(translator, guide.label),
            })}
          </button>
        )}
      </div>
      <button type="button" onClick={returnToMainMenu}>
        <LogOut size={14} /> {translator.text("ui.topbar.saveSlots")}
      </button>
      <button type="button" className="manual-return-button" onClick={closeManual}>
        {translator.text("ui.manual.returnControls")}
      </button>
    </footer>
  );
};

export const FacilityManual = () => {
  const [selectedEnemyType, setSelectedEnemyType] = useState<EnemyType>("deckmouth");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<EquipmentId>("gas_agitator");
  const [selectedReactionId, setSelectedReactionId] = useState<ReactionId>(
    "hydrogen_oxygen_combustion"
  );
  const [encyclopediaKind, setEncyclopediaKind] = useState<EncyclopediaKind>("equipment");
  const show = useGameStore((state) => state.showHelp);
  const section = useGameStore((state) => state.manualSection);
  const closeManual = useGameStore((state) => state.closeManual);
  const setSection = useGameStore((state) => state.setManualSection);

  const selectEquipment = useCallback((equipmentId: EquipmentId) => {
    setSelectedEquipmentId(equipmentId);
  }, []);
  const openEquipment = useCallback(
    (equipmentId: EquipmentId) => {
      setSelectedEquipmentId(equipmentId);
      setEncyclopediaKind("equipment");
      setSection("encyclopedia");
    },
    [setSection]
  );
  const openReaction = useCallback(
    (reactionId: ReactionId) => {
      setSelectedReactionId(reactionId);
      setEncyclopediaKind("reactions");
      setSection("encyclopedia");
    },
    [setSection]
  );

  useEffect(() => {
    if (!show) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeManual();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeManual, show]);

  if (!show) return null;
  return (
    <div className="modal-backdrop manual-backdrop">
      <section
        className="facility-manual"
        role="dialog"
        aria-modal="true"
        aria-labelledby="facility-manual-title"
        data-testid="facility-manual"
      >
        <ManualShellHeader />
        <ManualNav active={section} onSelect={setSection} />
        <div className="manual-page-frame">
          <ManualPage
            encyclopediaKind={encyclopediaKind}
            onOpenEquipment={openEquipment}
            onOpenReaction={openReaction}
            onSelectEnemy={setSelectedEnemyType}
            onSelectEncyclopediaKind={setEncyclopediaKind}
            onSelectEquipment={selectEquipment}
            section={section}
            selectedEnemyType={selectedEnemyType}
            selectedEquipmentId={selectedEquipmentId}
            selectedReactionId={selectedReactionId}
          />
        </div>
        <ManualShellFooter />
      </section>
    </div>
  );
};
