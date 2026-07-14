import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import {
  TRANSPORT_RUN_IDS,
  type GameState,
  type SpeciesId,
  type TransportRunId,
} from "../../game/types";
import { transportPhaseAvailable } from "../../game/queries";
import { drawBackdrop, drawFacilityCorridors, drawFacilityDoors } from "./facilityGraphics";
import { drawProcessNodes } from "./processNodeGraphics";
import { drawTransportRun } from "./transportGraphics";

export { IncidentLayer } from "./IncidentLayer";

export const MapBackdrop = () => {
  const draw = useCallback((graphics: Graphics) => drawBackdrop(graphics), []);
  return <pixiGraphics draw={draw} eventMode="none" />;
};

export const FacilityCorridors = () => {
  const draw = useCallback((graphics: Graphics) => drawFacilityCorridors(graphics), []);
  return <pixiGraphics draw={draw} eventMode="none" />;
};

export const FacilityDoors = ({ game }: { game: GameState }) => {
  const draw = useCallback(
    (graphics: Graphics) => drawFacilityDoors(graphics, game.portalStates),
    [game.portalStates]
  );
  return <pixiGraphics draw={draw} eventMode="none" />;
};

interface TransportRunNodeProps {
  game: GameState;
  hovered: boolean;
  onHover: (runId: TransportRunId | null) => void;
  runId: TransportRunId;
  selectedSpecies: SpeciesId | null;
}

const TransportRunNode = ({
  game,
  hovered,
  onHover,
  runId,
  selectedSpecies,
}: TransportRunNodeProps) => {
  const draw = useCallback(
    (graphics: Graphics) => drawTransportRun(graphics, game, runId, selectedSpecies, hovered),
    [game, hovered, runId, selectedSpecies]
  );
  return (
    <pixiGraphics
      draw={draw}
      eventMode="static"
      cursor="help"
      onPointerOver={() => onHover(runId)}
      onPointerOut={() => onHover(null)}
    />
  );
};

interface TransportNetworkProps {
  game: GameState;
  hoveredRunId: TransportRunId | null;
  onHover: (runId: TransportRunId | null) => void;
  selectedSpecies: SpeciesId | null;
}

export const TransportNetwork = ({
  game,
  hoveredRunId,
  onHover,
  selectedSpecies,
}: TransportNetworkProps) => (
  <>
    {TRANSPORT_RUN_IDS.filter(
      (runId) =>
        transportPhaseAvailable(game, runId, "gas") ||
        transportPhaseAvailable(game, runId, "liquid")
    ).map((runId) => (
      <TransportRunNode
        key={runId}
        game={game}
        hovered={hoveredRunId === runId}
        onHover={onHover}
        runId={runId}
        selectedSpecies={selectedSpecies}
      />
    ))}
  </>
);

export const ProcessNodes = ({ game }: { game: GameState }) => {
  const draw = useCallback((graphics: Graphics) => drawProcessNodes(graphics, game), [game]);
  return <pixiGraphics draw={draw} eventMode="none" />;
};
