import type { LocaleBundle, LocaleKey } from "./types";

export interface LocaleValidationIssue {
  key: string;
  kind: "extra" | "missing" | "placeholder_mismatch";
}

const placeholders = (message: string): string[] =>
  [...message.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]!).sort();

export const validateLocale = (
  reference: LocaleBundle,
  candidate: LocaleBundle
): LocaleValidationIssue[] => {
  const issues: LocaleValidationIssue[] = [];
  const referenceKeys = Object.keys(reference.messages) as LocaleKey[];
  const candidateMessages = candidate.messages as Readonly<Record<string, string>>;
  for (const key of referenceKeys) {
    if (!(key in candidateMessages)) issues.push({ key, kind: "missing" });
    else if (
      placeholders(reference.messages[key]).join("|") !==
      placeholders(candidateMessages[key]!).join("|")
    )
      issues.push({ key, kind: "placeholder_mismatch" });
  }
  for (const key of Object.keys(candidateMessages)) {
    if (!(key in reference.messages)) issues.push({ key, kind: "extra" });
  }
  return issues;
};
