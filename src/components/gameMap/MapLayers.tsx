import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import { FACILITY_MAP, roomCenterWorld, utilityNodeWorldPoint } from "../../game/config";
import {
  TRANSPORT_RUN_IDS,
  type GameState,
  type SpeciesId,
  type TransportRunId,
} from "../../game/types";
import { transportPhaseAvailable } from "../../game/simulation";
import { drawBackdrop, drawFacilityCorridors, drawFacilityDoors } from "./facilityGraphics";
import { WORLD_GROUND_Y, WORLD_PIXELS_PER_UNIT, worldToMapPoint } from "./mapGeometry";
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

const labelStyle = {
  fontFamily: "IBM Plex Mono, ui-monospace, monospace",
  fontSize: 13,
  fontWeight: "700",
  fill: "#d5e8d9",
  letterSpacing: 0.7,
} as const;

export const ProcessNodeLabels = () => {
  const core = worldToMapPoint(roomCenterWorld("core"));
  const cell = worldToMapPoint(roomCenterWorld("lower_intake"));
  const vent = worldToMapPoint(utilityNodeWorldPoint("gas_vent"));
  const drain = worldToMapPoint(utilityNodeWorldPoint("liquid_drain"));
  return (
    <>
      {Array.from(
        { length: Math.floor(FACILITY_MAP.height / 10) + 1 },
        (_, index) => index * 10
      ).map((elevation) => (
        <pixiText
          key={elevation}
          text={`z ${elevation}`}
          x={25}
          y={WORLD_GROUND_Y - elevation * WORLD_PIXELS_PER_UNIT}
          anchor={{ x: 0, y: 0.5 }}
          style={{ ...labelStyle, fontSize: 12, fill: "#7b9f90" }}
          eventMode="none"
        />
      ))}
      <pixiText
        text="CORE UTILITIES"
        x={core.x}
        y={core.y + 89}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ ...labelStyle, fontSize: 11, fill: "#86a699" }}
        eventMode="none"
      />
      <pixiText
        text="CELL OUTLETS"
        x={cell.x}
        y={cell.y + 73}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ ...labelStyle, fontSize: 11, fill: "#86a699" }}
        eventMode="none"
      />
      <pixiText
        text="GAS VENT"
        x={vent.x}
        y={vent.y - 16}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ ...labelStyle, fontSize: 10, fill: "#69c5cd" }}
        eventMode="none"
      />
      <pixiText
        text="LIQUID SUMP"
        x={drain.x}
        y={drain.y + 17}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ ...labelStyle, fontSize: 10, fill: "#4f87e7" }}
        eventMode="none"
      />
    </>
  );
};
