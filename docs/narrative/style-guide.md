# Narrative and copy style guide

This guide governs every player-facing English string: campaign narrative and dialogue
(`src/localization/locales/en/narrative.ts`), mission and round copy (`levels.ts`), tutorial guides
(`tutorials.ts`, `tutorialFlash.ts`, `tutorialAcid.ts`), and interface text (`ui.ts`, `uiMap.ts`,
`entities.ts`, `events.ts`, `manual.ts`, `presentation.ts`). Canon — who exists, what happened, what
each character wants — lives in the [lore bible](lore-bible.md). Sentence-level mechanics for
interface strings live in [AGENTS.md](../../AGENTS.md). This guide covers voice: how the words
sound, and which words stay out.

## The one rule: stay in the world

Every string a player reads is written from inside the setting. The game presents itself as the
operations record of a licensed Ratter crew working the Deep Shear, and nothing on screen admits to
being a game.

- Copy addresses the player as the plant operator aboard the rig, never as someone playing software.
- Copy describes work, contracts, sites, and hazards, never difficulty, progression design, or
  teaching intent. A first job is a small licensed claim, never "an easy level to learn the basics."
- Characters know their world and their jobs. They never explain a mechanic as a mechanic, reference
  menus, or acknowledge rounds as designed encounters.
- Chrome that manages the software itself — save slots, audio settings, pause, restart warnings —
  is exempt and speaks plainly ("Restart returns plant, campaign, and tutorial progress to the
  beginning.").

## Vocabulary

Curriculum language breaks the fiction. Use the in-world term everywhere a player can read it:

| Write                        | Instead of                                |
| ---------------------------- | ----------------------------------------- |
| site, claim, operation       | level, checkpoint, mission (as chrome)    |
| contract, work order         | lesson, assignment, quest                 |
| field drill                  | tutorial (the guided Flash Point opening) |
| trial, commissioning run     | exam, test (of the player)                |
| assault, wave, column        | round (when narrating), encounter         |
| the crew, the rig, the plant | you the player, the game                  |

Mechanical identifiers stay stable regardless of display copy: level IDs, dialogue line IDs, and
speaker IDs in `src/game/content/narrativeCampaign.ts` never rename for tone reasons.

## Three registers

**Campaign narrative** — act introductions, site briefings, dialogue. Prose written to the lore
bible's rules:

- Act introductions are two paragraphs of setting: where the crew is, how people live and work
  there, and what changed since the previous act.
- A dialogue turn states what the speaker wants, what concrete fact they know, or what action
  follows. No strings of atmospheric fragments.
- Setting terms enter through context on first use — a Ratter is shown as a licensed salvage
  worker before the word carries weight alone.
- Anomalies are measurements: clocks that disagree by six seconds, samples that react at the same
  instant, a wall reported in two locations. Characters interpret; instruments record.
- Voices use ordinary contractions, varied sentence length, and each character's professional
  vocabulary from the lore bible's cast guide.

**Mission copy** — level kickers, briefings, lessons, round details and objectives. Work-order
voice: terse, concrete, in-world, and mechanically exact. Every chemical fact the player needs
survives the tone ("The Core starter header holds H₂ and O₂ near their combustion ratio, and its
gas duct reaches R-02"). Objectives are direct orders to the operator: "Install a Gas Agitator in
R-02 and switch on the Core–R-02 gas duct."

**Interface copy** — labels, readouts, buttons, manual entries. Instrument voice: short, factual,
present tense, governed by the AGENTS.md copy rules. The facility manual is an in-world works
archive and may be instructional without being meta.

## Prose quality

Good plain English beats both sterile spec-sheet copy and decorated copy.

- Prefer concrete nouns and specific consequences to abstractions. "Inside the cordon, its crews
  are still counting the people who didn't get out" carries more than "the situation is dangerous."
- One image per sentence at most. Cut a flourish before cutting a fact.
- Vary sentence length; let short sentences land the point.
- Avoid stock dramatic constructions: rule-of-three flourishes, "little did they know," rhetorical
  questions, and adjective stacking. If a sentence would fit any grim sci-fi setting, sharpen it
  until it could only belong to this one.
- Stakes come from work: pay, debt, licenses, tow windows, crew safety, and people coming home —
  per the lore bible's "work before destiny" pillar.

## Names and terms

- Enemy catalog names capitalize as proper entries ("Deckmouth", "Flintjack"); running prose uses
  them as lowercase common nouns ("a deckmouth column", "flintjacks slip through"). Hyphenated
  names keep the hyphen in both forms ("Shear-jelly", "a shear-jelly drifts").
- The player vessel stays unnamed. Characters say the rig, claim rig, vessel, cutter platform, or
  foundry.
- Established setting terms (Deep Shear, Ratter, Bloom, ringglass, KITE, Coremark, Displacement
  Council, Near Voice) follow the lore bible's canon boundary and capitalization.
- Room codes (R-02, CL-04), species formulas (Cl₂, NaOCl), and units appear verbatim in any
  register; precision is part of the voice.

## Review checklist

Before completing a copy change:

1. Read each new string asking "who in the world is saying this?" Chrome may answer "the software";
   everything else names a speaker, a record, or the operations voice.
2. Search the diff for curriculum vocabulary (lesson, tutorial, curriculum, checkpoint, exam,
   level-as-copy) outside chrome and the tutorial opt-in.
3. Check dialogue against the speaker's voice notes in the lore bible.
4. Apply the AGENTS.md affirmative-copy rules to interface strings.
5. Run `pnpm locales:check` and `pnpm copy:check`.
