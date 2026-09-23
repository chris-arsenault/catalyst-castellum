import { Application, extend } from "@pixi/react";
import { AnimatedSprite, Container, Graphics, Sprite, Text } from "pixi.js";
import type { ReactNode } from "react";
import { useCallback } from "react";
import type { EncounterState } from "../../game/tactical";
import { enemyRoomId } from "../../game/tactical";
import type { TowerPlacementPreview } from "../../presentation/towerPlanning";
import { useEncounterControls } from "../../application/encounterSurface";
import { drawBackdrop } from "./facilityGraphics";
import {
  mapRenderResolution,
  mapViewFor,
  VIEWPORT_HEIGHT,
  VIEWPORT_WIDTH,
  type CameraTransform,
} from "./mapGeometry";
import { RoomBackgroundLayer, RoomBoundaryLayer, RoomClosureLayer } from "./RoomSectionLayer";
import { EncounterTowerLayer } from "./EncounterTowerLayer";
import { EnemyNode } from "./EnemyNode";
import { CoreSprite } from "./CoreSprite";
import { ArchitectureLayer } from "./ArchitectureLayer";
import { CatalystLayer } from "./CatalystLayer";

extend({ AnimatedSprite, Container, Graphics, Sprite, Text });

const PlainRooms = ({ encounter }: { encounter: EncounterState }) => {
  const { selectedRoomId, selectRoom } = useEncounterControls();
  return Object.values(encounter.map.rooms).map((room) => {
    const rect = mapViewFor(encounter.map).roomMapRect(room.id);
    return (
      <pixiContainer key={room.id} x={rect.center.x} y={rect.center.y}>
        {room.structure === "core" && <CoreSprite integrity={encounter.coreIntegrity} />}
        <pixiGraphics
          eventMode="static"
          cursor="pointer"
          onPointerTap={() => selectRoom(room.id)}
          draw={(g) => {
            g.clear()
              .rect(-rect.width / 2, -rect.height / 2, rect.width, rect.height)
              .fill({ color: 0x19352f, alpha: selectedRoomId === room.id ? 0.13 : 0.01 });
          }}
        />
        <pixiText
          text={room.code}
          x={-rect.width / 2 + 8}
          y={-rect.height / 2 + 8}
          eventMode="none"
          style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fill: "#d6e6d9" }}
        />
      </pixiContainer>
    );
  });
};

/** The same tactical scene renders both a campaign and a process-free exercise. */
export const EncounterScene = ({
  camera,
  placementPreview,
  onHoverEnemy,
  children,
}: {
  camera: CameraTransform;
  placementPreview: TowerPlacementPreview | null;
  onHoverEnemy: (enemyId: number | null) => void;
  children?: ReactNode;
}) => {
  const { encounter, selectedTowerId, selectTower } = useEncounterControls();
  const draw = useCallback((g: Graphics) => drawBackdrop(g, encounter.map), [encounter.map]);
  return (
    <Application
      width={VIEWPORT_WIDTH}
      height={VIEWPORT_HEIGHT}
      backgroundAlpha={0}
      antialias
      autoDensity
      resolution={mapRenderResolution(globalThis.devicePixelRatio)}
      preference="webgl"
    >
      <pixiContainer x={camera.x} y={camera.y} scale={camera.zoom}>
        <pixiGraphics draw={draw} eventMode="none" />
        <RoomBackgroundLayer map={encounter.map} />
        {!encounter.process && <PlainRooms encounter={encounter} />}
        <ArchitectureLayer map={encounter.map} />
        <RoomBoundaryLayer map={encounter.map} />
        <RoomClosureLayer map={encounter.map} portalStates={encounter.portalStates} />
        {children}
        <EncounterTowerLayer
          game={encounter}
          placementPreview={placementPreview}
          selectedTowerId={selectedTowerId}
          onSelectTower={selectTower}
        />
        {encounter.enemies.map((enemy) => (
          <EnemyNode
            key={enemy.id}
            enemy={enemy}
            map={encounter.map}
            fieldProtected={encounter.enemies.some(
              (candidate) =>
                candidate.id !== enemy.id &&
                candidate.behavior.kind === "shared_field" &&
                candidate.behavior.active &&
                candidate.behavior.charge > 0 &&
                enemyRoomId(candidate, encounter.map) === enemyRoomId(enemy, encounter.map)
            )}
            onHover={onHoverEnemy}
          />
        ))}
        <CatalystLayer placement={placementPreview} />
      </pixiContainer>
    </Application>
  );
};
