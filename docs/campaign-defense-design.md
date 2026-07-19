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

## Implementation sequence

Current status:

- Diversity-aware evaluation is implemented with round-aware reference portfolios and derived build
  signatures.
- The build-phase wave forecast is implemented with runtime-bound composition, levels, approximate
  formations, cadence, physical approach, and localized mechanical traits.
- Site-authored supply economy is implemented with physical reservoirs, explicit conserved charge
  packets, capacity, Matter cost, replenishment policy, and stable round availability owned by each
  site.
- Morrow Pocket is implemented as the first complete open-defense acceptance site. It starts with
  blank equipment sockets and unbuilt routes, exposes only established Act I tools, defeats an idle
  Core, and supports five independently constructed defenses with five derived build signatures.
- Act II is mechanically bound from Kettleblack through Pell Cut. Each site has a generated geometry,
  site-owned economy, five mixed waves, and five reference portfolios. Kettleblack contains the
  final guided Prime lesson; Cordon 41 onward uses concise process descriptions and open assaults.
  Exact campaign replay clears all twenty Act II references at 51–100% Core integrity while idle
  defense loses every site.
- Act III is mechanically bound from Station 14 through Pell Cordon. Each site has cumulative
  equipment access, a distinct generated geometry and economy, five mixed waves, and five physical
  reference portfolios. Station 14 contains the campaign's single uranium description; later sites
  introduce no controls. Exact replay clears all twenty Act III references at 50–100% Core
  integrity while idle defense loses every site.

### 1. Diversity-aware evaluation

Replace the singular intended plan with a portfolio of named reference builds. Plans own actions and
prime timing per round so they can extend, upgrade, refill, or change operating state between waves.
Evaluation records success, Core integrity, Matter economy, footprint, combat rooms, damage channels,
reaction sources, pulse/continuous contribution, and slowdown-created residence. It derives a build
signature from those facts and applies the encounter-diversity requirements above.

Random exploration must construct valid strategies from the available command grammar. Removing or
misplacing pieces of one reference plan is useful robustness testing, but it is not solution search.

### 2. Wave forecast

Add the build-phase wave forecast and localized trait summaries. Keep exact simulation timings
available to tooling while presenting approximate cohorts and cadence to the player.

### 3. Site-authored supply economy

Generalize supply authoring beyond the introductory hydrogen/oxygen header, water tank, and brine
tank. Site supply offers declare conserved charge contents, capacity, Matter cost, and availability.
Elements, equipment, and physical inventories determine available chemistry; reactions do not gain
arbitrary campaign locks.

Each supply belongs to a level and binds to a same-phase tap and physical utility node in the site
map. Its initial inventory and refill packet list explicit species quantities. Replenishment is
either continuous or a conserved packet purchased with Matter. The authoring compiler validates
phase, capacity, price, availability round, host room, tap, and utility-node geometry. Adding a new
feedstock therefore requires site data and physical placement, not a new command, UI branch, or
reaction gate.

### 4. Morrow Pocket diversity proof

Morrow Pocket is the first complete acceptance case. Its open plant supports OX-1 burst, continuous
chlorine/HCl, corrosive liquid with slowdown, stored hypochlorite release, and hybrid flash/corrosion
defenses. Each reference defense purchases its own equipment and transport topology from the same
Act I vocabulary. Automated acceptance runs the complete waves through the authoritative command
and simulation path, verifies five surviving archetypes and five physical signatures, and verifies
that an undefended Core falls.

### 5. Act II mechanical sites

Kettleblack through Pell Cut are complete mechanical level definitions. Their identities come from
cadence, locomotion, support composition, generated geometry, and site economy rather than a named
victory process. Kettleblack teaches stationary inventory, live reaction direction, and catalyst
behavior during Prime, then releases the player into an open assault. Cordon 41, Junction L-6, and
Pell Cut add optional nitrogen, nickel, and fluorine strategies through established controls.

### 6. Act III mechanical sites

Station 14 through Pell Cordon are complete mechanical level definitions with cumulative equipment
access. Station 14 supplies the single uranium description and room-bound UO₂F₂ stock. Recovery uses
the established Fluorine Cell, dry heat, gas transport, wet conversion, and stationary inventory.
Vasker Store, Lane Six, and Pell Cordon introduce no controls; their waves test composition,
adaptation, scale, feed economy, and complete-campaign synthesis.

### 7. Mathematical balance

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
