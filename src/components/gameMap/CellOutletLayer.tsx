import { useCallback, useMemo } from "react";
import type { Graphics } from "pixi.js";
import type { GameState, RoomId } from "../../game/types";
import {
  cellOutletAssemblyModel,
  type CellOutletId,
  type CellOutletRenderModel,
} from "./cellOutletRenderModel";
import { useGamePresentation } from "../../application/presentationContext";

const drawAssembly = (
  graphics: Graphics,
  model: NonNullable<ReturnType<typeof cellOutletAssemblyModel>>
): void => {
  graphics.clear();
  const left = model.outlets[0];
  const right = model.outlets.at(-1);
  if (!left || !right) return;
  graphics
    .moveTo(model.installationX, model.installationY - 12)
    .lineTo(model.installationX, model.rowY)
    .moveTo(left.x, model.rowY)
    .lineTo(right.x, model.rowY)
    .stroke({ color: 0x739587, width: 1, alpha: 0.5 });
};

const drawOutlet = (graphics: Graphics, model: CellOutletRenderModel): void => {
  graphics.clear();
  graphics
    .circle(0, 0, 10)
    .fill({ color: 0x08120f, alpha: 0.98 })
    .stroke({ color: model.accent, width: 1.25, alpha: 0.9 });
  graphics.circle(0, 0, 6 * Math.min(1, model.fill)).fill({
    color: model.accent,
    alpha: 0.72,
  });
};

interface OutletNodeProps {
  model: CellOutletRenderModel;
  onHover: (bufferId: CellOutletId | null) => void;
  onSelectRoom: (roomId: RoomId) => void;
}

const OutletNode = ({ model, onHover, onSelectRoom }: OutletNodeProps) => {
  const draw = useCallback((graphics: Graphics) => drawOutlet(graphics, model), [model]);
  return (
    <pixiContainer x={model.x} y={model.y}>
      <pixiGraphics
        draw={draw}
        eventMode="static"
        cursor="help"
        onPointerOver={() => onHover(model.bufferId)}
        onPointerOut={() => onHover(null)}
        onPointerTap={() => onSelectRoom(model.roomId)}
      />
      <pixiText
        text={model.formula}
        x={0}
        y={15}
        anchor={{ x: 0.5, y: 0 }}
        eventMode="none"
        style={{
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
          fontSize: 8,
          fontWeight: "700",
          fill: `#${model.accent.toString(16).padStart(6, "0")}`,
          letterSpacing: 0.25,
        }}
      />
    </pixiContainer>
  );
};

export const CellOutletLayer = ({
  game,
  onHover,
  onSelectRoom,
}: {
  game: GameState;
  onHover: (bufferId: CellOutletId | null) => void;
  onSelectRoom: (roomId: RoomId) => void;
}) => {
  const { translator } = useGamePresentation();
  const model = useMemo(() => cellOutletAssemblyModel(game, translator), [game, translator]);
  const draw = useCallback(
    (graphics: Graphics) => {
      if (model) drawAssembly(graphics, model);
      else graphics.clear();
    },
    [model]
  );
  if (!model) return null;
  return (
    <pixiContainer>
      <pixiGraphics draw={draw} eventMode="none" />
      <pixiText
        text={model.header}
        x={model.installationX}
        y={model.rowY - 23}
        anchor={{ x: 0.5, y: 0.5 }}
        eventMode="none"
        style={{
          fontFamily: "IBM Plex Mono, ui-monospace, monospace",
          fontSize: 8,
          fontWeight: "700",
          fill: "#abc4b6",
          letterSpacing: 0.45,
        }}
      />
      {model.outlets.map((outlet) => (
        <OutletNode
          key={outlet.bufferId}
          model={outlet}
          onHover={onHover}
          onSelectRoom={onSelectRoom}
        />
      ))}
    </pixiContainer>
  );
};
