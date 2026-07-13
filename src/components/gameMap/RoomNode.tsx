import { useCallback } from "react";
import type { Graphics } from "pixi.js";
import {
  FACILITY_MAP,
  GAS_COLORS,
  GAS_LABELS,
  EQUIPMENT_DEFINITIONS,
  ROOM_DEFINITIONS,
} from "../../game/config";
import { enemyRoomId } from "../../game/queries";
import type { GameState, RoomDefinition, RoomId } from "../../game/types";
import type { RoomViewModel } from "../../presentation/selectors";
import { roomMapRect } from "./mapGeometry";
import { drawRoom } from "./roomGraphics";
import { roomRenderModel } from "./roomRenderModel";

interface RoomNodeProps {
  game: GameState;
  roomId: RoomId;
  selected: boolean;
  onSelect: (roomId: RoomId) => void;
}

interface LabelProps {
  analysis: RoomViewModel;
  definition: RoomDefinition;
  game: GameState;
  height: number;
  occupied: number;
  selected: boolean;
  width: number;
}

const equipmentMapLabel = (game: GameState, roomId: RoomId): string =>
  Object.values(game.rooms[roomId].equipment)
    .flatMap((instance) =>
      instance
        ? [
            `${EQUIPMENT_DEFINITIONS[instance.equipmentId].name.replace("Gas ", "").replace("Wet ", "").replace("Thermal ", "").replace("Membrane ", "").toUpperCase()} ${instance.level}${instance.enabled ? "" : " OFF"}`,
          ]
        : []
    )
    .join(" · ");

const StandardRoomLabels = ({
  analysis,
  definition,
  game,
  height,
}: Pick<LabelProps, "analysis" | "definition" | "game" | "height">) => (
  <>
    <pixiText
      text={`↑ ${GAS_LABELS[analysis.upperDominantGas]} ${Math.round(
        analysis.upperDominantGasPercent * 100
      )}%`}
      anchor={{ x: 0.5, y: 0.5 }}
      y={12}
      style={{
        fontFamily: "IBM Plex Mono, ui-monospace, monospace",
        fontSize: 18,
        fill: GAS_COLORS[analysis.upperDominantGas],
      }}
    />
    <pixiText
      text={`↓ ${GAS_LABELS[analysis.lowerDominantGas]} ${Math.round(
        analysis.lowerDominantGasPercent * 100
      )}%`}
      anchor={{ x: 0.5, y: 0.5 }}
      y={31}
      style={{
        fontFamily: "IBM Plex Mono, ui-monospace, monospace",
        fontSize: 18,
        fill: GAS_COLORS[analysis.lowerDominantGas],
      }}
    />
    {analysis.hazard >= 10 && (
      <pixiText
        text={analysis.hazardLabel}
        anchor={{ x: 0.5, y: 0.5 }}
        y={52}
        style={{
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
          fontSize: 16,
          fontWeight: "700",
          fill: analysis.hazard >= 65 ? "#e2f768" : "#f6bc4b",
          letterSpacing: 1.4,
        }}
      />
    )}
    <pixiText
      text={definition.name.toUpperCase()}
      anchor={{ x: 0.5, y: 0.5 }}
      y={-20}
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: definition.structure === "entry" ? 20 : 22,
        fontWeight: "700",
        fill: "#d9ead3",
        letterSpacing: 0.6,
      }}
    />
    {equipmentMapLabel(game, definition.id) && (
      <pixiText
        text={equipmentMapLabel(game, definition.id)}
        anchor={{ x: 0.5, y: 0.5 }}
        y={height / 2 - 13}
        style={{
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
          fontSize: 13,
          fontWeight: "700",
          fill: "#add46c",
          letterSpacing: 0.4,
        }}
      />
    )}
  </>
);

const CoreLabels = ({ definition, game }: Pick<LabelProps, "definition" | "game">) => (
  <>
    <pixiText
      text={definition.name.toUpperCase()}
      anchor={{ x: 0.5, y: 0.5 }}
      y={-58}
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 22,
        fontWeight: "700",
        fill: "#d9ead3",
        letterSpacing: 0.6,
      }}
    />
    <pixiText
      text={`${Math.round(game.coreIntegrity)}%`}
      anchor={{ x: 0.5, y: 0.5 }}
      y={10}
      style={{
        fontFamily: "IBM Plex Mono, ui-monospace, monospace",
        fontSize: 21,
        fontWeight: "700",
        fill: "#f3fbba",
      }}
    />
  </>
);

const RoomLabels = (props: LabelProps) => (
  <>
    <pixiText
      text={props.definition.code}
      x={-props.width / 2 + 14}
      y={-props.height / 2 + 11}
      style={{
        fontFamily: "IBM Plex Mono, ui-monospace, monospace",
        fontSize: 17,
        fontWeight: "600",
        fill: props.selected ? "#f0fbac" : "#7fb3a1",
        letterSpacing: 1.4,
      }}
    />
    <pixiText
      text={`z${FACILITY_MAP.rooms[props.definition.id].bounds.elevation}`}
      anchor={{ x: 1, y: 0 }}
      x={props.width / 2 - 12}
      y={-props.height / 2 + 9}
      style={{
        fontFamily: "IBM Plex Mono, ui-monospace, monospace",
        fontSize: 15,
        fontWeight: "600",
        fill: "#5e907f",
      }}
    />
    {props.definition.structure === "core" ? (
      <CoreLabels {...props} />
    ) : (
      <StandardRoomLabels {...props} />
    )}
    {props.occupied > 0 && (
      <pixiText
        text={String(props.occupied)}
        anchor={{ x: 0.5, y: 0.5 }}
        x={props.width / 2 - 14}
        y={-props.height / 2 + 14}
        style={{
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
          fontSize: 16,
          fontWeight: "700",
          fill: "#fef4e5",
        }}
      />
    )}
  </>
);

export const RoomNode = ({ game, roomId, selected, onSelect }: RoomNodeProps) => {
  const definition = ROOM_DEFINITIONS[roomId];
  const geometry = roomMapRect(roomId);
  const occupied = game.enemies.filter((enemy) => enemyRoomId(enemy) === roomId).length;
  const model = roomRenderModel(game, roomId, selected, occupied);
  const draw = useCallback((graphics: Graphics) => drawRoom(graphics, model), [model]);
  return (
    <pixiContainer x={geometry.center.x} y={geometry.center.y} eventMode="passive">
      <pixiGraphics
        draw={draw}
        eventMode="static"
        cursor="pointer"
        onPointerTap={() => onSelect(roomId)}
      />
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
