import { ArrowRight, Atom, Cog, FlaskConical } from "lucide-react";
import {
  ENEMY_DEFINITIONS,
  EQUIPMENT_DEFINITIONS,
  REACTION_DEFINITIONS,
} from "../../presentation/defaultGame";
import {
  ENEMY_TYPES,
  EQUIPMENT_IDS,
  REACTION_IDS,
  type EnemyType,
  type EquipmentId,
  type ReactionId,
} from "../../game/types";
import { equipmentForReaction } from "../../presentation/manualContent";
import { EquipmentImage } from "./EquipmentImage";
import { SpeciesSide } from "./SpeciesSide";
import {
  enemyCopy,
  equipmentCopy,
  reactionClassification,
  reactionCopy,
} from "../../presentation/entityCopy";
import { useGamePresentation } from "../../application/presentationContext";
import { EnemyGlyph } from "./EnemyGlyph";

export type EncyclopediaKind = "equipment" | "reactions" | "bestiary";

const EquipmentEntry = ({
  equipmentId,
  onOpenReaction,
}: {
  equipmentId: EquipmentId;
  onOpenReaction: (reactionId: ReactionId) => void;
}) => {
  const { equipmentGradeEffect: gradeEffect, manual, translator } = useGamePresentation();
  const definition = EQUIPMENT_DEFINITIONS[equipmentId];
  const copy = equipmentCopy(definition, translator);
  const entry = manual.equipmentManual[equipmentId];
  return (
    <article className="manual-encyclopedia-entry" data-testid={`equipment-entry-${equipmentId}`}>
      <div className="manual-entry-hero">
        <EquipmentImage equipmentId={equipmentId} compact={false} />
        <div>
          <span className="manual-entry-code">
            {manual.equipmentCategoryLabels[entry.category]} · {entry.designation}
          </span>
          <h2>{copy.name}</h2>
          <p>{copy.description}</p>
        </div>
      </div>
      <blockquote>{entry.flavor}</blockquote>
      <section className="manual-entry-section">
        <h3>{translator.text("ui.manual.encyclopedia.effect")}</h3>
        <ul>
          {entry.operationalNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
      <section className="manual-entry-section">
        <h3>{translator.text("ui.manual.encyclopedia.grades")}</h3>
        <div className="manual-grade-table">
          {definition.grades.map((grade, index) => (
            <div key={grade.level}>
              <span>{translator.text("ui.manual.encyclopedia.grade", { grade: grade.level })}</span>
              <strong>{gradeEffect(grade)}</strong>
              <small>
                {translator.text("ui.manual.encyclopedia.gradeDetail", {
                  volume: grade.occupiedVolume,
                  cost: index === 0 ? definition.buildCost : definition.upgradeCosts[index - 1]!,
                })}
              </small>
            </div>
          ))}
        </div>
      </section>
      <section className="manual-entry-section">
        <h3>{translator.text("ui.manual.encyclopedia.reactions")}</h3>
        <div className="manual-cross-links">
          {entry.reactionIds.map((reactionId) => {
            const reaction = REACTION_DEFINITIONS[reactionId];
            return (
              <button key={reactionId} type="button" onClick={() => onOpenReaction(reactionId)}>
                <FlaskConical size={14} />
                <span>
                  <small>{reaction.code}</small>
                  <strong>{reactionCopy(reaction, translator).name}</strong>
                </span>
                <ArrowRight size={13} />
              </button>
            );
          })}
        </div>
      </section>
    </article>
  );
};

const ReactionEquipmentLinks = ({
  equipmentIds,
  onOpenEquipment,
}: {
  equipmentIds: readonly EquipmentId[];
  onOpenEquipment: (equipmentId: EquipmentId) => void;
}) => {
  const { manual, translator } = useGamePresentation();
  return (
    <section className="manual-entry-section">
      <h3>{translator.text("ui.manual.encyclopedia.equipmentLinks")}</h3>
      <div className="manual-cross-links">
        {equipmentIds.map((equipmentId) => {
          const equipment = EQUIPMENT_DEFINITIONS[equipmentId];
          return (
            <button key={equipmentId} type="button" onClick={() => onOpenEquipment(equipmentId)}>
              <Cog size={14} />
              <span>
                <small>{manual.equipmentManual[equipmentId].designation}</small>
                <strong>{equipmentCopy(equipment, translator).name}</strong>
              </span>
              <ArrowRight size={13} />
            </button>
          );
        })}
      </div>
    </section>
  );
};

const ReactionEntry = ({
  onOpenEquipment,
  reactionId,
}: {
  onOpenEquipment: (equipmentId: EquipmentId) => void;
  reactionId: ReactionId;
}) => {
  const { manual, reactionMechanics: localizedMechanics, translator } = useGamePresentation();
  const reaction = REACTION_DEFINITIONS[reactionId];
  const entry = manual.reactionManual[reactionId];
  const equipmentIds = equipmentForReaction(reactionId);
  return (
    <article className="manual-encyclopedia-entry" data-testid={`reaction-entry-${reactionId}`}>
      <header className="manual-reaction-heading">
        <div className="manual-reaction-mark">
          <Atom size={25} />
          <span>{reaction.code}</span>
        </div>
        <div>
          <span className="manual-entry-code">
            {translator.text("ui.manual.encyclopedia.process", {
              kind: translator.text(
                reaction.kind === "chemical"
                  ? "ui.manual.encyclopedia.kind.chemical"
                  : "ui.manual.encyclopedia.kind.physical"
              ),
            })}
            {" · "}
            {reactionClassification(reaction, translator)}
          </span>
          <h2>{reactionCopy(reaction, translator).name}</h2>
          <strong>{reaction.equation}</strong>
        </div>
      </header>
      <blockquote>{entry.flavor}</blockquote>
      <section className="manual-entry-section">
        <h3>{translator.text("ui.manual.encyclopedia.inventory")}</h3>
        <div className="manual-reaction-inventory">
          <SpeciesSide
            label={translator.text("ui.manual.encyclopedia.consumes")}
            participants={reaction.reactants}
          />
          <ArrowRight size={20} />
          <SpeciesSide
            label={translator.text("ui.manual.encyclopedia.produces")}
            participants={reaction.products}
          />
        </div>
      </section>
      <section className="manual-entry-section">
        <h3>{translator.text("ui.manual.encyclopedia.doctrine")}</h3>
        <p>{entry.doctrine}</p>
        <ul>
          {localizedMechanics(reaction).map((mechanic) => (
            <li key={mechanic}>{mechanic}</li>
          ))}
        </ul>
      </section>
      {equipmentIds.length > 0 ? (
        <ReactionEquipmentLinks equipmentIds={equipmentIds} onOpenEquipment={onOpenEquipment} />
      ) : null}
    </article>
  );
};

const BestiaryEntry = ({ enemyType }: { enemyType: EnemyType }) => {
  const { manual, translator } = useGamePresentation();
  const definition = ENEMY_DEFINITIONS[enemyType];
  const copy = enemyCopy(definition, translator);
  const entry = manual.enemyBestiary[enemyType];
  return (
    <article
      className="manual-encyclopedia-entry manual-bestiary-entry"
      data-testid={`bestiary-entry-${enemyType}`}
    >
      <header className="manual-bestiary-heading" style={{ "--enemy": definition.color }}>
        <div className="manual-bestiary-mark">
          <EnemyGlyph appearance={definition.presentation.appearance} size={58} />
        </div>
        <div>
          <span className="manual-entry-code">
            {translator.text("ui.manual.encyclopedia.bestiary.record")} · {entry.classification}
          </span>
          <h2>{copy.name}</h2>
          <p>{copy.description}</p>
        </div>
      </header>
      <dl className="manual-bestiary-facts">
        <div>
          <dt>{translator.text("ui.manual.encyclopedia.bestiary.classification")}</dt>
          <dd>{entry.classification}</dd>
        </div>
        <div>
          <dt>{translator.text("ui.manual.encyclopedia.bestiary.habitat")}</dt>
          <dd>{entry.habitat}</dd>
        </div>
      </dl>
      <section className="manual-entry-section">
        <h3>{translator.text("ui.manual.encyclopedia.bestiary.fieldRecord")}</h3>
        <p>{entry.blurb}</p>
      </section>
      <blockquote>{entry.fieldNote}</blockquote>
    </article>
  );
};

interface EncyclopediaSelection {
  kind: EncyclopediaKind;
  selectedEnemyType: EnemyType;
  selectedEquipmentId: EquipmentId;
  selectedReactionId: ReactionId;
  onSelectEnemy: (enemyType: EnemyType) => void;
  onSelectEquipment: (equipmentId: EquipmentId) => void;
  onSelectKind: (kind: EncyclopediaKind) => void;
  onSelectReaction: (reactionId: ReactionId) => void;
}

const EncyclopediaEntries = ({
  kind,
  selectedEnemyType,
  selectedEquipmentId,
  selectedReactionId,
  onSelectEnemy,
  onSelectEquipment,
  onSelectReaction,
}: Omit<EncyclopediaSelection, "onSelectKind">) => {
  const { manual, translator } = useGamePresentation();
  if (kind === "equipment") {
    return EQUIPMENT_IDS.map((equipmentId) => (
      <button
        key={equipmentId}
        type="button"
        className={selectedEquipmentId === equipmentId ? "selected" : ""}
        onClick={() => onSelectEquipment(equipmentId)}
      >
        <small>
          {manual.equipmentCategoryLabels[manual.equipmentManual[equipmentId].category]}
        </small>
        <strong>{equipmentCopy(EQUIPMENT_DEFINITIONS[equipmentId], translator).name}</strong>
      </button>
    ));
  }
  if (kind === "reactions") {
    return REACTION_IDS.map((reactionId) => (
      <button
        key={reactionId}
        type="button"
        className={selectedReactionId === reactionId ? "selected" : ""}
        onClick={() => onSelectReaction(reactionId)}
      >
        <small>{REACTION_DEFINITIONS[reactionId].code}</small>
        <strong>{reactionCopy(REACTION_DEFINITIONS[reactionId], translator).name}</strong>
      </button>
    ));
  }
  return ENEMY_TYPES.map((enemyType) => (
    <button
      key={enemyType}
      type="button"
      className={selectedEnemyType === enemyType ? "selected" : ""}
      onClick={() => onSelectEnemy(enemyType)}
    >
      <small>{manual.enemyBestiary[enemyType].classification}</small>
      <strong>{enemyCopy(ENEMY_DEFINITIONS[enemyType], translator).name}</strong>
    </button>
  ));
};

const EncyclopediaIndex = ({ onSelectKind, ...selection }: EncyclopediaSelection) => {
  const { translator } = useGamePresentation();
  const { kind } = selection;
  return (
    <aside className="manual-index">
      <div className="manual-index-tabs">
        <button
          type="button"
          className={kind === "equipment" ? "active" : ""}
          onClick={() => onSelectKind("equipment")}
        >
          {translator.text("ui.manual.encyclopedia.equipment")}
        </button>
        <button
          type="button"
          className={kind === "reactions" ? "active" : ""}
          onClick={() => onSelectKind("reactions")}
        >
          {translator.text("ui.manual.encyclopedia.reactionTab")}
        </button>
        <button
          type="button"
          className={kind === "bestiary" ? "active" : ""}
          onClick={() => onSelectKind("bestiary")}
        >
          {translator.text("ui.manual.encyclopedia.bestiaryTab")}
        </button>
      </div>
      {kind === "bestiary" ? (
        <p className="manual-index-note">
          {translator.text("ui.manual.encyclopedia.bestiary.taxonomy")}
        </p>
      ) : null}
      <div className="manual-index-list">
        <EncyclopediaEntries {...selection} />
      </div>
    </aside>
  );
};

export const Encyclopedia = ({
  kind,
  selectedEnemyType,
  selectedEquipmentId,
  selectedReactionId,
  onSelectEnemy,
  onSelectEquipment,
  onSelectKind,
  onSelectReaction,
}: {
  kind: EncyclopediaKind;
  selectedEnemyType: EnemyType;
  selectedEquipmentId: EquipmentId;
  selectedReactionId: ReactionId;
  onSelectEnemy: (enemyType: EnemyType) => void;
  onSelectEquipment: (equipmentId: EquipmentId) => void;
  onSelectKind: (kind: EncyclopediaKind) => void;
  onSelectReaction: (reactionId: ReactionId) => void;
}) => {
  return (
    <section
      className="manual-page manual-encyclopedia-page"
      data-testid="manual-encyclopedia-page"
    >
      <EncyclopediaIndex
        kind={kind}
        selectedEnemyType={selectedEnemyType}
        selectedEquipmentId={selectedEquipmentId}
        selectedReactionId={selectedReactionId}
        onSelectEnemy={onSelectEnemy}
        onSelectEquipment={onSelectEquipment}
        onSelectKind={onSelectKind}
        onSelectReaction={onSelectReaction}
      />
      <div className="manual-entry-scroll">
        {kind === "equipment" ? (
          <EquipmentEntry equipmentId={selectedEquipmentId} onOpenReaction={onSelectReaction} />
        ) : null}
        {kind === "reactions" ? (
          <ReactionEntry reactionId={selectedReactionId} onOpenEquipment={onSelectEquipment} />
        ) : null}
        {kind === "bestiary" ? <BestiaryEntry enemyType={selectedEnemyType} /> : null}
      </div>
    </section>
  );
};
