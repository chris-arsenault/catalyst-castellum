/* eslint-disable max-lines-per-function, complexity -- The SVG scene is a declarative layer stack. */
import { useMemo, useState } from "react";

import type { GameState, GridCell, RoomId } from "../game/types";
import { cellKey } from "../game/spatial";
import { architecturalConnections, isProcessLine, type WorldMap } from "../game/world/map";
import { graftSlotOccupied } from "../game/world/modules";
import { hullPlanningMap } from "../game/world/hullFragment";
import { useGamePresentation } from "../application/presentationContext";
import { hullEnemyRoute } from "../presentation/graftPlanning";
import { hullStrokeCells, type HullStrokeTool } from "./hullBuilderStroke";

export type HullBuildTool = "select" | "connection" | "platform" | "ladder" | "erase";

interface HullStroke {
  roomId: RoomId;
  start: GridCell;
  current: GridCell;
  tool: HullStrokeTool;
}

interface HullBuilderCanvasProps {
  game: GameState;
  map: WorldMap;
  candidateRoomId: RoomId | null;
  tool: HullBuildTool;
  connectionStartRoomId: RoomId | null;
  connectionTargetRoomIds: readonly RoomId[];
  onStroke: (roomId: RoomId, targets: readonly GridCell[]) => void;
  onRoom: (roomId: RoomId) => void;
  onGraftSlot: (roomId: RoomId, graftSlotId: string) => void;
}

const CELL = 18;

const gridCellsForRoom = (map: WorldMap, roomId: RoomId): GridCell[] => {
  const room = map.rooms[roomId];
  if (!room) return [];
  return Array.from({ length: room.bounds.width * room.bounds.height }, (_, index) => ({
    column: room.bounds.column + (index % room.bounds.width),
    elevation: room.bounds.elevation + Math.floor(index / room.bounds.width),
  }));
};

const boundaryCellsForRoom = (map: WorldMap, roomId: RoomId): GridCell[] => {
  const room = map.rooms[roomId];
  if (!room) return [];
  return gridCellsForRoom(map, roomId).filter(
    (target) =>
      target.column === room.bounds.column ||
      target.column === room.bounds.column + room.bounds.width - 1 ||
      target.elevation === room.bounds.elevation ||
      target.elevation === room.bounds.elevation + room.bounds.height - 1
  );
};

const activationKey = (event: React.KeyboardEvent<SVGGElement>, activate: () => void): void => {
  if (event.key === "Enter" || event.key === " ") activate();
};

export const HullBuilderCanvas = ({
  game,
  map,
  candidateRoomId,
  tool,
  connectionStartRoomId,
  connectionTargetRoomIds,
  onStroke,
  onRoom,
  onGraftSlot,
}: HullBuilderCanvasProps) => {
  const { translator } = useGamePresentation();
  const [stroke, setStroke] = useState<HullStroke | null>(null);
  const committedHull = useMemo(() => hullPlanningMap(game.map), [game.map]);
  const rooms = Object.values(map.rooms);
  const extents = useMemo(() => {
    const minColumn = Math.min(...rooms.map((room) => room.bounds.column)) - 3;
    const maxColumn =
      Math.max(...rooms.map((room) => room.bounds.column + room.bounds.width - 1)) + 3;
    const minElevation = Math.min(...rooms.map((room) => room.bounds.elevation)) - 2;
    const maxElevation =
      Math.max(...rooms.map((room) => room.bounds.elevation + room.bounds.height - 1)) + 2;
    return { minColumn, maxColumn, minElevation, maxElevation };
  }, [rooms]);
  const x = (column: number): number => (column - extents.minColumn) * CELL;
  const y = (elevation: number): number => (extents.maxElevation - elevation) * CELL;
  const width = (extents.maxColumn - extents.minColumn + 1) * CELL;
  const height = (extents.maxElevation - extents.minElevation + 1) * CELL;
  const portalStates = useMemo(
    () =>
      Object.fromEntries(
        architecturalConnections(map).map((portal) => [
          portal.id,
          game.portalStates[portal.id] ?? {
            open: portal.defaultOpen,
            sealed: portal.defaultSealed,
            lastGasFlow: 0,
            lastLiquidFlow: 0,
          },
        ])
      ),
    [game.portalStates, map]
  );
  const route = useMemo(() => hullEnemyRoute(map, portalStates), [map, portalStates]);
  const platformKeys = new Set(rooms.flatMap((room) => room.platformCells.map(cellKey)));
  const ladderKeys = new Set(rooms.flatMap((room) => room.ladderCells.map(cellKey)));
  const connectionTargets = new Set(connectionTargetRoomIds);
  const activeStroke = stroke?.tool === tool ? stroke : null;
  const strokeCells = activeStroke
    ? hullStrokeCells(activeStroke.tool, activeStroke.start, activeStroke.current)
    : [];
  const finishStroke = (): void => {
    if (!activeStroke) return;
    onStroke(
      activeStroke.roomId,
      hullStrokeCells(activeStroke.tool, activeStroke.start, activeStroke.current)
    );
    setStroke(null);
  };
  const extendStroke = (roomId: RoomId, target: GridCell, buttons: number): void => {
    if (buttons <= 0) return;
    setStroke((current) =>
      current?.roomId === roomId ? { ...current, current: target } : current
    );
  };

  return (
    <div className={`hull-builder-canvas tool-${tool}`} data-testid="hull-builder-canvas">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={translator.text("ui.graft.builder.label")}
        onPointerUp={finishStroke}
        onPointerLeave={(event) => {
          if (activeStroke && event.buttons > 0) finishStroke();
        }}
      >
        <defs>
          <pattern id="hull-grid" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <path d={`M ${CELL} 0 L 0 0 0 ${CELL}`} className="hull-grid-line" />
          </pattern>
          <marker
            id="route-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        <rect width={width} height={height} className="hull-blueprint-field" />
        <rect width={width} height={height} fill="url(#hull-grid)" />

        {rooms.map((room) => {
          const top = y(room.bounds.elevation + room.bounds.height - 1);
          const connectionSelected = connectionStartRoomId === room.id;
          const connectable = tool === "connection" && connectionTargets.has(room.id);
          const connectionSelectable =
            tool === "connection" && (!connectionStartRoomId || connectionSelected || connectable);
          const activateRoom = () => onRoom(room.id);
          return (
            <g
              key={room.id}
              className={`hull-blueprint-room ${room.structure === "core" ? "core" : ""} ${room.id === candidateRoomId ? "candidate" : ""} ${connectionSelected ? "connection-selected" : ""} ${connectable ? "connectable" : ""}`}
              data-room-id={room.id}
              role={connectionSelectable ? "button" : undefined}
              tabIndex={connectionSelectable ? 0 : undefined}
              onClick={connectionSelectable ? activateRoom : undefined}
              onKeyDown={
                connectionSelectable ? (event) => activationKey(event, activateRoom) : undefined
              }
            >
              <rect
                x={x(room.bounds.column)}
                y={top}
                width={room.bounds.width * CELL}
                height={room.bounds.height * CELL}
                rx={4}
              />
              <text x={x(room.bounds.column) + 7} y={top + 16}>
                {room.code}
              </text>
            </g>
          );
        })}

        {Object.values(map.connections).flatMap((connection) => {
          if (!isProcessLine(connection)) return [];
          const state =
            connection.kind === "gas_line"
              ? game.gasConduits[connection.id]
              : game.liquidConduits[connection.id];
          if (!state) return [];
          return [
            <polyline
              key={connection.id}
              className={`hull-persistent-pipe ${connection.kind}`}
              points={connection.route
                .map((target) => `${x(target.column) + CELL / 2},${y(target.elevation) + CELL / 2}`)
                .join(" ")}
            />,
          ];
        })}

        {rooms.flatMap((room) =>
          Object.entries(room.socketCells).flatMap(([socketId, target]) => {
            const equipment =
              game.rooms[room.id]?.equipment[
                socketId as keyof GameState["rooms"][RoomId]["equipment"]
              ];
            if (!target || !equipment) return [];
            return [
              <g
                key={`equipment:${room.id}:${socketId}`}
                className="hull-persistent-machine"
                transform={`translate(${x(target.column) + CELL / 2} ${y(target.elevation) + CELL / 2})`}
              >
                <path d="M-6 -5 H6 L8 0 L6 5 H-6 L-8 0 Z" />
                <circle r="2" />
              </g>,
            ];
          })
        )}

        {candidateRoomId &&
          boundaryCellsForRoom(map, candidateRoomId).map((target) => (
            <rect
              key={`tower-surface:${cellKey(target)}`}
              className="hull-tower-surface"
              x={x(target.column) + 3}
              y={y(target.elevation) + 3}
              width={CELL - 6}
              height={CELL - 6}
            />
          ))}

        {rooms.flatMap((room) =>
          Object.entries(room.socketCells).flatMap(([socketId, target]) =>
            target && !game.rooms[room.id]?.equipment[socketId as "socket_a" | "socket_b"]
              ? [
                  <g
                    key={`socket:${room.id}:${socketId}`}
                    className="hull-equipment-position"
                    transform={`translate(${x(target.column) + CELL / 2} ${y(target.elevation) + CELL / 2})`}
                  >
                    <rect x={-5} y={-5} width={10} height={10} />
                    <path d="M-3 0 H3 M0 -3 V3" />
                  </g>,
                ]
              : []
          )
        )}

        {Object.values(game.towers).map((tower) => (
          <g
            key={`tower:${tower.id}`}
            className="hull-persistent-tower"
            transform={`translate(${x(tower.placement.anchor.column) + CELL / 2} ${y(tower.placement.anchor.elevation) + CELL / 2})`}
          >
            <path d="M0 -7 L7 0 L0 7 L-7 0 Z" />
          </g>
        ))}

        {rooms.flatMap((room) =>
          room.platformCells.map((target) => (
            <rect
              key={`platform:${cellKey(target)}`}
              className="hull-platform-cell"
              x={x(target.column)}
              y={y(target.elevation)}
              width={CELL}
              height={CELL}
            />
          ))
        )}
        {rooms.flatMap((room) =>
          room.ladderCells.map((target) => (
            <g
              key={`ladder:${cellKey(target)}`}
              className="hull-ladder-cell"
              transform={`translate(${x(target.column)} ${y(target.elevation)})`}
            >
              <path
                d={`M4 1 V${CELL - 1} M${CELL - 4} 1 V${CELL - 1} M4 5 H${CELL - 4} M4 12 H${CELL - 4}`}
              />
            </g>
          ))
        )}

        {route.length > 1 && (
          <polyline
            className="hull-enemy-route"
            points={route
              .map(
                (step) => `${x(step.cell.column) + CELL / 2},${y(step.cell.elevation) + CELL / 2}`
              )
              .join(" ")}
            markerEnd="url(#route-arrow)"
          />
        )}

        {architecturalConnections(map).flatMap((portal) =>
          portal.connectorCells.map((target) => {
            const state = portalStates[portal.id];
            return (
              <g
                key={`${portal.id}:${cellKey(target)}`}
                className={`hull-portal ${portal.kind} ${state?.open ? "open" : "closed"}`}
                transform={`translate(${x(target.column)} ${y(target.elevation)})`}
              >
                <rect width={CELL} height={CELL} rx={2} />
                <path
                  d={state?.open ? `M3 3 V${CELL - 3}` : `M3 3 H${CELL - 3} V${CELL - 3} H3 Z`}
                />
              </g>
            );
          })
        )}

        {strokeCells.map((target) => (
          <rect
            key={`stroke:${cellKey(target)}`}
            className={`hull-stroke-preview ${tool}`}
            x={x(target.column)}
            y={y(target.elevation)}
            width={CELL}
            height={CELL}
          />
        ))}

        {rooms.flatMap((room) =>
          room.graftSlots.map((graftSlot) => {
            const occupied = graftSlotOccupied(map, room.id, graftSlot.id);
            const committed = room.id in committedHull.rooms;
            const activate = () => onGraftSlot(room.id, graftSlot.id);
            const available = !occupied && committed && tool === "select";
            return (
              <g
                key={`${room.id}:${graftSlot.id}`}
                className={`hull-graft-slot ${occupied ? "occupied" : "available"}`}
                transform={`translate(${x(graftSlot.cell.column) + CELL / 2} ${y(graftSlot.cell.elevation) + CELL / 2})`}
                data-testid={`graft-slot-${graftSlot.id}`}
                role={available ? "button" : undefined}
                tabIndex={available ? 0 : undefined}
                onClick={available ? activate : undefined}
                onKeyDown={available ? (event) => activationKey(event, activate) : undefined}
              >
                <circle r={occupied ? 4 : 7} />
                {!occupied && <path d="M-3 0 H3 M0 -3 V3" />}
              </g>
            );
          })
        )}

        {tool !== "select" &&
          tool !== "connection" &&
          rooms.flatMap((room) =>
            gridCellsForRoom(map, room.id).map((target) => {
              const key = cellKey(target);
              const editable = tool !== "erase" || platformKeys.has(key) || ladderKeys.has(key);
              const activate = () => onStroke(room.id, [target]);
              return (
                <g
                  key={`edit:${room.id}:${key}`}
                  className={`hull-cell-target ${editable ? "editable" : "empty"}`}
                  role={editable ? "button" : undefined}
                  tabIndex={editable ? 0 : undefined}
                  onKeyDown={editable ? (event) => activationKey(event, activate) : undefined}
                  onPointerDown={
                    editable
                      ? (event) => {
                          event.preventDefault();
                          setStroke({
                            roomId: room.id,
                            start: target,
                            current: target,
                            tool,
                          });
                        }
                      : undefined
                  }
                  onPointerEnter={(event) => extendStroke(room.id, target, event.buttons)}
                >
                  <rect x={x(target.column)} y={y(target.elevation)} width={CELL} height={CELL} />
                </g>
              );
            })
          )}

        <g
          className="hull-route-entry"
          transform={`translate(${x(map.entryCell.column) - 8} ${y(map.entryCell.elevation) + CELL / 2})`}
        >
          <path d="M0 0 H24" markerEnd="url(#route-arrow)" />
          <text x="0" y="-9">
            {translator.text("ui.graft.builder.approach")}
          </text>
        </g>
      </svg>
      <div className={`hull-route-status ${route.length > 1 ? "valid" : "blocked"}`}>
        <span />
        {translator.text(
          route.length > 1 ? "ui.graft.builder.routeValid" : "ui.graft.builder.routeBlocked"
        )}
      </div>
    </div>
  );
};
