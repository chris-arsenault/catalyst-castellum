# Catalyst Castellum Chemical Process Design

Status: chlorine–sodium MVP implemented; expansion families remain design exploration  
Updated: 2026-07-12

## Decision summary

The simulation should be species-first rather than chemical-themed. Ordinary reactions use real,
explicit chemical species and conserve every modeled element. Physical processes conserve matter.
The only exception is a deliberately fictional process class named **exotic transmutation**.

The three initial process families are:

1. **Chlorine–sodium loop** — recommended for the MVP.
2. **Carbon–steam redox loop** — recommended as the first expansion family.
3. **Nitrogen–oxide loop** — reserved for a later, more demanding process tier.

Three heavy-element families are retained as future tech-tree options:

4. **Iron-oxide oxygen-carrier loop** — the first heavy-element unlock and the cleanest extension of
   the carbon–steam family.
5. **Nickel-carbonyl migration loop** — a later volatile-metal, deposition, and catalysis system.
6. **Uranium–fluorine contamination loop** — a very late aerosol and radiological branch.

The MVP should begin with only the chlorine–sodium family. It already provides gas/liquid
transport, automatic reactions, delayed release, storage, neutralization, incompatible mixtures,
heat, and recoverable byproducts without needing unrelated chemistry.

The heavy-element families are not additional MVP content. Their purpose at this stage is to keep
the simulation's data boundaries open to stationary solids, surface deposits, aerosols, catalysts,
and optional isotope activity. They show that later chemistry can become more consequential without
turning the periodic table into a linear sequence of larger damage numbers.

## Simulation contract

### Species, not outcome labels

The simulation tracks substances such as `Cl₂`, `H₂`, `NaOH`, `CO`, and `NO₂`. It does not
contain substances named `toxic_gas`, `mineral`, `spent_liquid`, or similar outcome-oriented
categories. Reaction behavior, phase behavior, and transport remain properties of actual species
and their local concentrations. Harm is resolved through the shared environmental hazard channels
defined below rather than through a damage type for every species or element.

Player-facing inventories should use stable chemical species rather than isolated atomic sodium,
chlorine, or hydrogen. Underneath those species, an elemental ledger records their Na, Cl, H, O,
C, and N composition.

### Shared environmental hazard channels

Chemical identity and damage type are separate concerns. Species remain chemically distinct so
that their reactions, phases, transport, storage, and byproducts matter, but they contribute to a
small, stable set of environmental hazards:

1. **Atmosphere** — oxygen deprivation, respiratory toxicity, gas displacement, and drowning.
2. **Corrosion** — damaging contact with acids, bases, and oxidizers.
3. **Heat** — hot mixtures, steam, combustion, and reaction heat.
4. **Pressure** — overpressure, decompression, and reaction or combustion shock events.
5. **Radiation** — exposure produced by future radioactive inventories and processes.

A species may contribute to more than one channel, with strength determined by concentration,
phase, temperature, pressure, and exposure time. For example, `Cl₂(g)` contributes atmosphere and
corrosion exposure, `NaOH(aq)` contributes corrosion on contact, and `H₂(g)` contributes no bespoke
"hydrogen damage" but can create pressure and heat through accumulation and reaction.

Enemies and other occupants have physiology, armor, movement, and resistance rules against these
shared channels. They do not have per-element or per-species damage resistances. Whether an occupant
breathes, touches a liquid, is shielded, or remains in a room long enough controls exposure; chemical
identity controls how the hazardous environment arose. New chemical content should reuse these
channels. Adding another hazard channel requires an explicit gameplay-design decision, not merely a
new substance. In particular, there are no separate chlorine, hydrogen, acid, caustic, or oxidizer
damage types.

### Conserved finite-volume transport

Gas and liquid transport is a core simulation mechanic, not an MVP placeholder. The simulation uses
a lumped finite-volume model: every room, tank, header, junction, and conduit owns a finite,
well-mixed inventory.
It does not model spatial fluid dynamics inside one volume, but every modeled species is conserved
while moving between volumes.

- Room volume is derived from visible grid bounds. A standard 14×8 room is 100 normalized volume
  units; larger and smaller spaces use the same volume-per-cell constant. Equipment and liquid
  occupy that volume, and liquid fill is capped at 92% so finite gas volume remains.
- Static gas pressure is derived from gas quantity, available gas volume, and absolute temperature,
  relative to 101.3 kPa at 22°C. Composition percentage alone is not a substitute for pressure.
- Adding liquid compresses the room atmosphere. If a gas route is open, the resulting pressure
  expels the complete gas mixture; without sufficient relief, liquid inflow eventually stalls.
- Adding gas raises pressure. Open ducts displace the complete existing mixture according to their
  pressure gradient and actuator drive; sealed rooms accumulate pressure.
- Gas conduits have finite compressible volume. A dry route must sweep that complete volume before
  its leading packet reaches the destination. Fans add directional pressure head; source pressure,
  destination backpressure, density, and endpoint elevation change available flow.
- Liquid conduits have finite hold-up and must prime. Once full, incoming liquid displaces an equal
  volume of the conduit's existing mixed contents. Pumps provide directional drive against route
  lift and liquid density.
- Full rooms, tanks, and conduits block upstream flow rather than deleting excess material. Room inflow
  stalls at a 260 kPa static-pressure ceiling. Vents and drains retain the complete discarded mixture
  in the core recovery inventories.
- Material crosses only declared conduits and room-local junctions. There is no implicit room equalization or
  selective transport of a preferred species.

The model may use normalized capacities and conductance rather than real pipe dimensions, but
capacity, delay, pressure, displacement, mixture transport, and conservation are non-negotiable
simulation behavior.

### Vertical spatial transport

The facility is an authored vertical two-dimensional cross-section. Screen height is physical
elevation and horizontal separation is real travel/transport distance, not decorative layout. One
canonical geometry definition owns room bounds, monster corridors and shafts, door locations,
utility nodes, and the full polyline of every gas and liquid route. Rendering and simulation consume
those same coordinates. Ring membership still controls construction permissions.

Enemy travel time is based on corridor polyline length. Conduit-route length determines hold-up,
swept-volume delay, and rated response. The highest point on an authored liquid route is its crest;
endpoint heights determine submerged pickup and delivery behavior. These properties must not be
duplicated as hand-entered connection metadata.

Liquids use one pooled, well-mixed inventory per room:

- Liquid fill determines an absolute surface elevation from the room floor and height.
- Powered liquid conduits compare pump head with authored route lift and mixture density.
- Pump direction is fixed by the installed conduit. Turning the pump off stops transport instead of
  exposing a hidden gravity bypass.
- A room can supply a liquid port only while its surface covers that port.
- Empty conduits must fill before delivering material.
- A fixed liquid route's highest authored point controls whether its pump can prime. Exposing a
  pickup stops new material entering; retained material remains conserved rather than being
  conjured or deleted.
- Downhill drainage is free but not selective; uphill transport requires sufficient pump or pressure
  head.
- Room gas pressure contributes to liquid head. A sealed compressed room can push liquid uphill,
  while draining a sealed room can pull a vacuum and stall an otherwise downhill route.

Room gas uses two conserved, well-mixed finite zones: **lower** and **upper**. This is the minimum
spatial resolution needed for buoyancy to matter without turning the room graph into a fluid grid.

- Both zones share room pressure but retain independent composition and temperature.
- High ports draw from and deliver to the upper zone; low ports use the lower zone.
- Unequal zone pressure equalizes quickly. Ordinary diffusion mixes zones slowly.
- If the lower mixture is less dense than the upper mixture, buoyant overturn exchanges them rapidly.
- Mixture density is derived from composition and absolute temperature. Species do not receive
  bespoke "rises" or "sinks" behavior, and gases do not permanently sort into pure layers.
- Fans add directional pressure head. Source pressure, destination pressure, mixture density, and
  endpoint elevation determine how much rated forward flow is available.

Installed equipment may declare forced gas mixing as process data. Flash Point begins with blank
R-02 sockets and one Core header containing a visible H₂/O₂ mixture. The player installs the gas
agitator that exchanges R-02's upper and lower zones quickly enough for useful repeating batch
combustion. Later levels may preinstall that same player-owned instance. The behavior belongs to
equipment, not to an R-02 room type; a room never gains hidden mixing merely because a reaction
would be convenient.

Gas–liquid reactions and phase changes occur at the lower gas zone adjoining the liquid surface.
Combustion occurs independently in whichever gas zone contains a combustible batch, while its
pressure impulse affects the whole room. Ground enemies sample lower-zone atmosphere and pooled
liquid; flying enemies sample the upper zone. The inspector must expose both gas layers, the liquid
surface, port elevations, signed flow direction, and whether pressure, gravity, buoyancy, or an
actuator is driving each connection.

This remains a deterministic room-based finite-volume simulation: geometry determines how volumes
connect, not a per-tile fluid grid. It explicitly rejects per-pixel CFD, instantaneous gas sorting,
hidden cross-room equalization, and gravity rules attached directly to individual chemical names.

### Rooms, sockets, and equipment

Ordinary traversable rooms have no functional type. A room is not intrinsically a furnace,
absorber, reactor, contact chamber, or storage room. Its durable definition owns only spatial and
structural facts such as geometry, elevation, ring permissions, and generic equipment sockets; its
live state owns atmosphere, liquid, temperature, pressure, residue, and installed equipment.

Equipment instances create every process role:

- A blank room performs only reactions that occur naturally under its current environmental
  conditions.
- A mixer, wet contactor, heater, electrochemical cell, storage insert, or other device changes
  kinetics, mixing, heat, capacity, or transport according to that equipment's own definition.
- Socket placement may express physical position or mounting constraints, but must not encode a
  hidden chemical role such as an "absorber socket."
- Entry and core spaces may remain structural exceptions, but ordinary defensive rooms share the
  same underlying room model.

Early scenarios may start with equipment already installed. Preinstallation is scenario content
using the same equipment instances, costs, upgrades, and dismantling rules available to the player;
it must not be baked into a specialized room class. This supports a hidden tutorial progression from
mostly installed plants to blank facilities without changing the simulation model. Stable room codes
describe location, while functional labels should be derived from current equipment rather than
hard-coded into room identity.

Permanent physical conditions, when a map needs them, must be explicit world features or initial
state. For example, a naturally hot geological chamber and a removable heater are different causes;
neither justifies a generic `furnace` room type.

### Player-facing control model

The player loop is **build → connect → choose a simple policy → observe the chemistry**. Simulation
coefficients remain deep, but operating controls describe physical commitments rather than exposing
continuous parameters.

- Cells and installed process equipment are off/on. Equipment grade owns rated reaction rate.
- Fans and pumps are off/on. Their installed hardware owns head and rated capacity.
- Passive valves are closed/open and remain physically bidirectional while open.
- Vents and drains are sealed/open and transport their complete mixture into retained core
  inventories.
- Measured rate, pressure, composition, line fill, reaction rate, and limiting reactant are read-only
  consequences, never hidden setpoints.
- When multiple conduits draw from one junction, they receive fair proportional shares of the
  available whole mixture. Array or identifier order must never become a hidden routing policy.

Plan mode permits installing, upgrading, dismantling, and constructing authored gas/liquid runs.
Prime permits only operating installed equipment and actuators. Assault locks the configuration.
New conduits begin empty and must prime. A conduit can be dismantled only when its conserved phase
inventory is empty; dismantling returns 75% of construction Matter. Equipment follows the same
three-grade install/upgrade/dismantle model and occupies room
volume, so higher capability also increases pressure and flooding sensitivity.

The former full-factory scenario preinstalls the following player-owned instances and is now retained
as the **Commissioning Exam**:

- R-02: Thermal Coil I and Gas Agitator I.
- R-03: Wet Contactor I.
- R-05: Membrane Cell I beside the explicit separated-outlet manifold.
- R-06: Wet Contactor I.

Gas agitators accelerate all eligible gas reactions and layer exchange, including unwanted
combustion. Wet contactors accelerate all eligible gas–liquid and liquid reactions, including
neutralization. Thermal coils set a rated temperature rather than selecting a reaction. The membrane
cell consumes only its real inputs and stops on missing feedstock or outlet headroom. No equipment
has a desired-product selector.

The tutorial campaign reaches this loadout incrementally. Flash Point starts with no installed
equipment; Make the Reagent asks the player to install the membrane cell; Acid Line introduces heat,
agitation, and transport construction; Stored Chlorine introduces contact equipment and delayed
inventory. See `docs/tutorial-campaign.md` for the durable level and evaluator contract.

### Transport presentation (MVP)

The map presents physical transport infrastructure between places, not one line per substance or
process purpose. A room pair may own at most one gas conduit and one liquid conduit. Each phase has
one route, one binary fan or pump, one capacity, and one conserved whole-mixture inventory. Internal
feedstock tanks, equipment outlets, junctions, vents, and drains remain local details inside their
host room and do not create hidden player-operated sub-lines.

Installed conduits are quiet, phase-readable infrastructure in the default view. Hovering reveals
the conduit direction, retained mixture, capacity, pressure or priming state, measured total flow,
and every species currently moving through that one inventory. A map-level flow overlay selects
exactly one material at a time. Repeated blinking arrows show that material across the entire
facility; arrow direction shows conduit direction and arrow size represents measured rate. This is
representative flow telemetry, not particle animation.

### Post-MVP transport progression

Transport runs become capacity-constrained infrastructure with factory-game-style filters and
upgrade tiers:

- Each gas or liquid run has a maximum total throughput shared by every material using it. Capacity
  is not granted independently per substance; competing transfers consume the same budget.
- An unfiltered run accepts every material in its phase at equal priority. A filter may exclude a
  material (for example, reject water while transporting all other liquids) or restrict admission to
  an allowed set.
- Filtering is a conserved separation operation. Rejected material remains in the source inventory
  and may create upstream backpressure; it is never deleted, teleported, or left behind as an
  untracked fraction.
- Capacity upgrades increase available throughput/conductance and therefore allow faster plant
  response without adding parallel material-specific lines to the map.
- Throughput and physical hold-up remain distinct balance properties. If an upgrade also changes
  pipe bore and retained volume, that additional priming inventory and delay must be modeled
  explicitly rather than receiving faster response for free.

The exact filter controls, priority rules, upgrade costs, and whether filters are directional remain
post-MVP design work. Introducing them is an intentional exception to the MVP rule that ordinary
connections move complete mixtures without selective transport.

### Movement drag and hydrogen–oxygen flashes

Movement drag uses environmental state rather than a substance-specific slow effect.

- Ground movement begins slowing above 15% room liquid fill and reaches a bounded maximum slowdown
  as the room approaches its liquid limit. Flying occupants ignore liquid drag.
- All movement begins slowing above 130% of ambient pressure. Liquid and pressure multipliers combine
  multiplicatively, so neither can reduce movement to zero.

Hydrogen and oxygen add a repeatable batch hazard:

```text
2 H₂(g) + O₂(g) → 2 H₂O(g) + heat + pressure impulse
```

The balanced reaction autoignites when the room contains at least 5% H₂, at least 8% O₂, and three
stoichiometric reaction extents (`6 H₂ + 3 O₂`) ready to burn. One flash burns at most six extents
and has a 1.2-second refractory cooldown. It creates steam, raises persistent room temperature, and
creates a short pressure impulse. Continued H₂ and O₂ flow therefore produces discrete repeated
flashes rather than continuous elemental damage: a high-power, low-rate defense whose cadence emerges
from feed rate, line delay, room displacement, oxygen consumption, steam accumulation, and exhaust
flow.

### Three process classes

1. **Chemical reaction**
   - Uses an idealized real reaction pathway.
   - Has explicit stoichiometric coefficients.
   - Conserves every modeled element exactly.
   - May consume or release heat and electrical energy.
   - Ignores real-world trace side reactions unless a side product creates useful gameplay.

2. **Physical process**
   - Includes transport, mixing, dissolution, evaporation, condensation, separation, and phase
     partitioning.
   - Conserves every species exactly while moving it between phases or inventories.

3. **Exotic transmutation**
   - May change one element into another or supply missing nucleons.
   - Must be explicitly marked as non-chemical in data and UI.
   - Consumes harvested Matter and substantial energy.
   - Produces persistent heat and may produce radiation or another operating hazard.
   - Uses fixed recipes rather than an arbitrary input/output selector.

### Conservation boundary

Normal reaction definitions should be mechanically checked for elemental balance. A reaction that
does not balance cannot be loaded as a chemical reaction. An exotic-transmutation recipe must
instead declare that elemental conservation is waived and identify its Matter and energy costs.

Vents and drains are transport destinations hosted by the core. They move mixtures into exhaust
or waste inventories; they do not delete matter. Material leaves the modeled facility only through
an explicit export, enemy interaction, or exotic-transmutation recipe.

### Exotic-transmutation guardrails

Exotic transmutation is an escape hatch for chemical dead ends, not the primary production system.

- It is available only at the core or in an innermost-ring specialized furnace.
- It has low throughput and poor energy efficiency.
- It uses a small set of fixed, legible recipes.
- It cannot instantly convert an arbitrary mixed room inventory.
- Recipes may require a purity threshold or separated input stream.
- Real recovery chemistry remains cheaper and faster whenever it creates interesting decisions.
- A terminal byproduct may accumulate when managing that accumulation is itself meaningful.

Example presentation:

```text
EXOTIC TRANSMUTATION
Input: oxygen inventory + harvested Matter + core energy
Output: iron inventory + waste heat

Elemental conservation: waived
Mass deficit: supplied by Matter
```

Quantities in exotic recipes are game-balance values, not claims about real nuclear physics.

## Candidate 1: Chlorine–sodium loop

Recommendation: **MVP process family**

### Why this is the strongest starting point

Chlor-alkali electrolysis creates three physically and tactically different products from one
ordinary feedstock: chlorine gas, hydrogen gas, and sodium hydroxide solution. Those outputs can
then recombine, neutralize one another, or store chlorine in a liquid hypochlorite inventory.

The family supports a second-order defense without placing a toxin generator in the destination
room. A player can transport a relatively stable hypochlorite solution into a room, later send an
acid front from upstream, and cause chlorine to evolve there over time.

### Modeled species

Carrier and feed species:

- `H₂O(l)` and `H₂O(g)` — liquid water and steam phases of the same species.
- `NaCl(aq)` — explicit aqueous sodium chloride, not a generic `brine` substance.
- `O₂(g)` and `N₂(g)` — ambient atmosphere and combustion context.

Primary products and byproducts that can fill rooms:

1. `Cl₂(g)` — toxic, dense gas and strong oxidizing reactant.
2. `H₂(g)` — light combustible gas with dangerous incompatibilities.
3. `HCl(g/aq)` — corrosive gas that partitions rapidly into available water.
4. `NaOH(aq)` — caustic liquid that also neutralizes acid and absorbs chlorine.
5. `NaOCl(aq)` — oxidizing liquid reservoir capable of releasing chlorine when acidified.

### Chemical reactions

#### CL-1: Chlor-alkali electrolysis

```text
2 NaCl(aq) + 2 H₂O(l) + electrical energy → Cl₂(g) + H₂(g) + 2 NaOH(aq)
```

- Requires an energized electrolysis capability.
- Produces chlorine, hydrogen, and liquid caustic at fixed stoichiometric ratios.
- The real process physically separates its outlets. The game may model an anode gas outlet,
  cathode gas outlet, and liquid outlet.
- Backflow, overpressure, or incorrect routing may contaminate those separated streams.

#### CL-2: Hydrogen–chlorine recombination

```text
H₂(g) + Cl₂(g) → 2 HCl(g) + heat
```

- Requires an activation source or sufficient local reaction conditions.
- Consumes two gases that are dangerous for different reasons.
- Produces a corrosive gas and a sharp heat pulse.

#### CL-3: Acid neutralization

```text
HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l) + heat
```

- Occurs automatically when dissolved acid and caustic share a liquid inventory.
- Returns the main electrolysis feed species.
- Reaction rate depends on local mixing and the amount of water available.

#### CL-4: Hypochlorite formation

```text
Cl₂(g) + 2 NaOH(aq) → NaOCl(aq) + NaCl(aq) + H₂O(l)
```

- Transfers chlorine from the gas phase into a persistent oxidizing liquid.
- Reduces immediate gas exposure while building stored chemical potential.
- Can occur in any sufficiently caustic wet room; it does not require a named reactor device.

#### CL-5: Acid-triggered chlorine release

```text
NaOCl(aq) + 2 HCl(aq) → NaCl(aq) + Cl₂(g) + H₂O(l)
```

- Converts a transported acid front into delayed chlorine evolution.
- Provides the principal second-order destination-room hazard.
- The release rate depends on acid arrival, liquid mixing, and gas headroom.

### Material closure

The main loop can return entirely to its starting material:

1. Electrolysis converts sodium chloride and water into chlorine, hydrogen, and sodium hydroxide.
2. Hydrogen and chlorine recombine into hydrogen chloride.
3. Hydrogen chloride and sodium hydroxide neutralize back into sodium chloride and water.

The hypochlorite branch also returns chlorine to sodium chloride and water after acid-triggered
release and subsequent neutralization. Electrical energy enters the system and reaction heat leaves
or accumulates, but Na, Cl, H, and O remain accounted for.

### Propagation and room behavior

- Gas connections transport the full local gas mixture, not a selected species.
- Liquid connections transport the full solution, including sodium chloride and unreacted caustic.
- `HCl(g)` moves with the gas network but dissolves into wet rooms over time.
- `Cl₂(g)` is consumed when it contacts suitable sodium hydroxide solution.
- `NaOCl(aq)` remains in a room until moved, drained, decomposed, or acidified.
- `H₂(g)` may propagate far beyond its production room before encountering an activation source.
- Neutralization and gas absorption create heat, which can alter later reaction rates and pressure.

Illustrative cascade:

1. Electrolysis creates separate chlorine, hydrogen, and caustic streams upstream.
2. Chlorine enters a caustic middle-ring room and becomes hypochlorite solution.
3. That liquid is routed into an inner exposure room and accumulates there.
4. A portion of chlorine and hydrogen recombines elsewhere into hydrogen chloride.
5. The hydrogen chloride front travels through multiple gas volumes and dissolves in the stored
   hypochlorite room.
6. Chlorine evolves locally only after the delayed acid arrival.
7. Sodium chloride solution returns through the drain inventory for reuse.

### Exotic-transmutation role

The ordinary loop does not require exotic transmutation to close. Transmutation should therefore
remain an expensive recovery option rather than routine operation.

Candidate fixed recipes:

- Convert a separated, chlorine-poor terminal waste inventory plus Matter into `NaCl` feedstock.
- Manufacture replacement electrode or catalyst metal from Matter after long-term degradation is
  introduced.
- Convert an unusable enemy-derived elemental residue into a limited sodium chloride allotment.

Each recipe must be labeled `EXOTIC TRANSMUTATION`, state that elemental conservation is waived,
and produce heat or another persistent cost.

### Sources

- [US EPA: Chlor-Alkali](https://www3.epa.gov/ttn/chief/ap42/ch08/final/c08s11.pdf)
- [US EPA: Sodium Hydroxide Supply Chain Profile](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1017BPA.TXT)
- [US EPA: Sodium Hypochlorite Supply Chain Profile](https://www.epa.gov/system/files/documents/2023-03/Sodium%20Hypochlorite%20Supply%20Chain%20Profile.pdf)
- [CDC: chlorine release from acidified hypochlorite](https://www.cdc.gov/mmwr/preview/mmwrhtml/00015111.htm)
- [CDC: chlorine chemical facts and incompatibilities](https://www.cdc.gov/chemical-emergencies/chemical-fact-sheets/chlorine.html)

## Candidate 2: Carbon–steam redox loop

Recommendation: **first expansion family after the MVP**

### Design character

This family continuously shifts carbon among a solid bed, carbon monoxide, carbon dioxide, and
methane. Water moves between liquid and steam, while hydrogen acts as both product and fuel.
Temperature, steam availability, oxygen ingress, and carbon deposits determine which direction the
network moves.

### Modeled species

Persistent feed and carrier species:

- `C(s)` — explicit solid carbon bed or deposited carbon inventory.
- `O₂(g)` — oxidizer and ambient component.

Primary products and byproducts that can fill rooms:

1. `CO(g)` — toxic combustible gas.
2. `H₂(g)` — combustible gas and reducing reactant.
3. `CO₂(g)` — asphyxiating carbon inventory and gasification reactant.
4. `CH₄(g)` — combustible carbon/hydrogen storage gas.
5. `H₂O(g)` — steam, heat carrier, and reaction feed.

### Chemical reactions

#### CS-1: Water-gas reaction

```text
C(s) + H₂O(g) ⇌ CO(g) + H₂(g)
```

- Forward reaction consumes heat and requires contact with a hot carbon inventory.
- Produces a mixed toxic/combustible gas stream.

#### CS-2: Water-gas shift

```text
CO(g) + H₂O(g) ⇌ CO₂(g) + H₂(g) + heat
```

- Steam can reduce carbon monoxide concentration while increasing hydrogen.
- Cooling and moisture can shift a room away from CO without making it safe.

#### CS-3: Boudouard reaction

```text
C(s) + CO₂(g) ⇌ 2 CO(g)
```

- A hot carbon bed can turn accumulated carbon dioxide back into carbon monoxide.
- The reverse direction deposits solid carbon and creates carbon dioxide.

#### CS-4: Carbon monoxide oxidation

```text
CO(g) + ½ O₂(g) → CO₂(g) + heat
```

- Removes carbon monoxide but consumes oxygen and creates substantial heat.

#### CS-5: Hydrogen oxidation

```text
H₂(g) + ½ O₂(g) → H₂O(g) + heat
```

- Converts hydrogen back into steam.
- Couples oxygen leakage to water and heat availability elsewhere in the loop.

#### CS-6: Methanation and reforming

```text
C(s) + 2 H₂(g) ⇌ CH₄(g)
CH₄(g) + H₂O(g) ⇌ CO(g) + 3 H₂(g)
```

- Methane stores carbon and hydrogen in a transportable gas.
- Steam and heat can convert that storage gas back into syngas.

### Material closure

All chemical reactions conserve C, H, and O. Solid carbon is a real inventory rather than an
unlimited room property. Carbon dioxide can return to carbon monoxide through a hot carbon bed,
carbon monoxide can deposit carbon through the reverse Boudouard reaction, and hydrogen returns to
water through oxidation.

The family still requires energy to drive endothermic directions and may require carbon makeup when
carbon leaves the facility or becomes inaccessible residue.

### Propagation and gameplay

- Steam does not simply dilute a hazard; it changes the CO/H₂/CO₂ balance over time.
- Adding oxygen can clean up CO and H₂ while producing dangerous heat and consuming breathable gas.
- CO₂ is both a low-oxygen hazard and future CO feedstock.
- Carbon deposits obstruct or poison processing surfaces until reheated or removed.
- A valve change can send a steam front through several rooms before the resulting composition shift
  becomes visible downstream.

### Exotic-transmutation role

Prefer gasification or carbon recovery whenever possible. Exotic transmutation is reserved for:

- Converting separated terminal ash or enemy residue into `C(s)` makeup feed.
- Manufacturing catalyst metals that are not otherwise present in the modeled chemistry.
- Recovering carbon from an intentionally unmodeled stable waste compound when adding its complete
  industrial recovery chain would not improve the game.

It should not provide a cheap `CO₂ → C` shortcut because the ordinary carbon-bed reactions already
make that conversion strategically meaningful.

### Sources

- [US DOE NETL: Detailed Gasification Chemistry](https://netl.doe.gov/research/coal/energy-systems/gasification/gasifipedia/gasification-chemistry)
- [US DOE NETL: Water-Gas Shift and Hydrogen Production](https://netl.doe.gov/research/coal/energy-systems/gasification/gasifipedia/water-gas-shift)
- [US DOE NETL: Fischer-Tropsch and methanation context](https://netl.doe.gov/research/carbon-management/energy-systems/gasification/gasifipedia/ftsynthesis)

## Candidate 3: Nitrogen–oxide loop

Recommendation: **later advanced process tier**

### Design character

This family moves nitrogen from inert molecular nitrogen into ammonia, through nitric oxide and
nitrogen dioxide, into aqueous nitric acid, and back to molecular nitrogen. It provides strong
gas-to-liquid propagation and narrow reaction windows but is substantially harder to understand and
balance than the chlorine–sodium family.

### Modeled species

Carrier and feed species:

- `N₂(g)` — inert nitrogen reservoir and final recovered form.
- `H₂(g)`, `O₂(g)`, and `H₂O(l/g)` — shared feed and carrier species.

Primary products and byproducts that can fill rooms:

1. `NH₃(g/aq)` — alkaline, toxic gas that dissolves readily in water.
2. `NO(g)` — toxic intermediate that continues oxidizing during transport.
3. `NO₂(g)` — strongly toxic gas and acid precursor.
4. `HNO₃(aq/mist)` — corrosive liquid or aerosol produced by wet absorption.
5. `N₂O(g)` — persistent side product from an incorrectly operated ammonia oxidation path.

### Chemical reactions

#### NO-1: Ammonia synthesis

```text
N₂(g) + 3 H₂(g) ⇌ 2 NH₃(g) + heat
```

- Requires a specialized catalyst, pressure capability, and energy investment.
- Converts otherwise inert nitrogen into a reactive transport gas.

#### NO-2: Ammonia oxidation

```text
4 NH₃(g) + 5 O₂(g) → 4 NO(g) + 6 H₂O(g) + heat
```

- Produces nitric oxide and steam in a hot catalytic environment.
- Incorrect temperature or mixture quality may divert material into `N₂` or `N₂O`.

#### NO-3: Nitric oxide oxidation

```text
2 NO(g) + O₂(g) → 2 NO₂(g) + heat
```

- Continues automatically as a transported gas mixture cools and encounters oxygen.
- Creates delayed toxicity without requiring a second installed reactor.

#### NO-4: Nitrogen dioxide absorption

```text
3 NO₂(g) + H₂O(l) → 2 HNO₃(aq) + NO(g) + heat
```

- Transfers part of the nitrogen hazard into a persistent acidic liquid.
- Regenerates nitric oxide, which can leave the wet room and oxidize again.

#### NO-5: NOx reduction with ammonia

```text
4 NH₃(g) + 4 NO(g) + O₂(g) → 4 N₂(g) + 6 H₂O(g)
```

- Returns reactive nitrogen to molecular nitrogen and water within a suitable reaction window.
- Too little ammonia leaves NOx behind; too much creates ammonia slip into downstream rooms.

#### NO-6: Nitrous oxide side path

```text
2 NH₃(g) + 2 O₂(g) → N₂O(g) + 3 H₂O(g)
```

- Represents a balanced undesirable pathway under unsuitable operating conditions.
- Makes process quality matter without inventing an anonymous waste gas.

### Material closure

Ammonia synthesis brings `N₂` into the reactive loop. Oxidation moves it through `NO`, `NO₂`, and
nitric acid. Selective reduction returns NOx to `N₂` and water. Nitric oxide regenerated during
absorption is retained and can circulate again.

Hydrogen, oxygen, water, catalyst condition, and energy remain important external constraints. Any
nitrate inventory exported or trapped in residue remains accounted for until recovered.

### Propagation and gameplay

- A hot room makes NO, but much of its downstream danger appears only after the stream cools and
  becomes NO₂.
- A wet room removes NO₂ gas while accumulating nitric acid and releasing NO back into the network.
- Ammonia can neutralize NOx in one temperature window and become an additional toxic leak outside
  that window.
- Water moves the threat from gas exposure into corrosive floor inventory rather than erasing it.
- Oxygen availability changes enemy respiration and several process rates simultaneously.

### Exotic-transmutation role

The principal nitrogen loop can close chemically, so exotic transmutation remains a strategic
fallback:

- Manufacture replacement iron- or platinum-group catalyst inventory from Matter.
- Recover nitrogen from a terminal nitrate salt that the scoped simulation intentionally does not
  reduce chemically.
- Convert a separated enemy-derived residue into a limited `N₂` or catalyst feedstock allotment.

Real NOx reduction should remain cheaper than transmuting NOx directly, otherwise the temperature
and ammonia-balancing gameplay disappears.

### Sources

- [US DOE: nitrogen-to-ammonia transformation](https://www.energy.gov/science/bes/articles/review-examines-science-and-needs-nitrogen-based-transformations)
- [US DOE: ammonia synthesis equation and feedstocks](https://www.energy.gov/sites/default/files/2021-05/052721-h2iqhour_0.pdf)
- [US EPA: nitric acid production chemistry](https://www.epa.gov/sites/default/files/2020-09/documents/final_background_document_for_nitric_acid_section_8.8.pdf)
- [US EPA: ammonia reduction of nitrogen oxides](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=00001Q0O.TXT)

## Future heavy-element process families

### Selection principle

Heavy elements should unlock a new kind of system behavior. Most of their inventory can remain in
a local bed, coating, precipitate, or aerosol while ordinary gases and liquids carry oxygen, carbon,
fluorine, heat, and reaction products through the castellum. A solid-pipe network is therefore not a
prerequisite.

The three selected families form a useful progression:

- Iron stores and releases oxygen while remaining in an installed solid bed.
- Nickel temporarily becomes a volatile compound, moves through the gas network, and plates onto
  surfaces that then catalyze other reactions.
- Uranium moves as a volatile fluoride and becomes a persistent aerosol when it encounters water;
  an optional isotope state adds a distinct radiation field.

## Candidate 4: Iron-oxide oxygen-carrier loop

Recommendation: **first heavy-element unlock, after the carbon–steam family**

### Why it fits

Chemical looping uses a solid metal oxide to transfer oxygen between separated gas streams. The
player does not pipe iron around the map: they route reducing gas through an installed iron-oxide
bed, changing its oxidation state, then later route oxygen through that same bed to recharge it.

This is a strong bridge from the light-element MVP to heavier chemistry because it adds a persistent
solid state without adding solid logistics. It also converts the carbon family's `CO`, `H₂`, and
eventually `CH₄` through a finite oxygen inventory rather than requiring those gases to mix
directly with room oxygen.

### Modeled species and states

- `Fe₂O₃(s)` — the oxidized portion of an installed carrier bed.
- `Fe₃O₄(s)` — the reduced portion of that bed.
- `CO(g)` and `H₂(g)` — reducing gases supplied by the carbon–steam family.
- `CO₂(g)` and `H₂O(g)` — mobile oxidation products that propagate downstream.
- `O₂(g)` — reoxidizes the bed and may be drawn out of an occupied room.

The initial game model intentionally stops at the `Fe₂O₃`/`Fe₃O₄` pair. Real iron carriers can pass
through additional oxide and metal states, but those states should be added only if they create
legible decisions.

### Chemical reactions

#### FE-1: Carbon-monoxide oxidation

```text
3 Fe₂O₃(s) + CO(g) → 2 Fe₃O₄(s) + CO₂(g)
```

- Removes toxic, combustible `CO` without admitting free oxygen to the same chamber.
- Depletes the bed's oxidized fraction; conversion slows as usable `Fe₂O₃` is exhausted.

#### FE-2: Hydrogen oxidation

```text
3 Fe₂O₃(s) + H₂(g) → 2 Fe₃O₄(s) + H₂O(g)
```

- Converts hydrogen into steam while reducing the same finite bed inventory.
- A wet downstream room may condense the steam, moving the result into its liquid inventory.

#### FE-3: Carrier reoxidation

```text
4 Fe₃O₄(s) + O₂(g) → 6 Fe₂O₃(s) + heat
```

- Recharges the carrier but consumes local oxygen and produces a delayed thermal load.
- Switching a bed from fuel gas to air before the previous stream clears can create an unintended
  combustible mixture around a hot solid.

An eventual methane pathway may use the balanced abstraction
`12 Fe₂O₃ + CH₄ → 8 Fe₃O₄ + CO₂ + 2 H₂O`, but it is not required for the first version of this
family.

### Material closure and gameplay

Iron is conserved locally while oxygen moves into and out of its lattice. Carbon and hydrogen leave
as explicit `CO₂` and `H₂O`; nothing is hidden as a spent-bed resource. Carrier wear may reduce
reaction area, but it must not delete iron inventory.

The important second-order effect is bed history. A room may appear safe while a reduced bed is
being recharged elsewhere; its oxygen draw, heat release, and delayed downstream steam or carbon
dioxide depend on what passed through the bed several cycles earlier. Later dopants may change rate,
temperature window, or durability, but they should never create oxygen or alter stoichiometry.

### Sources

- [US DOE NETL: chemical-looping combustion and solid metal-oxide carriers](https://netl.doe.gov/node/7478)
- [US DOE NETL: iron oxides as redox oxygen carriers](https://www.netl.doe.gov/sites/default/files/2017-11/FE0026185-Kick-off-presentation.pdf)

## Candidate 5: Nickel-carbonyl migration and catalyst loop

Recommendation: **advanced heavy-element unlock after temperature and surface deposits are proven**

### Why it fits

Nickel solves the apparent solid-transport problem in a particularly dangerous way. In a suitable
carbon-monoxide stream, solid nickel forms volatile nickel carbonyl. Heating that material decomposes
it back into nickel and carbon monoxide, so the gas network can move a heavy element and plate it
onto a different surface.

The deposited nickel is not merely salvage. It can catalyze methanation in any room where `CO` and
`H₂` later meet. A bad routing decision therefore leaves a persistent reaction-rate change behind
after the visible gas cloud is gone.

### Modeled species and states

- `NiO(s)` — stable feed or oxidized nickel deposit.
- `Ni(s, surface)` — deposited metal and active catalyst area.
- `Ni(CO)₄(g)` — volatile, exceptionally toxic nickel carbonyl.
- `CO(g)` and `H₂(g)` — transport and methanation feeds.
- `CH₄(g)` and `H₂O(g)` — combustible product and steam byproduct.

### Chemical reactions

#### NI-1: Nickel-oxide reduction

```text
NiO(s) + H₂(g) → Ni(s) + H₂O(g)
```

- Activates metallic nickel while consuming hydrogen and producing steam.
- Makes catalyst preparation compete with other uses of the carbon family's hydrogen supply.

#### NI-2: Carbonyl formation

```text
Ni(s) + 4 CO(g) → Ni(CO)₄(g)
```

- Mobilizes nickel only in an appropriate carbon-monoxide-rich, cooler environment.
- Turns a manageable surface inventory into a severe gas-leak hazard.

#### NI-3: Thermal deposition

```text
Ni(CO)₄(g) + heat → Ni(s, surface) + 4 CO(g)
```

- Plates nickel onto hotter downstream surfaces and returns carbon monoxide to the room.
- A line can therefore clear its nickel-carbonyl reading while leaving both toxic `CO` and a
  persistent catalytic coating behind.

#### NI-4: Deposit oxidation

```text
2 Ni(s) + O₂(g) → 2 NiO(s) + heat
```

- Passivates or recovers an unwanted metallic deposit without deleting the nickel.
- The oxide can later be reduced again, closing the nickel oxidation-state loop.

#### NI-5: Nickel-catalyzed methanation

```text
CO(g) + 3 H₂(g) → CH₄(g) + H₂O(g) + heat
```

- Nickel changes the rate and usable temperature window but is not stoichiometrically consumed.
- The result trades an acutely toxic gas for a combustible fuel and a substantial thermal load.

### Material closure and gameplay

Nickel cycles through oxide, surface metal, and volatile carbonyl while remaining on the elemental
ledger. Carbon monoxide used to move it is regenerated during deposition. Surface nickel may be
reactivated, oxidized, or picked up again by a later suitable `CO` stream.

Nickel carbonyl should be a late unlock because its real hazard is extreme: NIOSH lists a
time-weighted exposure limit of `0.001 ppm`. It should not be presented as ordinary poison gas with
a larger damage number. Its identity comes from delayed symptoms, easy vapor transport,
temperature-driven plating, and the lasting catalytic consequences of contamination.

### Sources

- [CDC/NIOSH: the Mond nickel-carbonyl production and deposition sequence](https://www.cdc.gov/niosh/ocas/pdfs/abrwh/pres/2020/dc-rppsec253-082620-508.pdf)
- [CDC/NIOSH: nickel-carbonyl properties and exposure limits](https://www.cdc.gov/niosh/npg/npgd0444.html)
- [US DOE NETL: nickel-catalyzed methanation chemistry](https://www.netl.doe.gov/research/carbon-management/energy-systems/gasification/gasifipedia/coal-to-sng)

## Candidate 6: Uranium–fluorine contamination loop

Recommendation: **very late optional branch, after aerosols and radiation fields exist**

### Why it fits

Uranium hexafluoride is a rare case where a very heavy element participates in a volatile compound.
It can move through a gas line, condense for storage, and react with moisture to produce corrosive
hydrogen fluoride plus solid uranyl-fluoride particles. Dry fluorination can convert the particles
back to volatile `UF₆`.

This creates a strong environment-dependent propagation pattern: a dry release moves through rooms;
the first wet room destroys the carrier gas, fills with `HF`, and acquires a persistent uranium
aerosol deposit. The deposit remains after ventilation and can become a longer-term contamination
source.

### Modeled species and states

- `UF₆(g/condensed)` — volatile uranium carrier with phase-dependent storage.
- `UO₂F₂(s, aerosol)` — entrained particles that settle into a persistent surface inventory.
- `HF(g/aq)` — corrosive product that partitions strongly into water.
- `F₂(g)` — highly reactive fluorinating reagent used for recovery.
- `H₂O(g/l)`, `O₂(g)`, and `H₂(g)` — shared light-element participants and products.
- `isotopeActivity` — optional metadata on uranium inventory, not a separate chemical species.

### Chemical reactions

#### UF-1: Moisture-triggered hydrolysis

```text
UF₆(g) + 2 H₂O(g) → UO₂F₂(s, aerosol) + 4 HF(g)
```

- Occurs automatically wherever uranium hexafluoride encounters water vapor.
- Converts a mobile heavy-element gas into a corrosive gas plus particles that can travel briefly,
  settle, resuspend, and contaminate surfaces.

#### UF-2: Dry uranyl-fluoride recovery

```text
UO₂F₂(s) + 2 F₂(g) → UF₆(g) + O₂(g) + heat
```

- Recovers the volatile carrier only in a hot, dry fluorination process.
- A damp feed path instead consumes recovered material through hydrolysis again, turning small water
  leaks into expensive and hazardous feedback.

#### UF-3: Fluorine recovery

```text
2 HF + electrical energy → H₂(g) + F₂(g)
```

- Represents high-energy electrolytic dissociation after `HF` has been captured, separated, and
  dried; it is not an automatic reaction in an aqueous room.
- Returns fluorine to the recovery loop while producing hydrogen that must be routed separately.

### Material closure and gameplay

Uranium cycles between `UF₆` and `UO₂F₂`; fluorine cycles through `UF₆`, `HF`, and `F₂`. The three
scoped reactions have the net light-element effect of splitting water into hydrogen and oxygen while
retaining uranium and fluorine. Losses remain explicit in settled aerosol, filters, captured acid,
and condensed carrier inventories.

The radiological model must be honest about its premise. Natural or depleted uranium should produce
only a modest external radiation field; official NRC guidance identifies chemical exposure as the
dominant immediate hazard in conversion and deconversion. Uranium aerosol still matters as
persistent contamination and an internal heavy-metal/radiological exposure.

If this branch needs a strong room-scale radiation hazard, it should come from an explicit late-game
`EXOTIC TRANSMUTATION: ISOTOPIC ACTIVATION` recipe. That recipe changes the uranium inventory's
isotopic activity at a large Matter, energy, heat, and shielding cost. Ordinary chemistry then moves
the activated uranium without changing its isotope state. The game must not imply that ordinary
`UF₆` chemistry creates radioactivity.

### Sources

- [US NRC: uranium conversion, UF₆ phase behavior, and chemical hazards](https://www.nrc.gov/materials/fuel-cycle-fac/ur-conversion)
- [US NRC: depleted-UF₆ moisture reaction and chemical-versus-radiological risk](https://www.nrc.gov/materials/fuel-cycle-fac/ur-deconversion)
- [US DOE/Savannah River National Laboratory: balanced UF₆ hydrolysis and aerosol formation](https://www.osti.gov/servlets/purl/2404371)
- [US DOE: uranyl-fluoride fluorination and electrolytic fluorine supply](https://www.osti.gov/servlets/purl/4881730)

## MVP architecture requirements for future heavy chemistry

The MVP does not need to simulate any heavy-element family, aerosols, or radiation. It does need to
avoid data assumptions that would make them a rewrite. Preserve these boundaries before locking the
initial reactions:

- The elemental-composition ledger accepts arbitrary element symbols; it is not a fixed
  hydrogen/carbon/nitrogen/oxygen/sodium/chlorine record.
- Rooms and process beds can eventually own local solid and surface inventories alongside gas and
  liquid inventories. Solids do not need a routed network in the MVP.
- A gas-carried species may deposit onto a surface or produce an entrained aerosol. Aerosol
  transport, settling, filtration, and resuspension can be added later without pretending the solid
  is a gas.
- Catalysts and dopants modify rate laws, activation windows, capacity, or durability. They do not
  bypass elemental balance and are not consumed unless a declared reaction changes their species.
- Reaction definitions distinguish stoichiometric participants from rate modifiers and installed
  process media.
- Heavy elements travel only in an explicit volatile, dissolved, molten, or entrained species. A
  generic material-flow operation must not teleport a stationary solid inventory.
- Persistent deposits survive ordinary ventilation and can alter later reactions in the same room.
- Isotopic composition and activity are optional inventory metadata, separate from chemical formula.
  A future radiation field is derived from activity, quantity, distance, and shielding rather than a
  generic `radioactive` substance flag.
- Saves and reaction validation remain species-driven, so adding `Fe`, `Ni`, `F`, or `U` extends
  the content catalog rather than changing the simulation's core conservation rules.

These are extension seams, not MVP feature commitments. In particular, the first release needs no
solid conveyor, isotope-decay solver, aerosol UI, or uranium content.

## Recommended sequencing

### MVP

Implement only the chlorine–sodium loop. Use real species names, five balanced reactions, explicit
gas/liquid phases, core-hosted recovery inventories, and no generic chemical products.

The first implementation design pass should define:

- Species formulas and elemental compositions.
- Gas/liquid phase behavior and dissolution rates.
- Reaction stoichiometry, activation rules, heat, and rate laws.
- Separate electrolysis outlet inventories and backflow behavior.
- Core waste and exhaust inventories.
- Each species' contribution to the shared atmosphere, corrosion, heat, pressure, and radiation
  channels, plus enemy exposure and resistance to those channels.
- Conservation tests covering every chemical reaction.

Exotic transmutation may exist as one slow core recovery recipe, but the opening process must be
playable and materially recoverable without relying on it.

### First expansion

Add the carbon–steam family after temperature, steam, gas combustion, and persistent solid deposits
have enough simulation depth to make its reversible reactions legible.

### Heavy-element branch

Add the iron-oxide carrier after the carbon family and local solid inventories exist. It is the
lowest-risk proof that heavy elements can affect room chemistry without solid routing.

Unlock nickel carbonyl only after temperature-dependent phase behavior, surface deposition, and
catalytic rate modifiers are understandable. It builds directly on the carbon family's `CO` and
`H₂`.

Reserve uranium–fluorine for a separate late branch after aerosol persistence, filtration,
shielding, and optional isotope activity can carry its identity. It must not be a prerequisite for
ordinary chemical progression.

### Advanced parallel expansion

Add the nitrogen–oxide family only after gas-to-liquid absorption, catalyst windows, and multi-step
reaction fronts are proven understandable in play.

## Naming and UI rules

- Name a process by its actual operation or equation: `Brine electrolysis`, `HCl neutralization`,
  `Water-gas shift`.
- Do not invent equipment names solely to imply complexity.
- Display current reaction rate and limiting reactant, not a forecast of the full downstream cascade.
- Label every exotic process `EXOTIC TRANSMUTATION` wherever it appears.
- State plainly that elemental conservation is waived for exotic-transmutation recipes.
- Never hide discarded material behind words such as `spent`, `sludge`, or `waste` without recording
  its actual species inventory or declared elemental composition.
