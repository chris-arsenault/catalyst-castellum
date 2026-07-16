import type { WorldMap } from "./map";
import { architecturalConnections } from "./map";
import type { SiteLayoutCandidate } from "./siteGeneratorTypes";

export const candidateMetrics = (map: WorldMap): Pick<SiteLayoutCandidate, "metrics" | "score"> => {
  const siteRooms = Object.values(map.rooms).filter((room) => room.provenance === "site");
  const minimumColumn = Math.min(...siteRooms.map((room) => room.bounds.column));
  const maximumColumn = Math.max(
    ...siteRooms.map((room) => room.bounds.column + room.bounds.width)
  );
  const minimumElevation = Math.min(...siteRooms.map((room) => room.bounds.elevation));
  const maximumElevation = Math.max(
    ...siteRooms.map((room) => room.bounds.elevation + room.bounds.height)
  );
  const routeLength = architecturalConnections(map)
    .filter((connection) => connection.id.startsWith("site_route_"))
    .reduce((total, connection) => total + connection.connectorCells.length + 2, 0);
  const siteSpan = maximumColumn - minimumColumn;
  const verticalSpan = maximumElevation - minimumElevation;
  const occupiedArea = siteRooms.reduce(
    (total, room) => total + room.bounds.width * room.bounds.height,
    0
  );
  return {
    metrics: { routeLength, siteSpan, verticalSpan, occupiedArea },
    score: siteSpan + verticalSpan * 2 + routeLength * 0.25,
  };
};
