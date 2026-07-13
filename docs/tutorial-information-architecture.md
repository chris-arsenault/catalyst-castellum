# Tutorial information architecture

Status: accepted implementation direction, July 2026.

This document defines how Catalyst Castellum teaches. It complements
[`tutorial-campaign.md`](./tutorial-campaign.md), which defines _what_ each checkpoint teaches.
This document defines _where_, _when_, and _how much_ tutorial information appears.

## Research synthesis

Josh Strife Hayes' [How to Design a Tutorial](https://www.youtube.com/watch?v=45csSEotJY8)
argues for teaching a mechanic in a safe situation, requiring the player to use it, and only then
combining it with previously learned mechanics. The tutorial should share the main game's visual,
audio, and narrative language instead of feeling like a detached training product.

The practical lesson for Castellum is not merely “use less text.” It is:

1. Introduce one causal relationship at a time.
2. Put the player in the real simulation and make the taught action necessary.
3. Give immediate, legible evidence that the action changed the system.
4. Ask for recall and combination in later rounds, with less guidance.

This matches Apple's guidance to [teach through interactivity and place concise instructions near
the referenced control](https://developer.apple.com/design/human-interface-guidelines/onboarding),
and its game-specific advice to use
[one short step, demonstrate competency, then reduce guidance](https://developer.apple.com/app-store/onboarding-for-games/).
Josh Bycer's separate article on
[effective tutorial game design](https://www.gamedeveloper.com/design/important-tips-for-effective-tutorial-game-design)
adds a useful implementation test: a lesson is not complete because the player clicked “Next”; it
is complete when the player has performed the mechanic and the game has verified the result.

The Hayes source is the design spine. The Apple sources inform accessibility and UI placement.
The Bycer article is supporting material and is not attributed to Hayes.

## The four information layers

Tutorial information has four homes. Copy must not leak between them.

### 1. Checkpoint briefing: why this round exists

The between-level popup contains only:

- the checkpoint and lesson name;
- one or two sentences of situation and stakes;
- the round objective in outcome language;
- one button that enters the control room.

It does not explain every control, the whole chemistry tree, or the complete phase model. Its job is
orientation, not operation.

The opening briefing also owns the one campaign-level tutorial choice. **Enable guided tutorial**
is checked by default. Turning it off skips the entire Flash Point checkpoint, records that level as
complete, and enters Make the Reagent in frozen planning. This is distinct from the coach's **Skip**
button, which hides guidance without changing the current level or plant.

### 2. Guided coach: the next concrete action

The coach is a small popup in one stable lower-corner location. The full board remains visible and
interactive while a slow, high-contrast outline marks the current control. Each prompt has:

- a short title naming the action;
- one sentence explaining _why_ it matters;
- one imperative telling the player exactly what to click or observe;
- progress and a persistent option to skip guidance.

Action prompts have no “Next” button before the action. After authoritative game state proves the
action happened, the same card remains in place, explains the visible result, and offers **Continue
when ready**. Observation prompts use the same reflection beat after the simulated result occurs.
This prevents the coach from jumping away before the player can inspect the map, while keeping
tutorial state synchronized with plant state.

### 3. Plant feedback: what actually happened

Room composition, conduit inventory and flow, reaction telemetry, current conditions, durable combat
incidents, map shock markers, enemy attribution, and the event log form the evidence layer. Current
effects answer “what is true now”; recent incidents answer “what discrete event just happened.” The
coach points to these readouts but never replaces them with a canned success animation.

### 4. Field manual: durable reference

Concepts that are useful more than once belong in the field manual. The manual is optional,
reopenable, and includes a way to replay guidance for the current lesson. It is not a prerequisite
modal.

## Interaction contract

- Only one guided target is marked at a time.
- The coach stays in one screen location; it does not chase controls around the viewport.
- There is no dimming mask or focus trap. The entire board remains readable and interactive.
- The target outline disappears after the action so the changed control and map can be inspected.
- The coach may scroll an inspector target into view, but it does not change simulation state.
- A prompt is satisfied by a game-state predicate, never elapsed UI time; the player controls when
  to leave its reflection beat.
- The first guided prime incident pauses the process before automatic assault. This preserves the
  real incident and Start Assault action for unhurried inspection; starting assault resumes normally.
- Reloading derives the correct prompt from the restored plant state.
- Escape and outside clicks do not accidentally advance a lesson.
- Guidance can be skipped and can be replayed from the field manual.
- If a target cannot be resolved, the guide fails open: the game remains usable and reports the
  missing target in development instead of trapping the player behind an opaque mask.

## First authored sequence: Flash Point

The first round is the reference implementation because it contains one complete cause-and-effect
loop while the plant starts inert.

| Beat                   | Anchor                   | Why                                                                            | Completion evidence                        |
| ---------------------- | ------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------ |
| Install mixing         | R-02 Gas Agitator choice | R-02 is on the hostile corridor and is the endpoint of the installed Core duct | A Gas Agitator is installed in R-02        |
| Start shared duct      | Core–R-02 gas fan        | One fan moves the complete visible H₂/O₂ header mixture                        | The one gas conduit is on                  |
| Start physics          | Begin timed prime        | Planning changes configuration; priming sweeps real routed volume              | Phase changes from Plan to Prime           |
| Accelerate time        | Simulation speed         | 2× advances identical transport and reaction rules                             | Simulation speed is 2×                     |
| Inspect empty flash    | R-02 recent incidents    | A prime flash proves cycling but records zero targets                          | A durable prime OX-1 incident exists       |
| Introduce hostiles     | Start assault            | The attack matters only when an enemy physically occupies R-02                 | Phase changes from Prime to Assault        |
| Inspect attributed hit | R-02 recent incidents    | The incident identifies actual pressure/heat damage and kills                  | An assault OX-1 incident records a kill    |
| Confirm the model      | Paused full board        | Core stock → duct → accumulation → attack is now independently inspectable     | Player finishes after inspecting the board |

Round 2 deliberately has no click-by-click coach. It asks the player to reuse the chamber and judge
whether the persistent state is sufficient. That reduction in assistance is the competency check.

## Library decision

The implementation uses [React Joyride v3](https://react-joyride.com/docs/new-in-v3). It has React
19 support, accessible tooltip/focus behavior, target interaction through the spotlight, nested
scroll-container handling, and a controlled mode. Controlled mode matters here because the
simulation owns satisfaction predicates; the tour layer owns only stable card positioning, target
scrolling, and accessibility.

The authored lesson model is kept outside the library component. Replacing the rendering library
must not require rewriting completion predicates or tutorial copy.

## Copy limits

- Briefing situation: at most two sentences.
- Coach explanation: one sentence, preferably under 22 words.
- Coach instruction: one imperative sentence.
- One new noun or causal relationship per beat.
- Chemical notation may accompany a common name, but notation alone is never the instruction.

## Validation

The guided layer needs tests beyond “the tooltip rendered”:

- target marker and instruction appear after the briefing;
- clicking the marked target keeps the card stable and reveals its result explanation;
- unrelated room and map controls remain usable before the player continues;
- Continue advances to the next authored prompt only after its predicate is satisfied;
- unrelated UI cannot be clicked through the mask;
- a reload resumes at the prompt implied by the restored plant state;
- the prime observation requires a real zero-target combustion incident;
- the combat observation requires a real assault incident with an attributed enemy kill;
- skip removes the layer and replay restores it;
- the experience remains usable at the compact desktop viewport.

The standalone Monte Carlo playtester remains UI-independent. Tutorial overlays must not enter the
simulation engine or the normal CI play loop.

Browser interaction tests use `?e2eTest=1`. That flag is honored only by a Vite development build:
it freezes the interval clock, then uses the same conserved OX-1 reaction, central damage resolver,
incident recorder, and guide predicates to create deterministic prime and assault evidence after
the required player actions. It does not inject a tutorial-complete flag or bypass domain rules.
The production build ignores the query flag, and the simulation command API contains no test-only
command.
