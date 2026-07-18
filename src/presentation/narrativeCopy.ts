import { DEFAULT_TRANSLATOR, type Translator } from "../localization/translator";
import type { LocaleKey } from "../localization/types";

type Identified = Readonly<{ id: string }>;
type DialoguePhase = "briefing" | "debrief";

const localized = (translator: Translator, key: string): string =>
  translator.text(key as LocaleKey);

export const createNarrativeCopy = (translator: Translator) => ({
  act: (act: Identified) => ({
    name: localized(translator, `narrative.acts.${act.id}.name`),
    summary: localized(translator, `narrative.acts.${act.id}.summary`),
    introduction: [
      localized(translator, `narrative.acts.${act.id}.introduction.1`),
      localized(translator, `narrative.acts.${act.id}.introduction.2`),
    ] as const,
  }),
  speaker: (speaker: Identified) => ({
    name: localized(translator, `narrative.speakers.${speaker.id}.name`),
    role: localized(translator, `narrative.speakers.${speaker.id}.role`),
  }),
  site: (site: Identified) => ({
    name: localized(translator, `narrative.sites.${site.id}.name`),
    code: localized(translator, `narrative.sites.${site.id}.code`),
    region: localized(translator, `narrative.sites.${site.id}.region`),
    contract: localized(translator, `narrative.sites.${site.id}.contract`),
    briefing: localized(translator, `narrative.sites.${site.id}.briefing`),
  }),
  dialogue: (site: Identified, phase: DialoguePhase, line: Identified) =>
    localized(translator, `narrative.dialogue.${site.id}.${phase}.${line.id}`),
});

export const DEFAULT_NARRATIVE_COPY = createNarrativeCopy(DEFAULT_TRANSLATOR);
