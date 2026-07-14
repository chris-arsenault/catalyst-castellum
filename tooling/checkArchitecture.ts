/* global console, process */
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, posix, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CODE_EXTENSIONS = new Set([".ts", ".tsx"]);
const DOMAIN_FORBIDDEN_PACKAGES = [
  "react",
  "react-dom",
  "react-joyride",
  "zustand",
  "pixi.js",
  "@pixi/react",
];

export interface ArchitectureModule {
  path: string;
  source: string;
}

export interface ArchitectureViolation {
  path: string;
  message: string;
}

export const moduleSpecifiers = (source: string): string[] =>
  [...source.matchAll(/(?:from\s+|import\s*(?:\(\s*)?)(["'])([^"']+)\1/g)].map(
    (match) => match[2]!
  );

const isTest = (path: string): boolean => /\.(test|spec)\.tsx?$/.test(path);

interface ImportBoundaryRule {
  message: string;
  matches: (path: string, dependency: string) => boolean;
}

const IMPORT_BOUNDARY_RULES: readonly ImportBoundaryRule[] = [
  {
    matches: (path, dependency) =>
      path.startsWith("src/game/") &&
      DOMAIN_FORBIDDEN_PACKAGES.some(
        (name) => dependency === name || dependency.startsWith(`${name}/`)
      ),
    message: "domain imports UI/browser package",
  },
  {
    matches: (path, dependency) =>
      path.startsWith("src/game/") &&
      /\/(application|components|presentation|tutorial|localization)(\/|$)/.test(dependency),
    message: "domain imports outward layer",
  },
  {
    matches: (path, dependency) =>
      /^src\/(application|components|tutorial|audio)\//.test(path) &&
      /game\/(config|content|engine|persistence|simulation)(\/|$)/.test(dependency),
    message: "application/UI imports internal game module",
  },
  {
    matches: (path, dependency) =>
      path.startsWith("src/game/engine/") &&
      /(\.\.\/)+(config|content|definition)(\/|$)/.test(dependency),
    message: "engine imports a default definition or authored content",
  },
  {
    matches: (path, dependency) =>
      path.startsWith("src/localization/") &&
      /\/(game|application|components|tutorial)(\/|$)/.test(dependency),
    message: "locale imports runtime layer",
  },
  {
    matches: (path, dependency) =>
      path.startsWith("src/presentation/") &&
      path !== "src/presentation/defaultGame.ts" &&
      /game\/(config|content|engine)(\/|$)/.test(dependency),
    message: "presentation bypasses the bound runtime/default composition",
  },
];

const forbiddenImport = (path: string, dependency: string): string | null => {
  const rule = IMPORT_BOUNDARY_RULES.find((candidate) => candidate.matches(path, dependency));
  return rule ? `${rule.message} "${dependency}"` : null;
};

const resolveLocalDependency = (
  owner: string,
  dependency: string,
  paths: ReadonlySet<string>
): string | null => {
  if (!dependency.startsWith(".")) return null;
  const base = posix.normalize(posix.join(posix.dirname(owner), dependency));
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`];
  return candidates.find((candidate) => paths.has(candidate)) ?? null;
};

const architectureLayer = (path: string): string => {
  if (path.startsWith("src/game/engine/")) return "engine";
  if (path.startsWith("src/game/content/")) return "content";
  if (path.startsWith("src/game/persistence/")) return "persistence";
  if (/^src\/game\/(definition|definitionTypes|runtime|queries)\.ts$/.test(path))
    return "definition";
  const match = path.match(/^src\/([^/]+)\//);
  return match?.[1] ?? "other";
};

const cycleViolations = (modules: readonly ArchitectureModule[]): ArchitectureViolation[] => {
  const production = modules.filter((module) => !isTest(module.path));
  const paths = new Set(production.map((module) => module.path));
  const edges = new Map(
    production.map((module) => [
      module.path,
      moduleSpecifiers(module.source).flatMap((dependency) => {
        const resolved = resolveLocalDependency(module.path, dependency, paths);
        return resolved ? [resolved] : [];
      }),
    ])
  );
  const visited = new Set<string>();
  const active = new Set<string>();
  const stack: string[] = [];
  const reported = new Set<string>();
  const violations: ArchitectureViolation[] = [];

  const visit = (path: string): void => {
    if (active.has(path)) {
      const start = stack.indexOf(path);
      const cycle = [...stack.slice(start), path];
      if (new Set(cycle.map(architectureLayer)).size < 2) return;
      const key = [...new Set(cycle)].sort().join("|");
      if (!reported.has(key)) {
        reported.add(key);
        violations.push({ path, message: `module cycle: ${cycle.join(" -> ")}` });
      }
      return;
    }
    if (visited.has(path)) return;
    active.add(path);
    stack.push(path);
    for (const dependency of edges.get(path) ?? []) visit(dependency);
    stack.pop();
    active.delete(path);
    visited.add(path);
  };

  for (const module of production) visit(module.path);
  return violations;
};

export const analyzeArchitecture = (
  modules: readonly ArchitectureModule[]
): ArchitectureViolation[] => {
  const violations = modules.flatMap((module) => {
    if (isTest(module.path)) return [];
    const messages = moduleSpecifiers(module.source).flatMap((dependency) => {
      const message = forbiddenImport(module.path, dependency);
      return message ? [message] : [];
    });
    if (
      module.path.startsWith("src/game/") &&
      /\b(window|document|localStorage|sessionStorage)\b/.test(module.source)
    ) {
      messages.push("domain references a browser global");
    }
    return messages.map((message) => ({ path: module.path, message }));
  });
  return [...violations, ...cycleViolations(modules)];
};

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return CODE_EXTENSIONS.has(extname(entry.name)) ? [path] : [];
  });

export const readRepositoryModules = (root: string): ArchitectureModule[] => {
  const sourceRoot = join(root, "src");
  return sourceFiles(sourceRoot).map((path) => ({
    path: relative(root, path).replaceAll("\\", "/"),
    source: readFileSync(path, "utf8"),
  }));
};

const main = (): void => {
  const violations = analyzeArchitecture(readRepositoryModules(process.cwd()));
  if (violations.length > 0) {
    console.error(
      `Architecture boundary violations:\n${violations
        .map(({ path, message }) => `${path}: ${message}`)
        .join("\n")}`
    );
    process.exitCode = 1;
    return;
  }
  console.log("Architecture boundaries and module graph are valid.");
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
