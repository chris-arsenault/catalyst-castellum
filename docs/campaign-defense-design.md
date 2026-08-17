# Campaign defense design

This document defines the campaign's durable game-design contract.

> Tutorials demonstrate tools. Sites test defenses. Geometry creates strategies.

## Premise

A licensed Deep Shear Ratter crew operates a mostly unmanned claim rig at stand-off range. Its
remote cutter couples recovered material into the rig's foundry. Cthonic beasts caught in the
cutter wake cross through the outer receiving breach and follow the strongest resonance tone toward
the Core.

The player installs automated defenses throughout the rig and coupled site rooms. The foundry
continues the extraction while each hostile column crosses. Holding the Core through the operation
completes the claim and advances the campaign.

## Campaign structure

The campaign follows twelve authored sites across three acts:

- **Good Standing** establishes licensed Ratter work, the crew's competence, and the first measured
  disagreement in the cutter return.
- **The Same Grade** places the foundry between Displacement Council caution and Coremark scale,
  ending with the Pell emergence.
- **A New Boundary** turns the rig into a Council containment asset and closes the Near Voice's
  newborn boundary.

Each site contains five waves, an authored map and route graph, a visible forecast, a starting
construction state, and one or more viable defensive arrangements. Campaign saves retain the hull,
grafts, hull-mounted towers, upgrades, Matter, Core integrity, narrative progress, and field-guidance
choice. A failed operation retries from that site's authored checkpoint.

## Encounter loop

1. **Briefing** presents the contract, coupled geometry, known enemy columns, and extraction goal.
2. **Construction** freezes movement while the player places, upgrades, reorients, or dismantles
   towers and inspects route coverage.
3. **Assault** advances the deterministic simulation. Construction and upgrades remain available
   while running or paused, and neutralized enemies yield Matter immediately.
4. **Report** records kills, breaches, Core integrity, Matter, tower contribution, and the work
   completed during the wave.
5. **Intermission** opens construction for the next wave or returns the crew to the captain's log
   after the site is secured.

The first assault begins from a readable defensive commitment. Tower acquisition, aim, attacks,
hits, enemy state changes, and breaches appear directly on the cutaway map.

## Vertical world

Combat uses a side-view grid of rooms, passages, platforms, doors, ladders, shafts, and open air.
Architecture determines enemy movement, tower placement, line of sight, projectile travel, and the
time available before an enemy reaches the Core.

Maps expose one or more ingress points and an authored route graph. Routes may branch, cross
different elevations, and rejoin. Grounded enemies walk supported surfaces, climb compatible
ladders, fall through open drops, and pass through open portals. Flyers traverse open room volume.
Enemy archetypes apply deterministic movement costs to those edges.

The forecast shows each column's ingress, expected path, movement traits, composition, and cadence.
When topology changes, route selection recomputes from the same authored graph and movement rules.

## Tower placement

Ordinary towers mount freely on compatible architectural surfaces and snap to the world grid. A
placement consists of an anchor cell, a surface face, an occupied footprint, and an orientation.
Floors, ceilings, left walls, and right walls provide distinct firing positions.

Placement validity derives from:

- compatible surface and tower class;
- contiguous structural support across the tower's footprint;
- clearance from portals, ladder mouths, graft joints, other towers, and occupied cells;
- an orientation allowed by the tower and mounting face.

The placement preview shows the rendered tower, firing arc, range, line-of-sight obstructions, valid
target layers, and covered route segments. Architecture remains visible beneath the preview.

Mounting direction changes tower use. A wall burner projects along a corridor; the same chassis on
a ceiling covers the deck below with a shorter downward fan. Direct-fire towers respect solid
architecture. Authored exceptions such as ballistic arcs, drops, or penetrating attacks state their
geometry explicitly.

## Tower contract

Every tower definition owns:

- build cost and upgrade costs;
- footprint and compatible mounting faces;
- range, firing arc, cadence, and target capacity;
- valid target layers and line-of-sight policy;
- damage packets and visible projectile or effect behavior;
- targeting priorities available to the player;
- grade or branch upgrades and their exact consequences.

Direct tower attacks provide the campaign's primary combat output. Common targeting policies include
first, last, strongest, weakest, armored, flying, and support. First and last compare remaining
route distance or travel time to the Core across every active lane.

The initial vocabulary covers reliable single-target damage, rapid target service, area damage,
route control, upper-space coverage, and support. Each later chassis changes a placement or target
question rather than duplicating an existing tower with a new coefficient.

## Enemies and waves

The eight Cthonic field names retain stable, readable identities:

| Enemy       | Defensive question                                                            |
| ----------- | ----------------------------------------------------------------------------- |
| Deckmouth   | Does ordinary coverage supply enough damage before the Core?                  |
| Flintjack   | Can towers acquire and service fast targets across route transitions?         |
| Shear-jelly | Which mounts and arcs cover upper room volume?                                |
| Splitback   | Where does the shell break, and which tower catches the exposed runner?       |
| Redlung     | Can sustained focused fire defeat a durable column anchor?                    |
| Clatter     | Which placements retain coverage when ladder travel accelerates?              |
| Anchor      | Can targeting expose or remove the field-bearer protecting its cohort?        |
| Glowbag     | Can upper coverage remove a gas-bearing support target before it reaches aft? |

Enemy count consumes finite tower cadence and target capacity. Wave composition combines route,
speed, elevation, armor, support relationships, and spawn timing. Resistance and special states
remain visible properties of an archetype rather than hidden level bonuses.

## Matter and upgrades

Neutralized enemies and completed extraction work yield Matter. The same campaign economy funds
tower installation, tower upgrades, and room grafts. Immediate tower decisions consume modest
amounts; permanent hull geometry consumes the equivalent of many upgrades.

Tower upgrades improve explicit attributes or add authored behavior. Upgrade presentation shows the
before and after range, cadence, damage, target capacity, arc, or special rule. Dismantling returns
the authored recovery value.

At departure, tower value installed on disposable site geometry returns to the campaign economy.
Hull-mounted towers and their upgrades remain installed.

## Room grafts

Hull rooms expose authored graft joints. A room-module template defines its footprint, connecting
joint, interior architecture, tower-compatible surfaces, any purpose-specific equipment slots, and
Matter cost. Grafting occurs from the hangar between operations.

A graft provides persistent geometry and coverage opportunities. Narrow pods create firing lanes
through their joint; tall bays provide new ceiling and wall relationships; reinforced decks support
larger footprints. Process-oriented grafts may later provide storage, transport, or atmosphere
capacity alongside their tower surfaces.

A graft costs roughly six to ten ordinary upgrade steps. Campaign income supports two grafts under
ordinary spending and a third through deliberate saving. Price supplies the campaign constraint;
the system imposes no separate graft count.

## Chemistry and transport

The foundry's chemistry, finite inventories, gas and liquid transport, temperature, pressure, and
atmospheric state remain deterministic world systems. The first tower-defense sites use neutral
rooms and self-contained towers so placement, targeting, routing, and upgrade decisions establish
the combat foundation.

Later sites connect the process systems to visible tower and battlefield effects. A pipe can supply
an alternate firing mode or improved operation, a vent can move a visible cloud through an opening,
a spill can alter a ground route, and a tower or enemy can produce a bounded atmospheric byproduct.
Each effect states its source, destination, capacity, and combat consequence.

## Site authoring contract

A site authors:

- the narrative job and extraction objective;
- vertical room geometry and the attached hull position;
- ingress points, route branches, joins, and movement surfaces;
- compatible tower-placement surfaces and sight lines;
- starting Matter, hull state, and campaign availability;
- five visible waves with enemy paths, composition, and cadence;
- any site-owned towers, doors, hazards, or later process connections;
- several useful but incomplete defensive opportunities.

Open-defense sites support materially different arrangements of tower classes, placements, upgrades,
targeting priorities, and route coverage. A reference portfolio records physical builds and exact
runtime outcomes, while human playtesting remains authoritative for discoverability and combat feel.

## Campaign acceptance

Every site satisfies these contracts:

- doing nothing loses;
- the forecast identifies the movement and support traits that matter in the next wave;
- a valid defense deals visible damage shortly after the first target enters range;
- enemy count strains target service and firing cadence;
- useful placements exist on more than one surface or route segment;
- more than one defensive arrangement clears each open site;
- leaks can be attributed to coverage, capacity, targeting, damage, or economy from the map and
  report;
- established tower investments remain useful as the campaign adds new geometry and enemies;
- the site's narrative work and mechanical objective describe the same operation.
