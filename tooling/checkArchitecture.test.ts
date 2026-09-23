import { describe, expect, it } from "vitest";
import { analyzeArchitecture, type ArchitectureModule } from "./checkArchitecture";

describe("architecture enforcement", () => {
  it("rejects indirect campaign imports from standalone entrypoints", () => {
    const violations = analyzeArchitecture([
      { path: "src/game/encounter/runtime.ts", source: 'import "../world/helper";' },
      { path: "src/game/world/helper.ts", source: 'import "../content/campaign";' },
      { path: "src/game/content/campaign.ts", source: "export const sites = [];" },
    ]);
    expect(violations.some(({ message }) => message.startsWith("standalone encounter loads"))).toBe(
      true
    );
  });

  it("permits type-only vocabulary without loading campaign modules", () => {
    const violations = analyzeArchitecture([
      {
        path: "src/game/encounter/runtime.ts",
        source: 'import type { Level } from "../definitionTypes"; export type Context = Level;',
      },
      {
        path: "src/game/definitionTypes.ts",
        source: 'import "../content/campaign"; export type Level = string;',
      },
      { path: "src/game/content/campaign.ts", source: "export const sites = [];" },
    ]);
    expect(violations).toEqual([]);
  });

  it("rejects a component that imports authored content", () => {
    const violations = analyzeArchitecture([
      {
        path: "src/components/Bad.tsx",
        source: 'import { LEVELS } from "../game/content/campaign";',
      },
    ]);
    expect(violations.map(({ message }) => message)).toContain(
      'application/UI imports internal game module "../game/content/campaign"'
    );
  });

  it("rejects a cycle in otherwise valid relative modules", () => {
    const modules: ArchitectureModule[] = [
      { path: "src/presentation/a.ts", source: 'import "../application/b";' },
      { path: "src/application/b.ts", source: 'import "../presentation/a";' },
    ];
    expect(
      analyzeArchitecture(modules).some(({ message }) => message.startsWith("module cycle:"))
    ).toBe(true);
  });
});
