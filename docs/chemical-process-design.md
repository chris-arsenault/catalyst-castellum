# Chemical process model

Catalyst Castellum models chemistry as conserved species moving through finite rooms, equipment
ports, junctions, and process lines. Thirty authored reactions span six process families —
chlorine-sodium, carbon-steam, nitrogen-oxide, iron, nickel, and uranium-fluorine — and every
reaction carries a regime: **wild** reactions proceed spontaneously in open rooms, while
**engineered** reactions run only inside the vessel whose duty hosts them
([ADR-0007](adr/0007-engineered-reactions-run-in-vessels.md)). Definitions are executable
content: stoichiometry, direction, rate law, activation windows, catalysts, inhibitors, heat,
pressure, family, and regime all feed the runtime and the balance workbook.

## Conservation boundary

Every chemical reaction declares explicit reactants and products with arbitrary elemental
composition maps. Pack compilation rejects any chemical reaction whose element ledger does not
balance. Physical operations move or repartition existing species while preserving their amounts.

Resonance-band transmutation is the one element-changing operation. Charging a site supply converts
Matter into the supply's authored conserved packet at a physical reservoir, records the Matter cost,
and labels the event `EXOTIC TRANSMUTATION`. Once created, the packet follows ordinary inventory,
transport, reaction, and hazard rules.

Vents and drains transfer complete mixtures into retained Core recovery inventories. Full rooms,
ports, and process lines stall upstream flow. Material leaves the modeled plant only through an
explicit game event such as enemy uptake, harvest, or transmutation.

## Inventory model

Each room owns four material inventories:

- lower gas;
- upper gas;
- pooled liquid;
- room-bound stationary material.

Stationary carbon, iron oxides, nickel, uranyl fluoride, and catalyst media remain in their room.
They participate in reactions and persist when their room belongs to the carried hull. Ordinary gas
and liquid lines do not transport stationary material.

Rooms, process lines, junctions, reservoirs, and equipment outputs are finite volumes. Equipment and
liquid reduce free gas volume. Gas amount, free volume, and temperature determine pressure. Liquid
fill determines the physical surface used for port submergence and ground contact.

## Reaction execution

Wild multi-stage chemistry runs through a simultaneous mass-action solve in every room:

1. Snapshot every room inventory and environmental condition once per fixed step.
2. Evaluate each eligible forward and reverse rate request from activity, temperature, pressure,
   catalyst, inhibitor, and equipment factors.
3. Allocate shared reactants proportionally across competing requests.
4. Apply realized extents together and record direction, rate, and limiting factor.
5. Expose products to reactions on the next simulation step.

This ordering prevents definition order from becoming a hidden reaction priority. The wild set —
combustion, recombination, dissolution, neutralization, hypochlorite chemistry, CO oxidation,
ambient NO oxidation, and UF₆ hydrolysis — is exactly the chemistry that proceeds spontaneously
in open air or water.

Engineered chemistry runs through the same mass-action solve scoped to a vessel's active duty.
The loaded medium selects the duty, the installed grade caps the process rate, the loaded
catalyst charge satisfies the reaction's catalyst term, and ambient accelerator multipliers do
not apply. Reversibility, activity response, catalyst saturation, and inhibition behave
identically inside and outside vessels; the vessel supplies gating, rating, and attribution.

OX-1 combustion uses a discrete flash behavior. A stoichiometric H₂/O₂ charge that clears its
ignition thresholds burns a bounded extent, creates steam and persistent heat, applies a pressure
and heat packet to current room occupants, and enters a cooldown. Continued feed determines its
next proc time.

## Equipment operations

Ordinary rooms are generic structural spaces with sockets. Installed equipment creates process
roles:

- Gas Agitators mix gas layers and accelerate eligible wild gas reactions.
- Wet Contactors accelerate eligible wild gas-liquid and liquid reactions.
- Thermal Coils drive the room toward their grade's rated temperature.
- Membrane Cells execute chlor-alkali electrolysis with separate finite outputs.
- Fluorine Cells execute hydrogen-fluoride electrolysis with separate finite outputs.
- Catalytic Reactors run gas-phase catalytic duties — iron charge for ammonia synthesis and
  water-gas shift, nickel charge for methanation and steam reforming.
- Packed Beds host the room's stationary charge — carbon, iron oxides, nickel media, or uranyl
  fluoride — and run its solid–gas duty in place.
- Catalytic Burners oxidize and reduce nitrogen chemistry across platinum gauze.
- Absorber Columns absorb nitrogen dioxide into pooled water and release nitric acid.

An operation is a list of duties; each duty names the stationary medium that enables it and the
reactions it executes. The `load_vessel_medium` command selects a vessel's medium during build or
prime, and the spec plate presents the active duty's equation, rate, power draw, and limiting
factor. Each installed vessel owns its operation state, cumulative extent, and port inventories;
multiple vessels operate independently even when they use the same definition. Nickel migration
stays physical: carbonyl volatilizes from a warm nickel bed, moves by ordinary transport, and
deposits into any hot Packed Bed.

Catalysts are stationary species referenced as rate modifiers. A vessel's loaded charge satisfies
its duty's catalyst term; room-bound catalyst inventory serves wild chemistry. Catalysts remain
outside stoichiometric consumption unless a separate authored reaction changes their species.

## Transport and spatial physics

A room pair carries at most one gas line and one liquid line. Each line owns one complete phase
mixture, one route, one actuator, one capacity, and one persistent hold-up inventory.

- Gas lines sweep their routed volume before delivering a dry line's leading packet. Fans add
  directional pressure head; source pressure, backpressure, density, and endpoint elevation set the
  realized flow.
- Liquid lines prime their complete routed volume. Pumps displace retained contents against route
  lift, density, room pressure, and destination headroom.
- Passive architectural openings exchange material through their aperture, sill, elevation, and
  open/sealed state independently from dedicated process lines.
- Shared junction requests receive proportional allocations from one source snapshot.

The side-view map is physical geometry. Route length controls process-line volume and response;
room bounds control volume; route and portal cells control enemy residence; vertical position
controls ports, liquid surfaces, climbing, falling, and gas-layer exposure.

## Environmental hazards

Species remain chemically distinct while contributing to five stable combat channels:

| Channel    | Contributions                                                       |
| ---------- | ------------------------------------------------------------------- |
| Atmosphere | Oxygen deficiency, respiratory toxicity, displacement, and drowning |
| Corrosion  | Acids, bases, oxidizers, hydrogen fluoride, and uranium chemistry   |
| Heat       | Hot mixtures, steam, combustion, and reaction heat                  |
| Pressure   | OX-1 impulse and catastrophic static overpressure                   |
| Radiation  | Uranium-bearing stationary and airborne inventory                   |

Enemy susceptibility applies to the channel after exact species/source attribution is recorded.
Ground enemies sample lower gas and contacting liquid. Flying enemies sample upper gas and pass
above pooled liquid. Pressure and liquid also change residence time through bounded movement drag.
Hazard rules may saturate their effective excess while preserving threshold and low-dose slope;
chlorine uses this bound so dense inventory sustains its designed maximum DPS.

## Process families

### Chlorine-sodium

| Code | Reaction                                              |
| ---- | ----------------------------------------------------- |
| CL-1 | `2 NaCl(aq) + 2 H₂O(l) → Cl₂(g) + H₂(g) + 2 NaOH(aq)` |
| OX-1 | `2 H₂(g) + O₂(g) → 2 H₂O(g) + heat + pressure`        |
| CL-2 | `H₂(g) + Cl₂(g) → 2 HCl(g) + heat`                    |
| P-1  | `HCl(g) → HCl(aq)`                                    |
| CL-3 | `HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l) + heat`       |
| CL-4 | `Cl₂(g) + 2 NaOH(aq) → NaOCl(aq) + NaCl(aq) + H₂O(l)` |
| CL-5 | `NaOCl(aq) + 2 HCl(aq) → NaCl(aq) + Cl₂(g) + H₂O(l)`  |

This family supports pulses, continuous gas exposure, corrosive floors, absorption, neutralization,
storage, and delayed chlorine release. The membrane cell's separated products make outlet
backpressure and routing part of the process.

### Carbon-steam

| Code  | Reaction                            |
| ----- | ----------------------------------- |
| CS-1  | `C(s) + H₂O(g) ⇌ CO(g) + H₂(g)`     |
| CS-2  | `CO(g) + H₂O(g) ⇌ CO₂(g) + H₂(g)`   |
| CS-3  | `C(s) + CO₂(g) ⇌ 2 CO(g)`           |
| CS-4  | `2 CO(g) + O₂(g) → 2 CO₂(g) + heat` |
| CS-6A | `C(s) + 2 H₂(g) ⇌ CH₄(g)`           |
| CS-6B | `CH₄(g) + H₂O(g) ⇌ CO(g) + 3 H₂(g)` |

Carbon beds and steam shift a room among toxic CO, asphyxiating CO₂, combustible H₂/CH₄, heat, and
recoverable solid carbon. Reversible directions expose catalyst, temperature, and inventory
history directly.

### Nitrogen-oxide

| Code | Reaction                                          |
| ---- | ------------------------------------------------- |
| NO-1 | `N₂(g) + 3 H₂(g) ⇌ 2 NH₃(g) + heat`               |
| NO-2 | `4 NH₃(g) + 5 O₂(g) → 4 NO(g) + 6 H₂O(g) + heat`  |
| NO-3 | `2 NO(g) + O₂(g) → 2 NO₂(g) + heat`               |
| NO-4 | `3 NO₂(g) + H₂O(l) → 2 HNO₃(aq) + NO(g) + heat`   |
| NO-5 | `4 NH₃(g) + 4 NO(g) + O₂(g) → 4 N₂(g) + 6 H₂O(g)` |
| NO-6 | `2 NH₃(g) + 2 O₂(g) → N₂O(g) + 3 H₂O(g)`          |

This family creates delayed oxidation during transport, gas-to-liquid nitric-acid transfer, and a
reduction loop whose success depends on ammonia, oxygen, catalyst, and temperature windows.

### Iron oxygen carrier

| Code | Reaction                                   |
| ---- | ------------------------------------------ |
| FE-1 | `3 Fe₂O₃(s) + CO(g) → 2 Fe₃O₄(s) + CO₂(g)` |
| FE-2 | `3 Fe₂O₃(s) + H₂(g) → 2 Fe₃O₄(s) + H₂O(g)` |
| FE-3 | `4 Fe₃O₄(s) + O₂(g) → 6 Fe₂O₃(s) + heat`   |

The stationary bed carries finite oxygen between separated gas fronts. Reduction history determines
how much CO or H₂ the bed can convert before reoxidation restores it.

### Nickel migration

| Code | Reaction                                   |
| ---- | ------------------------------------------ |
| NI-1 | `NiO(s) + H₂(g) → Ni(s) + H₂O(g)`          |
| NI-2 | `Ni(s) + 4 CO(g) → Ni(CO)₄(g)`             |
| NI-3 | `Ni(CO)₄(g) → Ni(s) + 4 CO(g)`             |
| NI-4 | `2 Ni(s) + O₂(g) → 2 NiO(s) + heat`        |
| NI-5 | `CO(g) + 3 H₂(g) → CH₄(g) + H₂O(g) + heat` |

Nickel moves by becoming volatile nickel carbonyl, then deposits as stationary catalyst in a warmer
room. The deposit persists and changes later methanation kinetics.

### Uranium-fluorine

| Code | Reaction                                     |
| ---- | -------------------------------------------- |
| UF-1 | `UF₆(g) + 2 H₂O(g) → UO₂F₂(s) + 4 HF(g)`     |
| UF-2 | `UO₂F₂(s) + 2 F₂(g) → UF₆(g) + O₂(g) + heat` |
| UF-3 | `2 HF(g) → H₂(g) + F₂(g)`                    |

Moisture converts mobile UF₆ into corrosive HF and room-bound uranyl fluoride. Dry heat and
fluorine recover UF₆; a powered Fluorine Cell recovers fluorine from HF. Uranium inventory produces
a modest persistent radiation field while its immediate chemistry remains atmospheric and
corrosive.

## Palettes and depth-one supply

Each site declares a palette of one to three process families
([ADR-0008](adr/0008-site-chemistry-palettes.md)). Supplies, seeded stationary charges, and
per-round equipment availability derive from and are compiler-validated against the palette, so
the concurrent possibility space at a site is the palette's eight-to-twelve reactions. Common
precursors — hydrogen, oxygen, nitrogen, water, steam, and iron catalyst — ship under every
palette.

Every offensive family delivers a working hazard from at most one reaction on a site-supplied
feedstock ([ADR-0009](adr/0009-damage-at-depth-one.md)). Hull hazard reservoirs (G-3 gas on the
washlock, L-3 liquid) carry priced, capped direct-supply packets — chlorine, ammonia, nitrogen
dioxide, hypochlorite, hydrochloric acid — while synthesis chains make the same feedstock free
and scalable. Iron is the support family: its promise is oxygen carriage and feed recycling, and
it is labeled as support in the encyclopedia.

## Player information

The UI exposes current inventories, gas layers, liquid surface, stationary material, temperature,
pressure, line fill, measured flow, reaction direction/rate, catalyst, inhibitor, activation
windows, and limiting factor. Vessel spec plates present the active duty's equation, medium,
rate, and limiting factor, and the encyclopedia labels every reaction with its family, regime,
and — for iron — its support role. The UI presents current state and observed causality while
leaving the player to combine multiple process stages.

The Encyclopedia derives equations and mechanics from the compiled definition. Player-facing names
and descriptions live in the locale catalog rather than mechanical content.

## Authoring and verification

- Species live under `src/game/content/species/` and are composed in `content/substances.ts`.
- Reaction families live under `src/game/content/reactions/` and are composed in
  `content/chemistry.ts`.
- Equipment and operation definitions live in `content/equipment.ts`.
- The compiler validates elemental balance, operation references, supplies, and site topology.
- `src/game/massActionReactions.test.ts` covers simultaneous allocation and multi-stage behavior.
- `pnpm balance:combat` reports ideal capacity, feed depletion, delivery, and transient campaign
  output for every family.

## Chemistry references

- [US EPA chlor-alkali process](https://www3.epa.gov/ttn/chief/ap42/ch08/final/c08s11.pdf)
- [CDC chlorine chemistry and incompatibilities](https://www.cdc.gov/chemical-emergencies/chemical-fact-sheets/chlorine.html)
- [US DOE NETL gasification chemistry](https://netl.doe.gov/research/coal/energy-systems/gasification/gasifipedia/gasification-chemistry)
- [US EPA nitric acid production chemistry](https://www.epa.gov/sites/default/files/2020-09/documents/final_background_document_for_nitric_acid_section_8.8.pdf)
- [US DOE NETL iron-oxide chemical looping](https://netl.doe.gov/node/7478)
- [CDC/NIOSH nickel carbonyl](https://www.cdc.gov/niosh/npg/npgd0444.html)
- [US NRC uranium conversion and UF₆ behavior](https://www.nrc.gov/materials/fuel-cycle-fac/ur-conversion)
