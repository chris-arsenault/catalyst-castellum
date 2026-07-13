/* global console, process */
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const SOURCE_ROOT = join(process.cwd(), "src");
const CODE_EXTENSIONS = new Set([".ts", ".tsx"]);
const DOMAIN_FORBIDDEN_PACKAGES = [
  "react",
  "react-dom",
  "react-joyride",
  "zustand",
  "pixi.js",
  "@pixi/react",
];

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return CODE_EXTENSIONS.has(extname(entry.name)) ? [path] : [];
  });

const moduleSpecifiers = (source: string): string[] =>
  [...source.matchAll(/(?:from\s+|import\s*\()(["'])([^"']+)\1/g)].map((match) => match[2]!);

const isTest = (path: string): boolean => /\.(test|spec)\.tsx?$/.test(path);

const domainImportViolations = (imports: string[]): string[] =>
  imports.flatMap((dependency) => {
    if (
      DOMAIN_FORBIDDEN_PACKAGES.some(
        (name) => dependency === name || dependency.startsWith(`${name}/`)
      )
    ) {
      return [`domain imports UI/browser package "${dependency}"`];
    }
    if (/\/(application|components|presentation|tutorial)(\/|$)/.test(dependency)) {
      return [`domain imports outward layer "${dependency}"`];
    }
    return [];
  });

const applicationImportViolations = (imports: string[]): string[] =>
  imports.flatMap((dependency) =>
    /game\/(engine|persistence|simulation)(\/|$)/.test(dependency)
      ? [`application/UI imports internal game module "${dependency}"`]
      : []
  );

const violationsFor = (absolutePath: string): string[] => {
  const path = relative(process.cwd(), absolutePath).replaceAll("\\", "/");
  const source = readFileSync(absolutePath, "utf8");
  const imports = moduleSpecifiers(source);
  const violations: string[] = [];
  if (path.startsWith("src/game/") && !isTest(path)) {
    violations.push(...domainImportViolations(imports));
    if (/\b(window|document|localStorage|sessionStorage)\b/.test(source)) {
      violations.push("domain references a browser global");
    }
  }
  if (/^src\/(application|components|tutorial)\//.test(path) && !isTest(path)) {
    violations.push(...applicationImportViolations(imports));
  }
  return violations.map((message) => `${path}: ${message}`);
};

const violations = sourceFiles(SOURCE_ROOT).flatMap(violationsFor);
if (violations.length > 0) {
  console.error(`Architecture boundary violations:\n${violations.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("Architecture boundaries are valid.");
}
