import { describe, expect, it } from "vitest";
import { analyzeArchitecture, type ArchitectureModule } from "./checkArchitecture";

describe("architecture enforcement", () => {
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
