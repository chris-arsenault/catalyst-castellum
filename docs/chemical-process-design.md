# Chemical process model

Chemistry remains part of the vessel, its fiction, and its deterministic world simulation. Direct
towers carry the primary defense loop. Process systems enter campaign combat through explicit tower
supply, atmospheric byproducts, environmental fields, and resource preparation.

## Design role

The process model supports four kinds of play:

- the vessel converts recovered material while its remote cutter holds a claim;
- pipes deliver finite feedstock, coolant, oxidizer, or prepared material to compatible equipment;
- towers and enemies can change room atmosphere through conserved emissions;
- environmental state can modify tower operation, enemy movement, visibility, or damage channels.

The first two campaign sites use self-contained towers and neutral environmental conditions. Later
sites add one process relationship at a time, preserving a viable direct-tower defense while giving
the chemical system strategic value.

## Tower process identities

Every chassis carries a self-contained, metered service charge whose name and attack explain a
specific chemical operation. The Flash Chamber burns a small hydrogen-oxygen charge, the Caustic Jet
sprays sodium hydroxide, the Carbon Burner oxidizes carbon-steam fuel, the Acid Pot throws a sealed
hydrochloric-acid charge, the Quench Coil condenses a cooling field, the Wash Head discharges a wet
scrubber burst, and the Carbonyl Marker deposits a nickel trace.

These identities determine damage channels, geometry, effects, animation, and upgrade language.
They do not require the player to synthesize ammunition. A neutral room supports each chassis at its
published base stats.

Three interfaces connect direct combat to the deeper process model:

- Acid and Caustic coatings react on one enemy. The second coating consumes both and applies one
  neutralization heat burst.
- A later supplied Carbon Burner can ignite a declared hydrogen field, consuming its authored
  amount and producing a bounded steam wake.
- A later Wash Head connection can remove a declared airborne field and place its finite waste in
  the named destination inventory.

Each interface is binary at the decision point, visible before it resolves, and capped by its
source. A reaction improves a useful direct defense; it does not create the only functional defense.

## Conservation boundary

Species definitions own formulas, elemental composition, phase properties, heat capacity, density,
and hazard contributions. Reaction definitions own stoichiometry and typed rate behavior. The
authoring compiler rejects unbalanced reactions.

Chemical transformations conserve elemental inventory inside the simulated world. Resonance-band
transmutation changes where a coupled process occurs and which material response becomes local; it
does not create unaccounted matter. Combat effects that consume or emit material use the same
inventories as transport and reactions.

Matter is the campaign construction currency and remains separate from chemical mass. An enemy may
award Matter while leaving conserved residue in the world; the two values serve different systems.

## Inventory and phase model

Rooms retain four physical inventories:

- lower gas;
- upper gas;
- pooled liquid;
- stationary solid or deposited material.

Temperature, pressure, density, elevation, liquid surface, port height, headroom, and equipment
volume determine phase behavior and transport. Species amounts are finite. A reaction, pipe, tower,
or enemy cannot consume more material than its source contains or add more than its destination can
accept.

Equipment ports and process lines hold persistent inventories. Closing a line isolates its contents;
opening it restores transport from the existing state. Saving and restoring a campaign preserves
these inventories when they belong to the vessel hull.

## Reaction execution

Ambient reactions use a simultaneous fixed-step pass:

1. snapshot each room inventory;
2. calculate eligible forward and reverse requests from that snapshot;
3. allocate competing requests proportionally when they demand the same reactant;
4. apply the conserved delta once;
5. make products eligible on the next simulation step.

This prevents catalog order from creating process priority. Engineered transformations use typed
equipment operations with instance-local input, output, headroom, power, rate, and telemetry.

A campaign mechanic names the relevant reaction or equipment operation directly. The player should
never need to inspect the full reaction catalog to infer why a tower fired or why a room changed.

## Transport

Gas and liquid lines carry one complete phase mixture through a routed, finite inventory. Route
length controls line hold-up and response time. Fans and pumps are binary actuators; passive lines
follow modeled gradients. Shared junctions allocate flow proportionally so identifier order cannot
choose which branch receives feed.

Architectural openings exchange room material independently from process lines. Towers connect to
the process system through declared ports or room conditions, not by reading arbitrary nearby
inventories.

Examples of explicit combat connections:

- a Carbon Burner consumes fuel from one gas port and ambient or piped oxidizer;
- a Quench Coil accepts coolant flow and strengthens its slowing field below;
- a launcher consumes prepared solid charges from an adjacent magazine;
- a Wash Head clears a named airborne field and produces a finite waste inventory.

Preview, command availability, and runtime execution use the same supply and capacity query.

## Atmosphere and environmental fields

Atmosphere affects combat through bounded, visible rules. A field records its source, composition or
effect type, room or geometric extent, intensity, duration, and decay. The underlying material stays
in the room inventory when the field represents a chemical concentration.

Environmental effects may:

- reveal or obscure targets;
- change projectile range or accuracy;
- accelerate, slow, ground, or reroute an enemy class;
- modify a named damage channel or armor state;
- disable, cool, overdrive, or corrode compatible towers;
- ignite, condense, absorb, or react when a declared threshold is met.

Each effect has finite extent and explicit stacking rules. Presentation shows the active area, the
affected entities, the responsible source, and the immediate consequence.

## Process families

The retained catalog groups species and operations into six process families. Families organize
content and suggest later tower interactions; they do not prescribe a site's required defense.

| Family           | Process role                                    | Tower-defense opportunities                          |
| ---------------- | ----------------------------------------------- | ---------------------------------------------------- |
| Chlorine-sodium  | Brine separation, chlorine handling, scrubbing  | Oxidizing feed, corrosion, gas clearing              |
| Carbon-steam     | Fuel conversion, heat, reducing gases           | Burners, thermal fields, smoke or visibility control |
| Nitrogen-oxide   | Oxidizer preparation and absorption             | Propellant, marking clouds, reactive support         |
| Iron             | Oxygen carriage, heat buffering, solid handling | Armor break, cooling, reusable support media         |
| Nickel           | Catalysis and volatile carbonyl handling        | Catalyst upgrades, toxic precision feed              |
| Uranium-fluorine | High-risk separation and containment            | Late-campaign energy and containment effects         |

Sites choose supplies and environmental conditions from the fiction and the intended encounter.
Unlocks expand the player's options across the fixed campaign rather than replacing the established
tower vocabulary.

## Player information

The interface exposes process state at the point where it affects a decision:

- a tower preview names its required feed and current supply rate;
- a pipe preview shows source, destination, contents, direction, capacity, and predicted recipient;
- a room overlay shows active atmospheric fields and affected routes or towers;
- a tower readout distinguishes target absence, line-of-sight loss, cooldown, and missing supply;
- incidents identify the reaction, tower, enemy, or transport event that changed the room.

Guided operations introduce one relationship at a time. The chemical encyclopedia may expose the
full system for inspection, but required campaign actions remain legible from the map and selected
equipment.

## Authoring and verification

New chemistry-connected combat content must define:

1. the conserved source and destination inventories;
2. the tower, enemy, route, or environment property it changes;
3. threshold, rate, capacity, duration, and stacking behavior;
4. map and selection presentation;
5. a direct-tower reference defense and a chemistry-assisted alternative;
6. exact-delta, conservation, save, and deterministic replay coverage.

The compiler validates formulas, elemental balance, references, equipment ports, and site supplies.
Runtime tests verify conservation and order independence. Campaign health verifies that chemical
integration expands strategy without becoming the only workable answer.

## Chemistry references

The species and reaction catalog draws on standard chemical data sources for formula, phase,
thermodynamic, and safety facts. Authored rates and combat consequences remain game tuning.

- [NIST Chemistry WebBook](https://webbook.nist.gov/chemistry/)
- [PubChem](https://pubchem.ncbi.nlm.nih.gov/)
- [NIOSH Pocket Guide to Chemical Hazards](https://www.cdc.gov/niosh/npg/)
- [ATSDR Toxicological Profiles](https://www.atsdr.cdc.gov/toxprofiledocs/)
