import { useCallback } from "react";
import { useGameStore } from "../../application/store";
import type { Graphics } from "pixi.js";
import { type GameState, type RoomId, type SpeciesId, type ConnectionId } from "../../game/types";
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
  runId,
  selectedSpecies,
}: Omit<TransportRunNodeProps, "onHover">) => {
  const draw = useCallback(
    (graphics: Graphics) =>
      drawTransportRun(graphics, game, runId, selectedSpecies, hovered, emphasized),
    [emphasized, game, hovered, runId, selectedSpecies]
  );
  // Pure overlay: drawn on top of the rooms, but not interactive — the hit line under
  // the rooms owns hover and toggle, so room clicks are never stolen by a pipe crossing.
  return <pixiGraphics draw={draw} eventMode="none" />;
};

const installedPipePaths = (game: GameState, runId: ConnectionId): number[][] => {
  const view = mapViewFor(game.map);
  const paths: number[][] = [];
  for (const conduit of [game.gasConduits[runId], game.liquidConduits[runId]]) {
    if (!conduit?.installed || conduit.route.length < 2) continue;
    paths.push(view.worldPathToMap(gridPathToWorldPath(conduit.route)).flatMap((p) => [p.x, p.y]));
  }
  return paths;
};

/** A wide, invisible hit line beneath the rooms: room clicks win, pipe clicks toggle. */
const PipeHitNode = ({
  game,
  runId,
  onHover,
}: {
  game: GameState;
  runId: ConnectionId;
  onHover: (runId: ConnectionId | null) => void;
}) => {
  const dispatch = useGameStore((state) => state.dispatch);
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear();
      for (const flat of installedPipePaths(game, runId)) {
        graphics.poly(flat, false).stroke({ width: 12, color: 0xffffff, alpha: 0.001 });
      }
    },
    [game, runId]
  );
  const toggle = useCallback(() => {
    const gas = game.gasConduits[runId];
    const liquid = game.liquidConduits[runId];
    const anyOn = Boolean((gas?.installed && gas.enabled) || (liquid?.installed && liquid.enabled));
    if (gas?.installed) dispatch({ type: "set_conduit", connectionId: runId, enabled: !anyOn });
    if (liquid?.installed) dispatch({ type: "set_conduit", connectionId: runId, enabled: !anyOn });
  }, [dispatch, game.gasConduits, game.liquidConduits, runId]);
  return (
    <pixiGraphics
      draw={draw}
      eventMode="static"
      cursor="pointer"
      onPointerOver={() => onHover(runId)}
      onPointerOut={() => onHover(null)}
      onPointerTap={toggle}
    />
  );
};

const installedConnectionIds = (game: GameState): ConnectionId[] =>
  game.world.connections.filter(
    (runId) =>
      Boolean(game.gasConduits[runId]?.installed) || Boolean(game.liquidConduits[runId]?.installed)
  );

export const PipeHitLayer = ({
  game,
  onHover,
}: {
  game: GameState;
  onHover: (runId: ConnectionId | null) => void;
}) => (
  <>
    {installedConnectionIds(game).map((runId) => (
      <PipeHitNode key={runId} game={game} runId={runId} onHover={onHover} />
    ))}
  </>
);

interface TransportNetworkProps {
  game: GameState;
  hoveredRunId: ConnectionId | null;
  pipeDragSourceRoomId: RoomId | null;
  pipeMode: boolean;
  selectedSpecies: SpeciesId | null;
}

export const TransportNetwork = ({
  game,
  hoveredRunId,
  pipeDragSourceRoomId,
  pipeMode,
  selectedSpecies,
}: TransportNetworkProps) => (
  <>
    {installedConnectionIds(game).map((runId) => (
      <TransportRunNode
        key={runId}
        emphasized={pipeMode}
        game={game}
        hovered={
          hoveredRunId === runId ||
          (pipeDragSourceRoomId !== null &&
            connectionRoomPair(game, runId).includes(pipeDragSourceRoomId))
        }
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
