/* global console, process */
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const SOURCE = join(ROOT, "src");
const CODE_EXTENSIONS = new Set([".ts", ".tsx"]);

const files = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : CODE_EXTENSIONS.has(extname(path)) ? [path] : [];
  });

const violations: string[] = [];
for (const path of files(SOURCE)) {
  const repoPath = relative(ROOT, path).replaceAll("\\", "/");
  if (/\.(test|spec)\.tsx?$/.test(repoPath)) continue;
  const source = readFileSync(path, "utf8");
  if (
    repoPath.startsWith("src/game/content/") &&
    /^\s*(name|description|blurb|briefing|kicker|lesson|title|detail|objective):\s*["'`]/m.test(
      source
    )
  ) {
    violations.push(`${repoPath}: authored mechanics contains player-facing display fields`);
  }
  if (
    repoPath.startsWith("src/game/engine/") &&
    /\b(reason|title|detail|objective):\s*["'`]/m.test(source)
  ) {
    violations.push(`${repoPath}: engine contains current-locale command or event prose`);
  }
}

if (violations.length > 0) {
  console.error(`Copy ownership violations:\n${violations.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("Mechanical definitions and engine state are free of player-facing copy fields.");
}
