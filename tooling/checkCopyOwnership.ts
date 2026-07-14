/* global console, process */
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const SOURCE = join(ROOT, "src");
const CODE_EXTENSIONS = new Set([".ts", ".tsx"]);
const DISPLAY_FIELDS = new Set([
  "blurb",
  "briefing",
  "description",
  "detail",
  "kicker",
  "lesson",
  "name",
  "objective",
  "title",
]);
const ENGINE_COPY_FIELDS = new Set(["detail", "objective", "reason", "title"]);
const UI_COPY_ATTRIBUTES = new Set([
  "activeLabel",
  "alt",
  "aria-label",
  "description",
  "detail",
  "inactiveLabel",
  "label",
  "placeholder",
  "summary",
  "text",
  "title",
]);
const TUTORIAL_COPY_FIELDS = new Set([
  "body",
  "completionBody",
  "completionTitle",
  "description",
  "detail",
  "heading",
  "items",
  "label",
  "principle",
  "prose",
  "story",
  "title",
  "visibleMetric",
]);

const files = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path);
    return CODE_EXTENSIONS.has(extname(path)) ? [path] : [];
  });

const propertyName = (node: ts.PropertyName | undefined): string | null => {
  if (!node) return null;
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  return null;
};

const stringValue = (node: ts.Node): string | null => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
};

const containsPlayerWords = (value: string): boolean =>
  /[A-Za-z]{2}/.test(value) && !/^[A-Za-z]+[₀-₉0-9]+$/.test(value);
const isProduction = (repoPath: string): boolean => !/\.(test|spec)\.tsx?$/.test(repoPath);
const ownsUi = (repoPath: string): boolean =>
  repoPath === "src/App.tsx" ||
  repoPath.startsWith("src/components/") ||
  repoPath.startsWith("src/tutorial/");

const violations: string[] = [];
const report = (sourceFile: ts.SourceFile, node: ts.Node, message: string): void => {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const repoPath = relative(ROOT, sourceFile.fileName).replaceAll("\\", "/");
  violations.push(`${repoPath}:${line + 1}: ${message}`);
};

const checkDisplayField = (
  sourceFile: ts.SourceFile,
  node: ts.PropertyAssignment,
  fields: ReadonlySet<string>,
  message: string
): void => {
  const name = propertyName(node.name);
  if (!name || !fields.has(name)) return;
  const value = stringValue(node.initializer);
  if (value !== null && containsPlayerWords(value)) report(sourceFile, node.initializer, message);
};

const checkTutorialField = (sourceFile: ts.SourceFile, node: ts.PropertyAssignment): void => {
  const name = propertyName(node.name);
  if (!name || !TUTORIAL_COPY_FIELDS.has(name)) return;
  const literals: ts.Node[] = [];
  const collect = (candidate: ts.Node): void => {
    if (stringValue(candidate) !== null) literals.push(candidate);
    else candidate.forEachChild(collect);
  };
  collect(node.initializer);
  for (const literal of literals) {
    const value = stringValue(literal);
    if (value && containsPlayerWords(value) && !value.startsWith("tutorial.")) {
      report(sourceFile, literal, "tutorial authoring contains raw player-facing copy");
    }
  }
};

const checkJsxText = (sourceFile: ts.SourceFile, node: ts.JsxText): void => {
  if (containsPlayerWords(node.text)) {
    report(sourceFile, node, "JSX contains player-facing text outside the locale catalog");
  }
};

const checkJsxAttribute = (sourceFile: ts.SourceFile, node: ts.JsxAttribute): void => {
  const name = node.name.getText(sourceFile);
  if (!UI_COPY_ATTRIBUTES.has(name) || !node.initializer) return;
  if (ts.isStringLiteral(node.initializer) && containsPlayerWords(node.initializer.text)) {
    report(sourceFile, node.initializer, `${name} contains text outside the locale catalog`);
  }
};

const checkJsxExpression = (sourceFile: ts.SourceFile, node: ts.JsxExpression): void => {
  if (!node.expression) return;
  const value = stringValue(node.expression);
  if (value !== null && containsPlayerWords(value)) {
    report(
      sourceFile,
      node.expression,
      "JSX contains player-facing text outside the locale catalog"
    );
  }
};

const checkUiNode = (sourceFile: ts.SourceFile, node: ts.Node): void => {
  if (ts.isJsxText(node)) checkJsxText(sourceFile, node);
  else if (ts.isJsxAttribute(node)) checkJsxAttribute(sourceFile, node);
  else if (ts.isJsxExpression(node)) checkJsxExpression(sourceFile, node);
};

for (const path of files(SOURCE)) {
  const repoPath = relative(ROOT, path).replaceAll("\\", "/");
  if (!isProduction(repoPath)) continue;
  const sourceFile = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    extname(path) === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAssignment(node) && repoPath.startsWith("src/game/content/")) {
      checkDisplayField(
        sourceFile,
        node,
        DISPLAY_FIELDS,
        "authored mechanics contains a player-facing display field"
      );
    }
    if (ts.isPropertyAssignment(node) && repoPath.startsWith("src/game/engine/")) {
      checkDisplayField(
        sourceFile,
        node,
        ENGINE_COPY_FIELDS,
        "engine contains current-locale command or event prose"
      );
    }
    if (ts.isPropertyAssignment(node) && repoPath.startsWith("src/tutorial/")) {
      checkTutorialField(sourceFile, node);
    }
    if (ownsUi(repoPath)) checkUiNode(sourceFile, node);
    node.forEachChild(visit);
  };
  visit(sourceFile);
}

if (violations.length > 0) {
  console.error(`Copy ownership violations:\n${violations.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(
    "Engine, authored mechanics, tutorial authoring, and UI surfaces own locale keys only."
  );
}
