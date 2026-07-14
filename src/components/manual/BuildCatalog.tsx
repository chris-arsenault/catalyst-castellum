import { BookOpen, Check, Hammer, LockKeyhole } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { EquipmentBuildTarget } from "../../application/storeTypes";
import { useGameStore } from "../../application/store";
import { EQUIPMENT_DEFINITIONS, ROOM_DEFINITIONS } from "../../presentation/defaultGame";
import { EQUIPMENT_IDS, type EquipmentId, type GameCommand } from "../../game/types";
import { commandDecision } from "../../presentation/selectors";
import { commandRejectionCopy } from "../../presentation/commandCopy";
import { equipmentGradeEffect } from "../../presentation/equipmentCopy";
import {
  EQUIPMENT_CATEGORY_LABELS,
  EQUIPMENT_MANUAL,
  type EquipmentCategory,
} from "../../presentation/manualContent";
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

const socketName = (target: EquipmentBuildTarget): string =>
  target.socketId === "socket_a" ? "Socket A" : "Socket B";

const BuildContext = ({ target }: { target: EquipmentBuildTarget | null }) => (
  <header className="manual-context-bar">
    <div>
      <span>Construction order</span>
      <strong>
        {target
          ? `${ROOM_DEFINITIONS[target.roomId].code} · ${socketName(target)}`
          : "Catalog preview"}
      </strong>
    </div>
    <p>
      {target
        ? "Choose one machine for this universal equipment socket."
        : "Select an open socket in a room to issue a construction order."}
    </p>
  </header>
);

const CategoryTabs = ({
  category,
  onSelect,
}: {
  category: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
}) => (
  <div className="manual-category-tabs" aria-label="Equipment categories">
    {CATEGORIES.map((categoryId) => (
      <button
        key={categoryId}
        type="button"
        className={category === categoryId ? "active" : ""}
        onClick={() => onSelect(categoryId)}
      >
        {categoryId === "all" ? "All equipment" : EQUIPMENT_CATEGORY_LABELS[categoryId]}
      </button>
    ))}
  </div>
);

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
  const game = useGameStore((state) => state.game);
  return (
    <div className="manual-build-list" aria-label="Equipment catalog">
      {equipmentIds.map((equipmentId) => {
        const definition = EQUIPMENT_DEFINITIONS[equipmentId];
        const decision = target ? commandDecision(game, installCommand(target, equipmentId)) : null;
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
              <strong>{equipmentCopy(definition).name}</strong>
              <small>{EQUIPMENT_CATEGORY_LABELS[EQUIPMENT_MANUAL[equipmentId].category]}</small>
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
  decision: ReturnType<typeof commandDecision> | null;
  equipmentId: EquipmentId;
  onInstall: () => void;
  onOpenEntry: (equipmentId: EquipmentId) => void;
  target: EquipmentBuildTarget | null;
}) => {
  const definition = EQUIPMENT_DEFINITIONS[equipmentId];
  const manual = EQUIPMENT_MANUAL[equipmentId];
  const testId = target ? `install-${target.roomId}-${target.socketId}-${equipmentId}` : undefined;
  return (
    <article className="manual-build-detail">
      <EquipmentImage equipmentId={equipmentId} compact={false} />
      <div className="manual-build-copy">
        <span className="manual-entry-code">{manual.designation}</span>
        <h2>{equipmentCopy(definition).name}</h2>
        <p>{equipmentCopy(definition).description}</p>
        <dl className="manual-build-specs">
          <div>
            <dt>Grade I effect</dt>
            <dd>{equipmentGradeEffect(definition.grades[0])}</dd>
          </div>
          <div>
            <dt>Installed volume</dt>
            <dd>{definition.grades[0].occupiedVolume} room units</dd>
          </div>
        </dl>
        <div className="manual-build-actions">
          <button
            type="button"
            className="manual-entry-link"
            onClick={() => onOpenEntry(equipmentId)}
          >
            <BookOpen size={15} /> Encyclopedia entry
          </button>
          <button
            type="button"
            className="manual-build-button"
            disabled={!decision?.allowed}
            title={decision ? (commandRejectionCopy(decision) ?? undefined) : undefined}
            data-testid={testId}
            onClick={onInstall}
          >
            <Hammer size={16} /> Build · {definition.buildCost} M
          </button>
        </div>
        {decision && !decision.allowed && (
          <small className="manual-build-reason">{commandRejectionCopy(decision)}</small>
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
  const [category, setCategory] = useState<CategoryFilter>("all");
  const game = useGameStore((state) => state.game);
  const target = useGameStore((state) => state.equipmentBuildTarget);
  const dispatch = useGameStore((state) => state.dispatch);
  const closeManual = useGameStore((state) => state.closeManual);
  const visibleIds = useMemo(
    () =>
      EQUIPMENT_IDS.filter(
        (equipmentId) => category === "all" || EQUIPMENT_MANUAL[equipmentId].category === category
      ),
    [category]
  );
  const decision = target
    ? commandDecision(game, installCommand(target, selectedEquipmentId))
    : null;

  useEffect(() => {
    if (!target) return;
    const firstAvailable = EQUIPMENT_IDS.find(
      (equipmentId) => commandDecision(game, installCommand(target, equipmentId)).allowed
    );
    if (firstAvailable) onSelectEquipment(firstAvailable);
  }, [game, onSelectEquipment, target]);

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
