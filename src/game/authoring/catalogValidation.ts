import type { GamePackSource } from "../definitionTypes";
import { isProcessLine } from "../world/map";
import type { EnemyAuthoringIssue } from "./enemyValidation";

export const validateCatalogStructure = (source: GamePackSource): EnemyAuthoringIssue[] => {
  const issues: EnemyAuthoringIssue[] = [];
  for (const connection of Object.values(source.map.connections)) {
    if (!isProcessLine(connection)) continue;
    for (const roomId of connection.rooms) {
      if (!(roomId in source.map.rooms)) {
        issues.push({
          path: `map.connections.${connection.id}.rooms`,
          message: `Unknown room ${roomId}.`,
        });
      }
    }
  }
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
