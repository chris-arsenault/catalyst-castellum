/* global console, process */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { CHLOR_ALKALI_SITE } from "../src/game/content/sites/chlorAlkali";
import { WORLD_MAP } from "../src/game/content/worldMap";
import { hullLayoutFromMap } from "../src/game/world/hullFragment";
import { isProcessLine, type WorldMap } from "../src/game/world/map";
import { generateSiteLayoutCandidates } from "../src/game/world/siteGenerator";

const argument = (name: string, fallback: number): number => {
  const index = process.argv.indexOf(name);
  const raw = index >= 0 ? process.argv[index + 1] : undefined;
  const value = raw ? Number(raw) : fallback;
  if (!Number.isInteger(value) || value < 1)
    throw new Error(`${name} requires a positive integer.`);
  return value;
};

const SCALE = 8;
const MARGIN = 28;

const point = (map: WorldMap, column: number, elevation: number): { x: number; y: number } => ({
  x: MARGIN + (column + 0.5) * SCALE,
  y: MARGIN + (map.height - elevation - 0.5) * SCALE,
});

const gridLines = (map: WorldMap, width: number, height: number): string => {
  const vertical = Array.from({ length: map.width + 1 }, (_, column) => {
    const x = MARGIN + column * SCALE;
    return `<line x1="${x}" y1="${MARGIN}" x2="${x}" y2="${height - MARGIN}"/>`;
  }).join("");
  const horizontal = Array.from({ length: map.height + 1 }, (_, row) => {
    const y = MARGIN + row * SCALE;
    return `<line x1="${MARGIN}" y1="${y}" x2="${width - MARGIN}" y2="${y}"/>`;
  }).join("");
  return vertical + horizontal;
};

const candidateSvg = (
  map: WorldMap,
  detail: { seed: number; patternId: string; score: number }
): string => {
  const width = map.width * SCALE + MARGIN * 2;
  const height = map.height * SCALE + MARGIN * 2;
  const rooms = Object.values(map.rooms)
    .map((room) => {
      const x = MARGIN + room.bounds.column * SCALE;
      const y = MARGIN + (map.height - room.bounds.elevation - room.bounds.height) * SCALE;
      const roomWidth = room.bounds.width * SCALE;
      const roomHeight = room.bounds.height * SCALE;
      const fill = room.provenance === "hull" ? "#123c42" : "#18352a";
      const stroke = room.provenance === "hull" ? "#55d9e8" : "#77ae8b";
      return `<g><rect x="${x}" y="${y}" width="${roomWidth}" height="${roomHeight}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="2"/><text x="${x + roomWidth / 2}" y="${y + roomHeight / 2 - 3}" text-anchor="middle" fill="#eff5e8" font-family="monospace" font-size="11" font-weight="700">${room.code}</text><text x="${x + roomWidth / 2}" y="${y + roomHeight / 2 + 11}" text-anchor="middle" fill="#9eb5a8" font-family="sans-serif" font-size="9">${room.id}</text></g>`;
    })
    .join("");
  const portals = Object.values(map.connections)
    .filter((connection) => !isProcessLine(connection))
    .map((connection) => {
      const [from, to] = connection.endpoints;
      const start = point(map, from.column, from.elevation);
      const end = point(map, to.column, to.elevation);
      return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="#d8bd70" stroke-width="3"/>`;
    })
    .join("");
  const lines = Object.values(map.connections)
    .filter(isProcessLine)
    .map((line) => {
      const color = line.kind === "gas_line" ? "#5ac9d8" : "#5598eb";
      const points = line.route
        .map((cell) => {
          const position = point(map, cell.column, cell.elevation);
          return `${position.x},${position.y}`;
        })
        .join(" ");
      return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.7"/>`;
    })
    .join("");
  const grid = gridLines(map, width, height);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#07100c"/><g opacity="0.13" stroke="#7f9c8c">${grid}</g>${lines}${portals}${rooms}<text x="${MARGIN}" y="18" fill="#e9f1e8" font-family="monospace" font-size="12">seed ${detail.seed} · ${detail.patternId} · score ${detail.score.toFixed(1)}</text></svg>`;
};

const count = argument("--count", 5);
const seed = argument("--seed", 20_260_700);
const output = resolve("outputs/site-candidates/make_the_reagent");
mkdirSync(output, { recursive: true });
const candidates = generateSiteLayoutCandidates(CHLOR_ALKALI_SITE, hullLayoutFromMap(WORLD_MAP), {
  seed,
  count,
});
for (const candidate of candidates) {
  writeFileSync(
    join(output, `${candidate.seed}-${candidate.patternId}.svg`),
    candidateSvg(candidate.map, candidate)
  );
}
writeFileSync(
  join(output, "manifest.json"),
  `${JSON.stringify(
    candidates.map(({ seed: candidateSeed, patternId, chunkOrder, metrics, score }) => ({
      seed: candidateSeed,
      patternId,
      chunkOrder,
      metrics,
      score,
    })),
    null,
    2
  )}\n`
);
console.log(`Generated ${candidates.length} candidates in ${output}`);
for (const candidate of candidates) {
  console.log(
    `${candidate.seed} ${candidate.patternId.padEnd(18)} score=${candidate.score.toFixed(1)} order=${candidate.chunkOrder.join(" > ")}`
  );
}
