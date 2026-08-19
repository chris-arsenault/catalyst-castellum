# Tutorial information architecture

This document defines where, when, and how much field guidance appears. The
[tutorial campaign](tutorial-campaign.md) defines the mechanical teaching curve.

## Information layers

### Site briefing

The briefing presents:

- the site and contract name;
- one or two sentences of situation and stakes;
- the extraction objective;
- the known ingress, route, and wave traits;
- the control that opens construction.

The opening campaign briefing also owns the field-guidance choice. Guidance is enabled by default.
Changing the choice alters coaching while preserving the complete campaign route.

### Guided coach

The coach occupies one stable corner and leaves the full cutaway visible and interactive. Each
prompt contains a short action title, one sentence explaining its combat purpose, one concrete
instruction, progress, and a persistent skip control.

Action prompts advance after authoritative state proves the requested action occurred. The same
card then describes the visible result and waits for the player to continue. Observation prompts
use the same reflection beat after combat supplies their evidence.

### Combat feedback

Tower arcs, acquisition markers, projectiles, hit effects, damage numbers, enemy state, route
progress, Matter rewards, Core breaches, and the event log explain the live result. Tower inspection
shows current range, cadence, target policy, damage, upgrades, and contribution. The coach points to
this evidence rather than substituting a scripted success display.

### Field manual

The field manual contains durable explanations of mounting faces, line of sight, target priorities,
enemy movement, tower classes, upgrades, grafts, and later process interactions. Guidance for the
current lesson can be replayed from the manual.

## Interaction contract

- One guided target is marked at a time.
- The coach remains in one screen location.
- The board retains full visibility and interaction.
- The target outline clears after the action so the player can inspect the changed map.
- A prompt completes from game-state evidence.
- Reloading derives the correct prompt from restored campaign state.
- Escape and outside clicks preserve lesson state.
- Skipping guidance leaves the current site and campaign state unchanged.
- A missing target fails open and reports a development diagnostic.

## Claim 8-Delta sequence

The first wave teaches one complete tower-defense relationship while the vessel starts with an
exposed approach.

| Beat                   | Target                         | Completion evidence                                      |
| ---------------------- | ------------------------------ | -------------------------------------------------------- |
| Inspect the approach   | Route forecast                 | The first deckmouth path is displayed                    |
| Select a Flash Chamber | Initial tower catalog entry    | Placement mode is active                                 |
| Place on the wall      | Compatible wall surface region | A legal tower covers the marked route segment            |
| Inspect coverage       | Placed tower                   | Range and firing arc are visible                         |
| Start the assault      | Assault control                | The phase enters assault                                 |
| Observe acquisition    | First deckmouth and tower      | The tower acquires a valid target                        |
| Observe direct damage  | Combat feedback                | A hit records tower-attributed damage                    |
| Spend recovered Matter | Tower upgrade control          | The tower gains the authored grade or branch consequence |

The second wave removes click-by-click guidance and asks the player to reuse the same coverage. The
later waves add cadence and target variation while keeping the taught tower useful.

## Harker's Brace sequence

The opening wave compares one Carbon Burner on a wall with one on a ceiling. The guide shows how the
same combustion apparatus produces a long corridor field or a shorter downward fan, then teaches
Last priority through remaining route distance.

## Twelve-Cask sequence

The opening wave demonstrates one optional chemical interaction. The guide asks the player to
overlap an Acid Pot and Caustic Jet, then points to the separately attributed neutralization heat
burst. The guide does not gate assault start. Acid Pot, Caustic Jet, Flash Chamber, Carbon Burner,
and Quench Coil remain independently useful, and later waves test area coverage and route control
without requiring the reaction pair.

## Copy limits

Briefings describe work and stakes. Coach prompts state one action and its immediate purpose.
Combat readouts state measured results. The field manual owns reusable explanation. Every string
follows the in-world vocabulary and register in the narrative style guide.

## Validation

Tutorial coverage verifies that prompts resolve stable targets, commands satisfy predicates,
reflection beats preserve map inspection, guidance can be skipped and replayed, saves restore the
correct prompt, and unguided play retains the complete site sequence.
