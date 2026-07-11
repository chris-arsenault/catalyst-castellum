import { Application, extend } from "@pixi/react";
import { Container, Graphics, Text } from "pixi.js";
import { ROOM_ORDER } from "../game/config";
import type { GameState, RoomId } from "../game/types";
import { EnemyNode } from "./gameMap/EnemyNode";
import { MapBackdrop, PipeNetwork } from "./gameMap/MapLayers";
import { MAP_HEIGHT, MAP_WIDTH } from "./gameMap/mapGraphics";
import { RoomNode } from "./gameMap/RoomNode";

extend({ Container, Graphics, Text });

interface GameMapProps {
  game: GameState;
  selectedRoomId: RoomId;
  onSelectRoom: (roomId: RoomId) => void;
}

export const GameMap = ({ game, selectedRoomId, onSelectRoom }: GameMapProps) => (
  <div className="game-map-canvas" data-testid="game-map">
    <Application
      width={MAP_WIDTH}
      height={MAP_HEIGHT}
      backgroundAlpha={0}
      antialias
      autoDensity
      resolution={1}
      preference="webgl"
    >
      <MapBackdrop />
      <PipeNetwork />
      {ROOM_ORDER.map((roomId) => (
        <RoomNode
          key={roomId}
          game={game}
          roomId={roomId}
          selected={selectedRoomId === roomId}
          onSelect={onSelectRoom}
        />
      ))}
      {game.enemies.map((enemy) => (
        <EnemyNode key={enemy.id} enemy={enemy} />
      ))}
    </Application>
  </div>
);
