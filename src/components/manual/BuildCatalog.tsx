import { BookOpen, Check, Hammer, LockKeyhole } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { EquipmentBuildTarget } from "../../application/storeTypes";
import { useGameStore } from "../../application/store";
import { useGamePresentation } from "../../application/presentationContext";
import { EQUIPMENT_DEFINITIONS, ROOM_DEFINITIONS } from "../../presentation/defaultGame";
import {
  EQUIPMENT_IDS,
  type CommandDecision,
  type EquipmentId,
  type EquipmentSocketId,
  type GameCommand,
} from "../../game/types";
import type { EquipmentCategory } from "../../presentation/manualContent";
import { EquipmentImage } from "./EquipmentImage";
import { equipmentCopy } from "../../presentation/entityCopy";

type CategoryFilter = "all" | EquipmentCategory;

const CATEGORIES: readonly CategoryFilter[] = [
  "all",
  "atmosphere",
  "contact",
  "thermal",
  "process",
];

const installCommand = (
  target: EquipmentBuildTarget,
  equipmentId: EquipmentId
): Extract<GameCommand, { type: "install_equipment" }> => ({
  type: "install_equipment",
  roomId: target.roomId,
  socketId: target.socketId,
  equipmentId,
});

const socketCopyKey = (socketId: EquipmentSocketId) =>
  socketId === "socket_a"
    ? ("ui.manual.build.socketA" as const)
    : ("ui.manual.build.socketB" as const);

const BuildContext = ({ target }: { target: EquipmentBuildTarget | null }) => {
  const { translator } = useGamePresentation();
  const socketName = target ? translator.text(socketCopyKey(target.socketId)) : "";
  return (
    <header className="manual-context-bar">
      <div>
        <span>{translator.text("ui.manual.build.order")}</span>
        <strong>
          {target
            ? translator.text("ui.manual.build.target", {
                room: ROOM_DEFINITIONS[target.roomId].code,
                socket: socketName,
              })
            : translator.text("ui.manual.build.preview")}
        </strong>
      </div>
      <p>
        {target
          ? translator.text("ui.manual.build.targetDetail")
          : translator.text("ui.manual.build.previewDetail")}
      </p>
    </header>
  );
};

const CategoryTabs = ({
  category,
  onSelect,
}: {
  category: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
}) => {
  const { manual, translator } = useGamePresentation();
  return (
    <div
      className="manual-category-tabs"
      aria-label={translator.text("ui.manual.build.categories")}
    >
      {CATEGORIES.map((categoryId) => (
        <button
          key={categoryId}
          type="button"
          className={category === categoryId ? "active" : ""}
          onClick={() => onSelect(categoryId)}
        >
          {categoryId === "all"
            ? translator.text("ui.manual.build.all")
            : manual.equipmentCategoryLabels[categoryId]}
        </button>
      ))}
    </div>
  );
};

const EquipmentCatalogList = ({
  equipmentIds,
  onSelect,
  selectedEquipmentId,
  target,
}: {
  equipmentIds: readonly EquipmentId[];
  onSelect: (equipmentId: EquipmentId) => void;
  selectedEquipmentId: EquipmentId;
  target: EquipmentBuildTarget | null;
}) => {
  const { manual, selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  return (
    <div className="manual-build-list" aria-label={translator.text("ui.manual.build.catalog")}>
      {equipmentIds.map((equipmentId) => {
        const definition = EQUIPMENT_DEFINITIONS[equipmentId];
        const decision = target
          ? selectors.commandDecision(game, installCommand(target, equipmentId))
          : null;
        return (
          <button
            key={equipmentId}
            type="button"
            data-testid={`manual-equipment-choice-${equipmentId}`}
            className={selectedEquipmentId === equipmentId ? "selected" : ""}
            aria-pressed={selectedEquipmentId === equipmentId}
            onClick={() => onSelect(equipmentId)}
          >
            <EquipmentImage equipmentId={equipmentId} compact />
            <span>
              <strong>{equipmentCopy(definition, translator).name}</strong>
              <small>
                {manual.equipmentCategoryLabels[manual.equipmentManual[equipmentId].category]}
              </small>
            </span>
            <em className={decision?.allowed ? "available" : ""}>
              {decision?.allowed ? <Check size={12} /> : <LockKeyhole size={12} />}
              {definition.buildCost} M
            </em>
          </button>
        );
      })}
    </div>
  );
};

const BuildDetail = ({
  decision,
  equipmentId,
  onInstall,
  onOpenEntry,
  target,
}: {
  decision: CommandDecision | null;
  equipmentId: EquipmentId;
  onInstall: () => void;
  onOpenEntry: (equipmentId: EquipmentId) => void;
  target: EquipmentBuildTarget | null;
}) => {
  const {
    commandCopy,
    equipmentGradeEffect: gradeEffect,
    manual,
    translator,
  } = useGamePresentation();
  const definition = EQUIPMENT_DEFINITIONS[equipmentId];
  const entry = manual.equipmentManual[equipmentId];
  const testId = target ? `install-${target.roomId}-${target.socketId}-${equipmentId}` : undefined;
  return (
    <article className="manual-build-detail">
      <EquipmentImage equipmentId={equipmentId} compact={false} />
      <div className="manual-build-copy">
        <span className="manual-entry-code">{entry.designation}</span>
        <h2>{equipmentCopy(definition, translator).name}</h2>
        <p>{equipmentCopy(definition, translator).description}</p>
        <dl className="manual-build-specs">
          <div>
            <dt>{translator.text("ui.manual.build.gradeEffect")}</dt>
            <dd>{gradeEffect(definition.grades[0])}</dd>
          </div>
          <div>
            <dt>{translator.text("ui.manual.build.volume")}</dt>
            <dd>
              {translator.text("ui.manual.build.volumeValue", {
                volume: definition.grades[0].occupiedVolume,
              })}
            </dd>
          </div>
        </dl>
        <div className="manual-build-actions">
          <button
            type="button"
            className="manual-entry-link"
            onClick={() => onOpenEntry(equipmentId)}
          >
            <BookOpen size={15} /> {translator.text("ui.manual.build.entry")}
          </button>
          <button
            type="button"
            className="manual-build-button"
            disabled={!decision?.allowed}
            title={decision ? (commandCopy(decision) ?? undefined) : undefined}
            data-testid={testId}
            onClick={onInstall}
          >
            <Hammer size={16} />{" "}
            {translator.text("ui.manual.build.action", { cost: definition.buildCost })}
          </button>
        </div>
        {decision && !decision.allowed && (
          <small className="manual-build-reason">{commandCopy(decision)}</small>
        )}
      </div>
    </article>
  );
};

export const BuildCatalog = ({
  selectedEquipmentId,
  onOpenEntry,
  onSelectEquipment,
}: {
  selectedEquipmentId: EquipmentId;
  onOpenEntry: (equipmentId: EquipmentId) => void;
  onSelectEquipment: (equipmentId: EquipmentId) => void;
}) => {
  const { manual, selectors } = useGamePresentation();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const game = useGameStore((state) => state.game);
  const target = useGameStore((state) => state.equipmentBuildTarget);
  const dispatch = useGameStore((state) => state.dispatch);
  const closeManual = useGameStore((state) => state.closeManual);
  const visibleIds = useMemo(
    () =>
      EQUIPMENT_IDS.filter(
        (equipmentId) =>
          category === "all" || manual.equipmentManual[equipmentId].category === category
      ),
    [category, manual.equipmentManual]
  );
  const decision = target
    ? selectors.commandDecision(game, installCommand(target, selectedEquipmentId))
    : null;

  useEffect(() => {
    if (!target) return;
    const firstAvailable = EQUIPMENT_IDS.find(
      (equipmentId) => selectors.commandDecision(game, installCommand(target, equipmentId)).allowed
    );
    if (firstAvailable) onSelectEquipment(firstAvailable);
  }, [game, onSelectEquipment, selectors, target]);

  const install = useCallback(() => {
    if (!target) return;
    if (dispatch(installCommand(target, selectedEquipmentId))) closeManual();
  }, [closeManual, dispatch, selectedEquipmentId, target]);

  return (
    <section className="manual-page manual-build-page" data-testid="manual-build-page">
      <BuildContext target={target} />
      <CategoryTabs category={category} onSelect={setCategory} />
      <div className="manual-catalog-layout">
        <EquipmentCatalogList
          equipmentIds={visibleIds}
          onSelect={onSelectEquipment}
          selectedEquipmentId={selectedEquipmentId}
          target={target}
        />
        <BuildDetail
          decision={decision}
          equipmentId={selectedEquipmentId}
          onInstall={install}
          onOpenEntry={onOpenEntry}
          target={target}
        />
      </div>
    </section>
  );
};
