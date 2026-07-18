import { describe, expect, it } from "vitest";
import { NARRATIVE_ACTS, NARRATIVE_SITES } from "../game/content/narrativeCampaign";
import { TEST_LOCALE } from "../localization/locales/test";
import { createTranslator } from "../localization/translator";
import { createNarrativeCopy } from "./narrativeCopy";

describe("narrative copy", () => {
  const copy = createNarrativeCopy(createTranslator(TEST_LOCALE));

  it("localizes every act, site, speaker, and dialogue line", () => {
    for (const act of Object.values(NARRATIVE_ACTS)) {
      expect(copy.act(act).name).toMatch(/^⟦.+⟧$/);
      expect(copy.act(act).summary).toMatch(/^⟦.+⟧$/);
      expect(copy.act(act).introduction).toHaveLength(2);
      expect(copy.act(act).introduction.every((paragraph) => /^⟦.+⟧$/u.test(paragraph))).toBe(true);
    }

    for (const site of NARRATIVE_SITES) {
      expect(copy.site(site).briefing).toMatch(/^⟦.+⟧$/);
      for (const phase of ["briefing", "debrief"] as const) {
        const lines = phase === "briefing" ? site.briefingDialogue : site.debriefDialogue;
        for (const line of lines) {
          expect(copy.speaker({ id: line.speakerId }).name).toMatch(/^⟦.+⟧$/);
          expect(copy.dialogue(site, phase, line)).toMatch(/^⟦.+⟧$/);
        }
      }
    }
  });

  it("keeps anonymous and revealed patrons as distinct speaker identities", () => {
    expect(copy.speaker({ id: "surveyor" }).name).toBe("⟦Surveyor⟧");
    expect(copy.speaker({ id: "vela_norr" }).name).toBe("⟦Vela Norr⟧");
    expect(copy.speaker({ id: "buyer" }).name).toBe("⟦Buyer⟧");
    expect(copy.speaker({ id: "daro_venn" }).name).toBe("⟦Daro Venn⟧");
  });
});
