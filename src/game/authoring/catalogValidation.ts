import type { GamePackSource } from "../definitionTypes";
import type { EnemyAuthoringIssue } from "./enemyValidation";
import { validateWorldMap } from "../world/mapValidation";

const validateLineBlueprints = (source: GamePackSource): EnemyAuthoringIssue[] => {
  const issues: EnemyAuthoringIssue[] = Object.keys(source.lineBlueprints)
    .filter((connectionId) => connectionId in source.map.connections)
    .map((connectionId) => ({
      path: `lineBlueprints.${connectionId}`,
      message: "Line blueprint ID collides with physical map topology.",
    }));
  for (const [connectionId, connection] of Object.entries(source.lineBlueprints)) {
    if (connectionId !== connection.id) {
      issues.push({
        path: `lineBlueprints.${connectionId}.id`,
        message: "Line blueprint ID must match its record key.",
      });
    }
    for (const roomId of connection.rooms) {
      if (!(roomId in source.map.rooms)) {
        issues.push({
          path: `lineBlueprints.${connection.id}.rooms`,
          message: `Unknown room ${roomId}.`,
        });
      }
    }
  }
  const blueprintMap = {
    ...source.map,
    connections: { ...source.map.connections, ...source.lineBlueprints },
  };
  for (const { path, message } of validateWorldMap(blueprintMap)) {
    issues.push({ path: `lineBlueprints.${path}`, message });
  }
  return issues;
};

const validateModules = (source: GamePackSource): EnemyAuthoringIssue[] => {
  const issues: EnemyAuthoringIssue[] = [];
  for (const [moduleId, template] of Object.entries(source.modules)) {
    if (moduleId !== template.id) {
      issues.push({
        path: `modules.${moduleId}.id`,
        message: "Module ID must match its record key.",
      });
    }
    if (template.footprint.width < 1 || template.footprint.height < 1) {
      issues.push({
        path: `modules.${moduleId}.footprint`,
        message: "Module footprint must be positive.",
      });
    }
    if (template.graftCost < 0) {
      issues.push({
        path: `modules.${moduleId}.graftCost`,
        message: "Graft cost must be nonnegative.",
      });
    }
  }
  return issues;
};

export const validateCatalogStructure = (source: GamePackSource): EnemyAuthoringIssue[] => [
  ...validateLineBlueprints(source),
  ...validateModules(source),
];
