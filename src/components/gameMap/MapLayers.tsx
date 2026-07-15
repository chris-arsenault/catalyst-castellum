import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import { type GameState, type RoomId, type SpeciesId, type ConnectionId } from "../../game/types";
import { transportPhaseAvailable } from "../../game/queries";
import { drawBackdrop, drawFacilityCorridors, drawFacilityDoors } from "./facilityGraphics";
import { drawProcessNodes } from "./processNodeGraphics";
import { drawTransportRun } from "./transportGraphics";
import { connectionRoomPair } from "../../presentation/defaultGame";

export { IncidentLayer } from "./IncidentLayer";

export const MapBackdrop = ({ game }: { game: GameState }) => {
  const draw = useCallback((graphics: Graphics) => drawBackdrop(graphics, game.map), [game.map]);
  return <pixiGraphics draw={draw} eventMode="none" />;
};

export const FacilityCorridors = ({ game }: { game: GameState }) => {
  const draw = useCallback(
    (graphics: Graphics) => drawFacilityCorridors(graphics, game.map),
    [game.map]
  );
  return <pixiGraphics draw={draw} eventMode="none" />;
};

export const FacilityDoors = ({ game }: { game: GameState }) => {
  const draw = useCallback(
    (graphics: Graphics) => drawFacilityDoors(graphics, game.map, game.portalStates),
    [game.map, game.portalStates]
  );
  return <pixiGraphics draw={draw} eventMode="none" />;
};

interface TransportRunNodeProps {
  emphasized: boolean;
  game: GameState;
  hovered: boolean;
  onHover: (runId: ConnectionId | null) => void;
  runId: ConnectionId;
  selectedSpecies: SpeciesId | null;
}

const TransportRunNode = ({
  emphasized,
  game,
  hovered,
  onHover,
  runId,
  selectedSpecies,
}: TransportRunNodeProps) => {
  const draw = useCallback(
    (graphics: Graphics) =>
      drawTransportRun(graphics, game, runId, selectedSpecies, hovered, emphasized),
    [emphasized, game, hovered, runId, selectedSpecies]
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
  hoveredRunId: ConnectionId | null;
  onHover: (runId: ConnectionId | null) => void;
  pipeDragSourceRoomId: RoomId | null;
  pipeMode: boolean;
  selectedSpecies: SpeciesId | null;
}

export const TransportNetwork = ({
  game,
  hoveredRunId,
  onHover,
  pipeDragSourceRoomId,
  pipeMode,
  selectedSpecies,
}: TransportNetworkProps) => (
  <>
    {game.world.connections
      .filter(
        (runId) =>
          transportPhaseAvailable(game, runId, "gas") ||
          transportPhaseAvailable(game, runId, "liquid")
      )
      .map((runId) => (
        <TransportRunNode
          key={runId}
          emphasized={pipeMode}
          game={game}
          hovered={
            hoveredRunId === runId ||
            (pipeDragSourceRoomId !== null &&
              connectionRoomPair(runId).includes(pipeDragSourceRoomId))
          }
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
