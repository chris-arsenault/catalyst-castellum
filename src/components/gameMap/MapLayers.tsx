import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import { type GameState, type RoomId, type SpeciesId, type ConnectionId } from "../../game/types";
import { transportPhaseAvailable } from "../../game/queries";
import { drawBackdrop, drawFacilityCorridors, drawFacilityDoors } from "./facilityGraphics";
import { drawProcessNodes } from "./processNodeGraphics";
import { drawTransportRun } from "./transportGraphics";
import { connectionRoomPair } from "../../presentation/defaultGame";
import type { PipePreview } from "../../application/storeTypes";
import { gridPathToWorldPath } from "../../game/spatial";
import { mapViewFor } from "./mapGeometry";

export { IncidentLayer } from "./IncidentLayer";

/** The routed proposal for a pending build: visible, cheap, and clearly not built yet. */
export const GhostRouteLayer = ({ game, preview }: { game: GameState; preview: PipePreview }) => {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      const view = mapViewFor(game.map);
      for (const [index, option] of preview.options.entries()) {
        const points = view.worldPathToMap(gridPathToWorldPath(option.route));
        const first = points[0];
        if (!first) continue;
        const color = option.kind === "gas_line" ? 0x6ad9b4 : 0x50b7f6;
        graphics.moveTo(first.x, first.y + index * 3);
        for (const point of points.slice(1)) graphics.lineTo(point.x, point.y + index * 3);
        graphics.stroke({ color, width: 2.5, alpha: option.buildable ? 0.55 : 0.22 });
        const last = points.at(-1);
        if (last) graphics.circle(last.x, last.y + index * 3, 4).fill({ color, alpha: 0.6 });
      }
    },
    [game.map, preview]
  );
  return <pixiGraphics draw={draw} eventMode="none" />;
};

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
              connectionRoomPair(game, runId).includes(pipeDragSourceRoomId))
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
