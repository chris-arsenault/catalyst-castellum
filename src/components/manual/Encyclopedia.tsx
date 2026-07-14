import { ArrowRight, Atom, Cog, FlaskConical } from "lucide-react";
import {
  EQUIPMENT_DEFINITIONS,
  REACTION_DEFINITIONS,
  SPECIES_DEFINITIONS,
} from "../../game/config";
import { EQUIPMENT_IDS, REACTION_IDS, type EquipmentId, type ReactionId } from "../../game/types";
import { equipmentGradeEffect } from "../../presentation/equipmentCopy";
import {
  EQUIPMENT_CATEGORY_LABELS,
  EQUIPMENT_MANUAL,
  REACTION_MANUAL,
  equipmentForReaction,
  reactionMechanics,
} from "../../presentation/manualContent";
import { EquipmentImage } from "./EquipmentImage";

export type EncyclopediaKind = "equipment" | "reactions";

const EquipmentEntry = ({
  equipmentId,
  onOpenReaction,
}: {
  equipmentId: EquipmentId;
  onOpenReaction: (reactionId: ReactionId) => void;
}) => {
  const definition = EQUIPMENT_DEFINITIONS[equipmentId];
  const manual = EQUIPMENT_MANUAL[equipmentId];
  return (
    <article className="manual-encyclopedia-entry" data-testid={`equipment-entry-${equipmentId}`}>
      <div className="manual-entry-hero">
        <EquipmentImage equipmentId={equipmentId} compact={false} />
        <div>
          <span className="manual-entry-code">
            {EQUIPMENT_CATEGORY_LABELS[manual.category]} · {manual.designation}
          </span>
          <h2>{definition.name}</h2>
          <p>{definition.description}</p>
        </div>
      </div>
      <blockquote>{manual.flavor}</blockquote>
      <section className="manual-entry-section">
        <h3>Operational effect</h3>
        <ul>
          {manual.operationalNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
      <section className="manual-entry-section">
        <h3>Grade record</h3>
        <div className="manual-grade-table">
          {definition.grades.map((grade, index) => (
            <div key={grade.level}>
              <span>Grade {grade.level}</span>
              <strong>{equipmentGradeEffect(grade)}</strong>
              <small>
                {grade.occupiedVolume} volume ·{" "}
                {index === 0 ? definition.buildCost : definition.upgradeCosts[index - 1]} M
              </small>
            </div>
          ))}
        </div>
      </section>
      <section className="manual-entry-section">
        <h3>Associated reactions</h3>
        <div className="manual-cross-links">
          {manual.reactionIds.map((reactionId) => {
            const reaction = REACTION_DEFINITIONS[reactionId];
            return (
              <button key={reactionId} type="button" onClick={() => onOpenReaction(reactionId)}>
                <FlaskConical size={14} />
                <span>
                  <small>{reaction.code}</small>
                  <strong>{reaction.name}</strong>
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

const SpeciesSide = ({
  label,
  participants,
}: {
  label: string;
  participants: (typeof REACTION_DEFINITIONS)[ReactionId]["reactants"];
}) => (
  <div className="manual-reaction-side">
    <span>{label}</span>
    <div>
      {participants.map((participant) => {
        const species = SPECIES_DEFINITIONS[participant.species];
        return (
          <i key={participant.species} style={{ "--species": species.color }}>
            <strong>
              {participant.coefficient > 1 ? participant.coefficient : ""}
              {species.formula}
            </strong>
            <small>{species.name}</small>
          </i>
        );
      })}
    </div>
  </div>
);

const ReactionEntry = ({
  onOpenEquipment,
  reactionId,
}: {
  onOpenEquipment: (equipmentId: EquipmentId) => void;
  reactionId: ReactionId;
}) => {
  const reaction = REACTION_DEFINITIONS[reactionId];
  const manual = REACTION_MANUAL[reactionId];
  const equipmentIds = equipmentForReaction(reactionId);
  return (
    <article className="manual-encyclopedia-entry" data-testid={`reaction-entry-${reactionId}`}>
      <header className="manual-reaction-heading">
        <div className="manual-reaction-mark">
          <Atom size={25} />
          <span>{reaction.code}</span>
        </div>
        <div>
          <span className="manual-entry-code">{reaction.kind} process</span>
          <h2>{reaction.name}</h2>
          <strong>{reaction.equation}</strong>
        </div>
      </header>
      <blockquote>{manual.flavor}</blockquote>
      <section className="manual-entry-section">
        <h3>Process inventory</h3>
        <div className="manual-reaction-inventory">
          <SpeciesSide label="Consumes" participants={reaction.reactants} />
          <ArrowRight size={20} />
          <SpeciesSide label="Produces" participants={reaction.products} />
        </div>
      </section>
      <section className="manual-entry-section">
        <h3>Operating doctrine</h3>
        <p>{manual.doctrine}</p>
        <ul>
          {reactionMechanics(reaction).map((mechanic) => (
            <li key={mechanic}>{mechanic}</li>
          ))}
        </ul>
      </section>
      <section className="manual-entry-section">
        <h3>Equipment links</h3>
        <div className="manual-cross-links">
          {equipmentIds.map((equipmentId) => {
            const equipment = EQUIPMENT_DEFINITIONS[equipmentId];
            return (
              <button key={equipmentId} type="button" onClick={() => onOpenEquipment(equipmentId)}>
                <Cog size={14} />
                <span>
                  <small>{EQUIPMENT_MANUAL[equipmentId].designation}</small>
                  <strong>{equipment.name}</strong>
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

export const Encyclopedia = ({
  kind,
  selectedEquipmentId,
  selectedReactionId,
  onSelectEquipment,
  onSelectKind,
  onSelectReaction,
}: {
  kind: EncyclopediaKind;
  selectedEquipmentId: EquipmentId;
  selectedReactionId: ReactionId;
  onSelectEquipment: (equipmentId: EquipmentId) => void;
  onSelectKind: (kind: EncyclopediaKind) => void;
  onSelectReaction: (reactionId: ReactionId) => void;
}) => (
  <section className="manual-page manual-encyclopedia-page" data-testid="manual-encyclopedia-page">
    <aside className="manual-index">
      <div className="manual-index-tabs">
        <button
          type="button"
          className={kind === "equipment" ? "active" : ""}
          onClick={() => onSelectKind("equipment")}
        >
          Equipment
        </button>
        <button
          type="button"
          className={kind === "reactions" ? "active" : ""}
          onClick={() => onSelectKind("reactions")}
        >
          Reactions
        </button>
      </div>
      <div className="manual-index-list">
        {kind === "equipment"
          ? EQUIPMENT_IDS.map((equipmentId) => (
              <button
                key={equipmentId}
                type="button"
                className={selectedEquipmentId === equipmentId ? "selected" : ""}
                onClick={() => onSelectEquipment(equipmentId)}
              >
                <small>{EQUIPMENT_CATEGORY_LABELS[EQUIPMENT_MANUAL[equipmentId].category]}</small>
                <strong>{EQUIPMENT_DEFINITIONS[equipmentId].name}</strong>
              </button>
            ))
          : REACTION_IDS.map((reactionId) => (
              <button
                key={reactionId}
                type="button"
                className={selectedReactionId === reactionId ? "selected" : ""}
                onClick={() => onSelectReaction(reactionId)}
              >
                <small>{REACTION_DEFINITIONS[reactionId].code}</small>
                <strong>{REACTION_DEFINITIONS[reactionId].name}</strong>
              </button>
            ))}
      </div>
    </aside>
    <div className="manual-entry-scroll">
      {kind === "equipment" ? (
        <EquipmentEntry equipmentId={selectedEquipmentId} onOpenReaction={onSelectReaction} />
      ) : (
        <ReactionEntry reactionId={selectedReactionId} onOpenEquipment={onSelectEquipment} />
      )}
    </div>
  </section>
);
