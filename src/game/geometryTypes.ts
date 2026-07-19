export interface Point {
  x: number;
  y: number;
}

export interface WorldPoint {
  x: number;
  elevation: number;
}

export interface GridCell {
  column: number;
  elevation: number;
}

export interface RoomGeometryDefinition {
  x: number;
  floorElevation: number;
  width: number;
  height: number;
}
