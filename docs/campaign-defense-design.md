# Campaign defense and process progression

This document is the durable campaign-design contract for preserving Catalyst Castellum as a tower
defense game while its chemistry grows more expressive.

> Tutorials demonstrate tools. Sites test defenses. Chemistry creates strategies.

## Design boundary

A tutorial may require one concrete operation so the player can establish a control or simulation
rule. An encounter presents geometry, resources, enemies, timing, and economic pressure; it does not
prescribe a reaction chain or room configuration. Newly available chemistry expands the player's
strategic vocabulary while established defenses remain viable through soft counters and overlapping
combat roles.

The construction vocabulary remains deliberately small:

- gas agitator;
- wet contactor;
- thermal coil;
- membrane cell;
- fluorine cell;
- gas and liquid transport;
- stationary deposits and catalytic surfaces.

Build variety comes from placement, topology, upgrades, feed allocation, storage, recirculation,
temperature, pressure, and timing. Equipment remains process-general. An agitator accelerates every
eligible reaction in its room; it is not a dedicated weapon tower.

## Defense archetypes

The campaign supports overlapping archetypes rather than assigning one process solution to each
site.

| Archetype         | Primary strength                                                            | Typical chemistry                    |
| ----------------- | --------------------------------------------------------------------------- | ------------------------------------ |
| Flash battery     | Large room-wide bursts                                                      | Hydrogen and oxygen                  |
| Toxic corridor    | Continuous atmospheric exposure                                             | Chlorine, HCl, CO, and NOx           |
| Corrosive floor   | Damage combined with ground slowdown                                        | NaOH, hypochlorite, and nitric acid  |
| Stored release    | Accumulate inventory during quiet periods and trigger it into dense cohorts | Hypochlorite and acid                |
| Catalytic engine  | High sustained throughput                                                   | Carbon, iron, nitrogen, and nickel   |
| Carrier loop      | Recycle feedstock and move chemical potential between rooms                 | Iron and nickel                      |
| Pressure trap     | Extend residence and amplify other hazards                                  | Gas compression and combustion       |
| Hybrid conversion | Convert one hazard into another as wave composition changes                 | CO/H2, NO/NO2/HNO3, and UF6 fixation |

The systems should compound. Pressure and liquid drag extend exposure. A Glowbag can contribute
hydrogen to a prepared oxygen room. Catalysis can sustain damage through an Anchor field. Stored
chlorine can remove a dense cohort while a continuous line catches stragglers.

## Site authoring contract

A site authors:

- geometry and defensive room opportunities;
- starting feedstocks, deposits, and supply offers;
- Matter budget and installed infrastructure;
- visible wave composition, timing, and approach;
- environmental complications;
- several useful but incomplete strategic opportunities.

A site objective describes the defensive state: hold the Core, contain an approach, or maintain a
boundary. It does not require a named reaction, species, room, or ordinary machine after that
machine's tutorial demonstration.

Every open-defense site must support:

1. an efficient direct counter;
2. a higher-throughput version of another established defense;
3. a hybrid solution combining control and damage.

Enemy resistance changes efficiency rather than creating a key-and-lock immunity. Site supplies
must support at least three credible offensive directions. Exotic transmutation may provide an
expensive recovery route, but it must not be the site's primary answer.

## Process introduction curve

| Site           | Capability introduced                             | Encounter relationship                                                  |
| -------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| Claim 8-Delta  | OX-1 and basic gas defense                        | Required once to establish the game                                     |
| Harker's Brace | Membrane chemistry and continuous hazards         | Guided demonstration followed by free construction                      |
| Twelve-Cask    | Storage and delayed release                       | Adds a new cadence rather than prescribing the defense                  |
| Morrow Pocket  | None                                              | First site supporting several complete builds                           |
| Kettleblack    | Stationary deposits, reversibility, and catalysts | Final guided mechanical demonstration; established builds remain viable |
| Cordon 41      | Nitrogen feedstock and reactions                  | Optional sustained-damage family                                        |
| Junction L-6   | Nickel transport chemistry                        | Optional carrier and catalyst family                                    |
| Pell Cut       | Fluorine cell                                     | One equipment description and an optional high-risk generator           |
| Station 14     | Uranium-bearing material                          | One element description and an optional containment/radiation family    |
| Vasker Store   | None                                              | Existing systems prepare the required boundary state                    |
| Lane Six       | None                                              | Existing defenses answer geometry and enemy composition                 |
| Pell Cordon    | None                                              | Campaign-wide synthesis with multiple valid portfolios                  |

After Kettleblack, process information belongs in concise equipment, element, reaction, and mission
entries. Later sites teach by exposing one leg of a process in a readable starting state and adding
branches across rounds. They do not use modal or click-through process tutorials.

## Encounter diversity requirements

Every site from Morrow Pocket onward must pass the following automated and authored checks:

- at least four materially distinct reference builds clear the site;
- at least two clearing builds omit the chemistry introduced at that site;
- at least one clearing build combines two process families;
- doing nothing loses;
- ordinary machines, reactions, species, and rooms are absent from victory conditions;
- useful placements exist in more than one combat room;
- an established build can be extended rather than discarded;
- enemy mixtures reward several roles while retaining soft counters;
- solution diversity is measured from actual equipment, topology, room use, and damage contribution,
  not merely from an authored strategy label.

Efficient counters may finish healthier or cheaper than general solutions. The goal is a viable
envelope, not identical performance.

## Player information requirements

Build decisions require an actionable wave forecast during the build phase:

- enemy types and levels;
- cohort sizes and approximate cadence;
- support-enemy combinations;
- flying, climbing, armored, and reagent-emitting traits;
- expected approach or route where topology offers more than one.

The Encyclopedia explains behavior. The forecast identifies which behavior matters in the next
round. Reaction presentation exposes equation, current direction, rate, limiting input, catalyst,
inhibitor, temperature window, and pressure window so later chemistry can be understood without a
tutorial.

## Implemented campaign systems

### Diversity-aware evaluation

Each open site owns a portfolio of named, round-aware reference builds. A portfolio can extend,
upgrade, refill, and change operating state between waves. Evaluation records success, Core
integrity, Matter economy, footprint, combat rooms, damage sources, pulse and continuous
contribution, and slowdown-created residence. Derived signatures enforce actual physical diversity
rather than authored strategy labels.

Seeded mutations measure robustness around a valid build. The reference portfolio remains the
acceptance authority for materially distinct strategies.

### Wave forecast

The build-phase forecast presents enemy types and levels, approximate formations, cadence, physical
approach, and localized movement/support/emission traits. Tooling retains exact spawn times for
replay and balance analysis.

### Site-authored supply economy

Each supply binds to a same-phase tap and physical utility node. Initial inventory and refill
packets list explicit species quantities, capacity, Matter price, availability round, and
replenishment behavior. Compilation validates phase, host room, tap, node geometry, packet content,
capacity, and price.

### Open-defense progression

Morrow Pocket is the first complete open-defense acceptance site. It begins with blank sockets and
unbuilt routes, exposes the established Act I vocabulary, supports five independently constructed
defenses, and loses under idle play.

Act II runs from Kettleblack through Pell Cut on distinct generated geometry, site economy, five
mixed waves, and five reference portfolios. Kettleblack contains the final guided process lesson;
Cordon 41 onward uses concise process descriptions and open assaults.

Act III runs from Station 14 through Pell Cordon with cumulative equipment access and the same
five-portfolio contract. Station 14 contains the campaign's uranium description. Vasker Store, Lane
Six, and Pell Cordon introduce no controls and test composition, adaptation, scale, feed economy,
and campaign-wide synthesis.

### Mathematical balance

The source-of-truth workbook runs first-order and transient second-order balance against every
reference build. It covers 30 reaction capacities, site reservoir feed and depletion, conduit
hold-up, 13 exact damage families, enemy route residence, slowdown, level scaling, resistance,
behavior durability, Matter efficiency, and per-round wave coverage. Efficient counters, general
defenses, hybrids, and specialized builds occupy distinct but overlapping cost and survival bands.
Campaign health fails when only one strategy consistently clears an open site, even when that
strategy is numerically balanced.

HF uses a dedicated physical G-2 reservoir at Pell Cut and throughout Act III. Established gas
defenses draw ordinary feed from the Core G-1 header, while fluorine and uranium strategies route
the Reservoir service supply through a Gallery Fluorine Cell. Exact damage attribution and Anchor
absorption ledgers keep the transient matrix separated by chemistry rather than broad hazard
channel.
