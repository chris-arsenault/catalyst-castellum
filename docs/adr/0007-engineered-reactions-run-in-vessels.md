# ADR-0007: Engineered reactions run in vessel classes

Date: 2026-07-22
Status: accepted

## Context

The chemistry catalog holds 30 reactions. Two run inside electrolysis cells; the other 28 are
ambient — every room attempts every eligible reaction each fixed step, and eligibility is a product
of continuous rate factors (temperature windows, pressure ratios, catalyst inventory, contact
phase) that are invisible until they reach zero. Equipment is process-general: an agitator or
contactor multiplies every eligible reaction in its room. Playtesting shows the result is opaque —
the player cannot point at any object in the world that owns a reaction, and planning a defense
requires reverse-engineering hidden activation windows across a 30-reaction space. The two cells
are the game's most legible mechanics precisely because machine and reaction are the same object.

## Decision

Engineered reactions run only inside vessel classes. A small set of process-shaped vessels —
Catalytic Reactor, Packed Bed, Catalytic Burner, and Absorber Column, joining the existing
Membrane and Fluorine Cells — hosts all engineered chemistry, and the loaded catalyst or bed
medium selects
which reaction a vessel runs. Each vessel presents a spec plate: the resolved equation, feeds,
outputs, rate, and limiting factor.

A wild set of spontaneously occurring reactions stays ambient under one classification rule: a
reaction that proceeds spontaneously in open air or open water in reality remains room chemistry;
a reaction that requires engineered conditions — a driven catalyst bed, sustained high temperature
or pressure, electrolytic current — runs in its vessel. Combustion, recombination, dissolution,
neutralization, hypochlorite chemistry, nitric oxide oxidation, and UF₆ hydrolysis remain ambient.
Gas agitators and wet contactors continue to accelerate the wild set; thermal coils continue to
heat rooms.

This decision supersedes the campaign contract clause that kept every machine process-general.
Vessels are process-specific by design; the wild set preserves the emergent, room-scale
consequence layer.

## Alternatives considered

- **One dedicated machine per engineered reaction** — maximum build-menu legibility, but a
  catalog of ~20 single-purpose machines with the largest content, balance, and copy surface, and
  a reaction choice frozen at install time rather than kept as a strategic loadout decision.
- **One vessel per process family** — the smallest catalog, but a family vessel internally remains
  a multi-reaction soup selected by feeds, which recreates the opacity this decision removes.
- **Keep ambient chemistry and improve telemetry only** — richer readouts of direction, rate, and
  limiting factor were already present and did not reduce the effective possibility space the
  player must plan across; rejected as insufficient.

## Consequences

- The engine gains a general vessel operation runner; the current runner and its authoring
  validation accept only electrolysis behavior.
- Reaction definitions gain an authored vessel/catalyst binding, and ambient dispatch excludes
  vessel-bound reactions.
- Vessels carry a new catalyst loadout selected through typed commands, and the cell status panel
  generalizes into the spec plate for every vessel class.
- Reference portfolio builds, the balance workbook's throughput model, and the flash and acid-line
  tutorial concept models are re-authored against vessels; keeping combustion and recombination in
  the wild set preserves most existing tutorial structure.
- Simulation results change for existing saves; the content version increments.
