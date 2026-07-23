import type { ReactionParticipant } from "../../game/types";
import { SPECIES_DEFINITIONS } from "../../presentation/defaultGame";
import { speciesCopy } from "../../presentation/entityCopy";
import { useGamePresentation } from "../../application/presentationContext";

export const SpeciesSide = ({
  label,
  participants,
}: {
  label: string;
  participants: readonly ReactionParticipant[];
}) => {
  const { translator } = useGamePresentation();
  return (
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
              <small>{speciesCopy(species, translator).name}</small>
            </i>
          );
        })}
      </div>
    </div>
  );
};
