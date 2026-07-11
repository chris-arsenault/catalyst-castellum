import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import { GAS_COLORS, GAS_LABELS, LIQUID_COLORS, ROOM_DEFINITIONS } from "../../game/config";
import { analyzeRoom, enemyRoomId } from "../../game/simulation";
import type { GameState, RoomAnalysis, RoomDefinition, RoomId } from "../../game/types";
import { colorNumber, drawRoom, roomDimensions, type RoomDrawModel } from "./mapGraphics";

interface RoomNodeProps {
  game: GameState;
  roomId: RoomId;
  selected: boolean;
  onSelect: (roomId: RoomId) => void;
}

interface LabelProps {
  analysis: RoomAnalysis;
  definition: RoomDefinition;
  game: GameState;
  height: number;
  occupied: number;
  selected: boolean;
  width: number;
}

const StandardRoomLabels = ({
  analysis,
  definition,
}: Pick<LabelProps, "analysis" | "definition">) => (
  <>
    <pixiText
      text={`${GAS_LABELS[analysis.dominantGas]} ${Math.round(analysis.dominantGasPercent * 100)}%`}
      anchor={{ x: 0.5, y: 0.5 }}
      y={18}
      style={{
        fontFamily: "IBM Plex Mono, ui-monospace, monospace",
        fontSize: 11,
        fill: GAS_COLORS[analysis.dominantGas],
      }}
    />
    {analysis.hazard >= 10 && (
      <pixiText
        text={analysis.hazardLabel}
        anchor={{ x: 0.5, y: 0.5 }}
        y={37}
        style={{
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
          fontSize: 9,
          fontWeight: "700",
          fill: analysis.hazard >= 65 ? "#dff36c" : "#e2b65f",
          letterSpacing: 1.4,
        }}
      />
    )}
    <pixiText
      text={definition.name.toUpperCase()}
      anchor={{ x: 0.5, y: 0.5 }}
      y={-8}
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: definition.kind === "spawn" ? 12 : 13,
        fontWeight: "700",
        fill: "#dbe6d7",
        letterSpacing: 0.6,
      }}
    />
  </>
);

const CoreLabels = ({ definition, game }: Pick<LabelProps, "definition" | "game">) => (
  <>
    <pixiText
      text={definition.name.toUpperCase()}
      anchor={{ x: 0.5, y: 0.5 }}
      y={-42}
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 13,
        fontWeight: "700",
        fill: "#dbe6d7",
        letterSpacing: 0.6,
      }}
    />
    <pixiText
      text={`${Math.round(game.coreIntegrity)}%`}
      anchor={{ x: 0.5, y: 0.5 }}
      y={8}
      style={{
        fontFamily: "IBM Plex Mono, ui-monospace, monospace",
        fontSize: 12,
        fontWeight: "700",
        fill: "#edf3c2",
      }}
    />
  </>
);

const RoomLabels = (props: LabelProps) => (
  <>
    <pixiText
      text={props.definition.code}
      x={-props.width / 2 + 12}
      y={-props.height / 2 + 9}
      style={{
        fontFamily: "IBM Plex Mono, ui-monospace, monospace",
        fontSize: 10,
        fontWeight: "600",
        fill: props.selected ? "#e8f0b7" : "#7ca295",
        letterSpacing: 1.4,
      }}
    />
    {props.definition.kind === "core" ? (
      <CoreLabels {...props} />
    ) : (
      <StandardRoomLabels {...props} />
    )}
    {props.occupied > 0 && (
      <pixiText
        text={String(props.occupied)}
        anchor={{ x: 0.5, y: 0.5 }}
        x={props.width / 2 - 7}
        y={-props.height / 2 + 7}
        style={{
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
          fontSize: 10,
          fontWeight: "700",
          fill: "#fff4e4",
        }}
      />
    )}
  </>
);

const roomModel = (
  game: GameState,
  roomId: RoomId,
  selected: boolean,
  occupied: number
): RoomDrawModel => {
  const definition = ROOM_DEFINITIONS[roomId];
  const room = game.rooms[roomId];
  const analysis = analyzeRoom(room);
  const dimensions = roomDimensions(definition.kind);
  const dominantColor = colorNumber(GAS_COLORS[analysis.dominantGas]);
  const liquidColor = analysis.dominantLiquid
    ? colorNumber(LIQUID_COLORS[analysis.dominantLiquid])
    : 0x4ca9d6;
  return {
    ...dimensions,
    kind: definition.kind,
    selected,
    analysis,
    dominantColor,
    liquidColor,
    sealTimer: room.sealTimer,
    occupied,
    coreIntegrity: game.coreIntegrity,
  };
};

export const RoomNode = ({ game, roomId, selected, onSelect }: RoomNodeProps) => {
  const definition = ROOM_DEFINITIONS[roomId];
  const occupied = game.enemies.filter((enemy) => enemyRoomId(enemy) === roomId).length;
  const model = roomModel(game, roomId, selected, occupied);
  const draw = useCallback((graphics: Graphics) => drawRoom(graphics, model), [model]);
  return (
    <pixiContainer
      x={definition.position.x}
      y={definition.position.y}
      eventMode="static"
      cursor="pointer"
      onPointerTap={() => onSelect(roomId)}
    >
      <pixiGraphics draw={draw} />
      <RoomLabels
        analysis={model.analysis}
        definition={definition}
        game={game}
        height={model.height}
        occupied={occupied}
        selected={selected}
        width={model.width}
      />
    </pixiContainer>
  );
};
