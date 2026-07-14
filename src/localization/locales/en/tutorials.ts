import { TUTORIAL_ACID_MESSAGES } from "./tutorialAcid";

export const TUTORIAL_MESSAGES = {
  "tutorial.common.processModel": "Process model",
  "tutorial.common.tasks": "Tasks",
  "tutorial.common.complete": "{completed} / {total} complete",
  "tutorial.common.enterAssignment": "Enter assignment",
  "tutorial.common.dismiss": "Dismiss field guidance",
  "tutorial.common.restart": "Restart field guidance",
  "tutorial.common.stepProgress": "Step {current} of {total}",
  "tutorial.common.lessonComplete": "Lesson complete",
  "tutorial.common.watchNow": "Watch now",
  "tutorial.common.doNow": "Do this now",
  "tutorial.common.expandTasks": "Expand tutorial tasks",
  "tutorial.common.collapseTasks": "Collapse tutorial tasks",
  "tutorial.common.skipLesson": "Skip guided lesson",
  "tutorial.common.skipGuide": "Skip guide",
  "tutorial.common.missionTasks": "Mission tasks",
  "tutorial.common.currentAction": "Current action",
  "tutorial.common.fieldObjective": "Field objective",
  "tutorial.common.openStageControls": "Open stage controls",
  "tutorial.flash.explanation.kicker": "Teaching pause · First OX-1 flash",
  "tutorial.flash.explanation.title": "R-02’s first OX-1 flash",
  "tutorial.flash.explanation.summary":
    "The Core duct delivered hydrogen and oxygen into R-02. The agitator distributed them across both gas layers. One layer met its H₂ concentration, O₂ concentration, stoichiometric batch, agitation, and cooldown gates. Combustion consumes that mixture, creates a brief pressure impulse, and raises the chamber gas temperature.",
  "tutorial.flash.explanation.causalChain": "Explosion causal chain",
  "tutorial.flash.explanation.reactants": "H₂ + O₂ arrived",
  "tutorial.flash.explanation.feed": "Core gas feed",
  "tutorial.flash.explanation.ignition": "OX-1 ignited",
  "tutorial.flash.explanation.extent": "{extent} mol-eq reacted",
  "tutorial.flash.explanation.effects": "Blast + hot gas",
  "tutorial.flash.explanation.effectValues": "{pressure} kPa impulse · +{heat} °C gas",
  "tutorial.flash.explanation.note":
    "The pressure impulse lands once at ignition. Gas above 48 °C applies continuous thermal damage while a target remains inside that layer. Enemy hover shows its current HP per second.",
  "tutorial.flash.explanation.startAssault": "Start first assault",
  "tutorial.flash.firstSpark.completion.title": "First cycle established",
  "tutorial.flash.firstSpark.completion.explanation":
    "R-02 produced an attributed OX-1 combat hit and resolved the opening crawler wave.",
  "tutorial.flash.firstSpark.completion.instruction":
    "Continue into Stored Momentum with the chamber’s established state.",
  "tutorial.flash.firstSpark.label": "Flash Point field drill",
  "tutorial.flash.firstSpark.story.kicker": "First field assignment",
  "tutorial.flash.firstSpark.story.title": "Turn R-02 into a combustion trap",
  "tutorial.flash.firstSpark.story.paragraph.0":
    "The outer spiral has lost contact with its sentries. A crawler column is moving along the service route toward the Core, and R-02 sits directly in its path.",
  "tutorial.flash.firstSpark.mission.title": "Commission the OX-1 cycle",
  "tutorial.flash.firstSpark.mission.summary":
    "Build a repeating hydrogen-and-oxygen flash in R-02, then catch the first crawler inside it.",
  "tutorial.flash.firstSpark.task.mixChamber": "Install and run a Gas Agitator in R-02.",
  "tutorial.flash.firstSpark.task.feedReactants": "Open the Core → R-02 H₂/O₂ feed.",
  "tutorial.flash.firstSpark.task.proveIgnition": "Prime at 2× until R-02 produces an OX-1 flash.",
  "tutorial.flash.firstSpark.task.catchCrawler":
    "Start the assault and catch a crawler in the flash.",
  "tutorial.flash.firstSpark.step.installAgitator.title": "Prepare the flash chamber",
  "tutorial.flash.firstSpark.step.installAgitator.explanation":
    "R-02 lies on the crawler route. A Gas Agitator mixes its upper and lower gas layers for ignition.",
  "tutorial.flash.firstSpark.step.installAgitator.instruction":
    "Select R-02, then install a Gas Agitator in either socket.",
  "tutorial.flash.firstSpark.step.installAgitator.result":
    "The Gas Agitator now recirculates R-02’s upper and lower gas layers.",
  "tutorial.flash.firstSpark.step.runAgitator.title": "Run the gas agitator",
  "tutorial.flash.firstSpark.step.runAgitator.explanation":
    "Active agitation prepares both gas layers for the OX-1 ignition cycle.",
  "tutorial.flash.firstSpark.step.runAgitator.instruction": "Switch the R-02 Gas Agitator ON.",
  "tutorial.flash.firstSpark.step.runAgitator.result":
    "Active agitation now prepares both gas layers for OX-1 ignition.",
  "tutorial.flash.firstSpark.step.startSharedDuct.title": "Open the Core gas feed",
  "tutorial.flash.firstSpark.step.startSharedDuct.explanation":
    "The Core header holds H₂ and O₂ near their combustion ratio. Its fan drives both gases toward R-02.",
  "tutorial.flash.firstSpark.step.startSharedDuct.instruction": "Switch the Core–R-02 gas fan ON.",
  "tutorial.flash.firstSpark.step.startSharedDuct.result":
    "The fan is armed with the Core header’s H₂/O₂ mixture.",
  "tutorial.flash.firstSpark.step.beginPrime.title": "Prime the chamber",
  "tutorial.flash.firstSpark.step.beginPrime.explanation":
    "Priming starts material flow. The fan fills the routed duct first, then delivers its H₂/O₂ mixture into R-02.",
  "tutorial.flash.firstSpark.step.beginPrime.instruction": "Begin the timed prime.",
  "tutorial.flash.firstSpark.step.beginPrime.result":
    "The plant clock is live. Watch the duct inventory advance and R-02 composition respond.",
  "tutorial.flash.firstSpark.step.accelerateClock.title": "Advance the clock",
  "tutorial.flash.firstSpark.step.accelerateClock.explanation":
    "Transport and reactions unfold over simulation time. The 2× setting advances this priming cycle quickly.",
  "tutorial.flash.firstSpark.step.accelerateClock.instruction": "Set simulation speed to 2×.",
  "tutorial.flash.firstSpark.step.accelerateClock.result":
    "The clock is at 2×. R-02 composition and pressure now advance with the feed.",
  "tutorial.flash.firstSpark.step.observePrimeFlash.title": "Read the priming flash",
  "tutorial.flash.firstSpark.step.observePrimeFlash.explanation":
    "At the ignition threshold, OX-1 consumes H₂ and O₂, heats the chamber gas, and creates a short pressure pulse.",
  "tutorial.flash.firstSpark.step.observePrimeFlash.instruction":
    "Wait for the first priming flash, then inspect its incident record.",
  "tutorial.flash.firstSpark.step.observePrimeFlash.result":
    "The first OX-1 flash opens a one-time explanation of its gas feed, ignition threshold, pressure, and heat.",
  "tutorial.flash.firstSpark.step.coldAssault.title": "Cold chamber under assault",
  "tutorial.flash.firstSpark.step.coldAssault.explanation":
    "R-02 entered assault ahead of its OX-1 ignition cycle. Each surviving crawler now advances toward the Core.",
  "tutorial.flash.firstSpark.step.coldAssault.instruction":
    "Track the assault outcome, then use Retry checkpoint to rebuild the ignition cycle.",
  "tutorial.flash.firstSpark.step.coldAssault.result":
    "The priming flash armed R-02 before assault.",
  "tutorial.flash.firstSpark.step.startAssault.title": "Bring in the first wave",
  "tutorial.flash.firstSpark.step.startAssault.explanation":
    "Crawlers follow the mapped route through R-02. An OX-1 flash applies pressure impact and thermal damage to targets inside.",
  "tutorial.flash.firstSpark.step.startAssault.instruction":
    "Start the assault and keep watching R-02.",
  "tutorial.flash.firstSpark.step.startAssault.result":
    "Crawlers are advancing along the mapped route toward R-02.",
  "tutorial.flash.firstSpark.step.observeCombatFlash.title": "Confirm the combat hit",
  "tutorial.flash.firstSpark.step.observeCombatFlash.explanation":
    "After the first hit, the incident log identifies each target, applied pressure and heat damage, and the resulting kills.",
  "tutorial.flash.firstSpark.step.observeCombatFlash.instruction":
    "Wait for an assault OX-1 flash that neutralizes at least one enemy.",
  "tutorial.flash.firstSpark.step.observeCombatFlash.result":
    "Core stock → mixed-gas duct → R-02 accumulation → OX-1 flash → attributed enemy damage. The field drill is complete.",
  "tutorial.flash.storedMomentum.completion.title": "Flash Point secured",
  "tutorial.flash.storedMomentum.completion.explanation":
    "The retained OX-1 cycle held through the faster follow-up formation.",
  "tutorial.flash.storedMomentum.completion.instruction":
    "Continue to Make the Reagent for membrane-cell production.",
  "tutorial.flash.storedMomentum.label": "Stored Momentum field guidance",
  "tutorial.flash.storedMomentum.story.kicker": "Second field test",
  "tutorial.flash.storedMomentum.story.title": "Make the established cycle hold",
  "tutorial.flash.storedMomentum.story.paragraph.0":
    "R-02 retains its equipment, chamber inventory, and reaction timing from the first wave.",
  "tutorial.flash.storedMomentum.story.paragraph.1":
    "A faster formation is already entering the spiral. The shorter prime tests your ability to read the chamber and trust the cycle you built.",
  "tutorial.flash.storedMomentum.mission.title": "Hold Stored Momentum",
  "tutorial.flash.storedMomentum.mission.summary":
    "Read the retained R-02 state, use the ten-second prime, and carry the OX-1 cycle through the faster wave.",
  "tutorial.flash.storedMomentum.task.confirmCycle":
    "Confirm the R-02 agitator and Core gas feed are active.",
  "tutorial.flash.storedMomentum.task.startShortPrime":
    "Start the ten-second prime when the chamber is ready.",
  "tutorial.flash.storedMomentum.task.readShortPrime":
    "Track R-02 composition and OX-1 timing through prime.",
  "tutorial.flash.storedMomentum.task.holdFollowup": "Hold the faster follow-up wave.",
  "tutorial.flash.storedMomentum.step.prepareFollowup.title": "Read the retained chamber",
  "tutorial.flash.storedMomentum.step.prepareFollowup.explanation":
    "R-02 carries its equipment, gas inventory, temperature, and reaction cooldown into this round. The next prime lasts ten seconds.",
  "tutorial.flash.storedMomentum.step.prepareFollowup.instruction":
    "Inspect R-02’s retained state, confirm the agitator and gas feed, then start prime.",
  "tutorial.flash.storedMomentum.step.prepareFollowup.result":
    "The established OX-1 cycle is running through the shorter prime.",
  "tutorial.flash.storedMomentum.step.observeFollowupPrime.title": "Read the shorter prime",
  "tutorial.flash.storedMomentum.step.observeFollowupPrime.explanation":
    "Stored gas and chamber temperature shape the next ignition timing. Composition, pressure, and the incident record show the cycle taking form.",
  "tutorial.flash.storedMomentum.step.observeFollowupPrime.instruction":
    "Track R-02 through the ten-second prime and adjust your timing from its state.",
  "tutorial.flash.storedMomentum.step.observeFollowupPrime.result":
    "The faster wave is entering the established reaction cycle.",
  "tutorial.flash.storedMomentum.step.observeFollowupAssault.title": "Let the cycle work",
  "tutorial.flash.storedMomentum.step.observeFollowupAssault.explanation":
    "Skimmers compress the timing window. R-02’s map state and incident record show how the retained process meets them.",
  "tutorial.flash.storedMomentum.step.observeFollowupAssault.instruction":
    "Watch R-02 and its incident record through the follow-up wave.",
  "tutorial.flash.storedMomentum.step.observeFollowupAssault.result":
    "Flash Point is secured with a repeatable OX-1 cycle.",
  "tutorial.flash.reason.agitator": "Install and run a Gas Agitator in R-02.",
  "tutorial.flash.reason.feed": "Switch the Core–R-02 gas fan ON.",
  "tutorial.flash.reason.flash": "Observe R-02’s first OX-1 flash to arm the assault.",
  "tutorial.reagent.coProducts.completion.title": "Three co-products established",
  "tutorial.reagent.coProducts.completion.explanation":
    "The membrane cell converted mixed liquid feed into separated chlorine, hydrogen, and sodium hydroxide outlets.",
  "tutorial.reagent.coProducts.completion.instruction":
    "Continue to Shared Relief and sustain the cell through its gas outlet network.",
  "tutorial.reagent.coProducts.label": "Make the Reagent field lesson",
  "tutorial.reagent.coProducts.story.kicker": "Second field assignment",
  "tutorial.reagent.coProducts.story.title": "Site the membrane cell on the R-05 process line",
  "tutorial.reagent.coProducts.story.paragraph.0":
    "The next crawler route crosses R-03 while R-05 brings a chlor-alkali production train online.",
  "tutorial.reagent.coProducts.story.paragraph.1":
    "A single cell current consumes water and brine together. Every reaction extent creates chlorine, hydrogen, and sodium hydroxide, so feed availability and the smallest outlet headroom control the whole process.",
  "tutorial.reagent.coProducts.mission.title": "Establish CL-1 production",
  "tutorial.reagent.coProducts.mission.summary":
    "Mount the Membrane Cell on the feed-connected R-05 line, verify all three conserved outputs, then hold the R-03 crossing.",
  "tutorial.reagent.coProducts.task.commissionCell":
    "Mount and run the Membrane Cell at the R-05 feed junction.",
  "tutorial.reagent.coProducts.task.feedCell": "Open the Core → R-05 water-and-brine feed.",
  "tutorial.reagent.coProducts.task.proveProducts": "Produce Cl₂, H₂, and NaOH through CL-1.",
  "tutorial.reagent.coProducts.task.holdCrossing": "Hold the first R-03 crossing.",
  "tutorial.reagent.coProducts.step.installCell.title": "Install the membrane cell",
  "tutorial.reagent.coProducts.step.installCell.explanation":
    "Every room equipment socket accepts the Membrane Cell. The R-05 process line connects Core feed, R-03 transfer, and Core recovery for this assignment.",
  "tutorial.reagent.coProducts.step.installCell.instruction":
    "Install a Membrane Cell in an open R-05 socket and keep it running.",
  "tutorial.reagent.coProducts.step.installCell.result":
    "The mounted cell owns three local product buffers and draws from the R-05 feed junction.",
  "tutorial.reagent.coProducts.step.openFeed.title": "Open the liquid feed",
  "tutorial.reagent.coProducts.step.openFeed.explanation":
    "The Core pump mixes equal-use water and brine in one physical pipe and delivers both reactants to R-05.",
  "tutorial.reagent.coProducts.step.openFeed.instruction": "Switch the Core–R-05 feed pump ON.",
  "tutorial.reagent.coProducts.step.openFeed.result":
    "Water and brine can now charge the feed pipe and enter the cell junction.",
  "tutorial.reagent.coProducts.step.beginPrime.title": "Start the production clock",
  "tutorial.reagent.coProducts.step.beginPrime.explanation":
    "Priming advances liquid transport, cell current, product buffering, and downstream gas flow together.",
  "tutorial.reagent.coProducts.step.beginPrime.instruction": "Begin the timed prime.",
  "tutorial.reagent.coProducts.step.beginPrime.result":
    "The feed pipe is charging and CL-1 production can begin.",
  "tutorial.reagent.coProducts.step.accelerate.title": "Advance the process",
  "tutorial.reagent.coProducts.step.accelerate.explanation":
    "The 2× clock makes the pipe fill and the three product inventories easier to trace.",
  "tutorial.reagent.coProducts.step.accelerate.instruction": "Set simulation speed to 2×.",
  "tutorial.reagent.coProducts.step.accelerate.result": "The process network is advancing at 2×.",
  "tutorial.reagent.coProducts.step.observeProducts.title": "Read all three outlets",
  "tutorial.reagent.coProducts.step.observeProducts.explanation":
    "Every CL-1 extent places chlorine in the anode header, hydrogen in the cathode header, and sodium hydroxide in the liquor buffer.",
  "tutorial.reagent.coProducts.step.observeProducts.instruction":
    "Watch the separated outlet panel until CL-1 records production.",
  "tutorial.reagent.coProducts.step.observeProducts.result":
    "CL-1 has produced all three conserved co-products.",
  "tutorial.reagent.coProducts.step.startAssault.title": "Bring in the R-03 wave",
  "tutorial.reagent.coProducts.step.startAssault.explanation":
    "The live process continues while crawlers cross R-03, linking production state and defense timing on one clock.",
  "tutorial.reagent.coProducts.step.startAssault.instruction":
    "Start the assault and track the R-03 crossing.",
  "tutorial.reagent.coProducts.step.startAssault.result":
    "The crawler column is moving through the live production network.",
  "tutorial.reagent.coProducts.step.observeWave.title": "Hold the crossing",
  "tutorial.reagent.coProducts.step.observeWave.explanation":
    "R-03 receives the shared chlorine-and-hydrogen stream while the membrane cell continues to respond to feed and outlet headroom.",
  "tutorial.reagent.coProducts.step.observeWave.instruction":
    "Track the wave and the CL-1 rate through the round result.",
  "tutorial.reagent.coProducts.step.observeWave.result":
    "The first reagent-production round is complete.",
  "tutorial.reagent.sharedRelief.completion.title": "Shared relief commissioned",
  "tutorial.reagent.sharedRelief.completion.explanation":
    "Core recovery moved the shared R-05 gas stream and restored headroom for sustained membrane-cell current.",
  "tutorial.reagent.sharedRelief.completion.instruction":
    "Continue with the commissioned reagent-production network.",
  "tutorial.reagent.sharedRelief.label": "Shared Relief field guidance",
  "tutorial.reagent.sharedRelief.story.kicker": "Second production test",
  "tutorial.reagent.sharedRelief.story.title": "Sustain the shared gas outlet",
  "tutorial.reagent.sharedRelief.story.paragraph.0":
    "The R-05 recovery fan now connects the shared gas junction to Core recovery.",
  "tutorial.reagent.sharedRelief.story.paragraph.1":
    "Outlet flow restores anode and cathode headroom together, allowing the Membrane Cell to sustain its three-product cycle through the faster wave.",
  "tutorial.reagent.sharedRelief.mission.title": "Commission shared relief",
  "tutorial.reagent.sharedRelief.mission.summary":
    "Open Core recovery, confirm shared gas movement, and carry CL-1 production through the follow-up wave.",
  "tutorial.reagent.sharedRelief.task.openRecovery": "Open the R-05 → Core recovery fan.",
  "tutorial.reagent.sharedRelief.task.establishFlow": "Confirm Cl₂/H₂ movement into Core recovery.",
  "tutorial.reagent.sharedRelief.task.sustainCell": "Track CL-1 current through the shorter prime.",
  "tutorial.reagent.sharedRelief.task.holdWave": "Hold the Shared Relief wave.",
  "tutorial.reagent.sharedRelief.step.openRecovery.title": "Open Core recovery",
  "tutorial.reagent.sharedRelief.step.openRecovery.explanation":
    "The recovery fan draws the combined chlorine-and-hydrogen junction stream toward Core recovery and restores gas-header headroom.",
  "tutorial.reagent.sharedRelief.step.openRecovery.instruction": "Switch the R-05 recovery fan ON.",
  "tutorial.reagent.sharedRelief.step.openRecovery.result":
    "The shared gas junction now has a second active outlet.",
  "tutorial.reagent.sharedRelief.step.beginPrime.title": "Start the relief test",
  "tutorial.reagent.sharedRelief.step.beginPrime.explanation":
    "The shorter prime reveals how recovery flow, product headroom, and cell current settle together.",
  "tutorial.reagent.sharedRelief.step.beginPrime.instruction": "Begin the timed prime.",
  "tutorial.reagent.sharedRelief.step.beginPrime.result": "The shared gas outlet network is live.",
  "tutorial.reagent.sharedRelief.step.observeFlow.title": "Read the relieved headers",
  "tutorial.reagent.sharedRelief.step.observeFlow.explanation":
    "Core recovery accepts the shared junction mixture. Falling buffer fill and a live CL-1 rate show restored product headroom.",
  "tutorial.reagent.sharedRelief.step.observeFlow.instruction":
    "Track the outlet panel until Core recovery records gas flow.",
  "tutorial.reagent.sharedRelief.step.observeFlow.result":
    "Shared recovery flow is established from R-05 to the Core.",
  "tutorial.reagent.sharedRelief.step.startAssault.title": "Start the faster wave",
  "tutorial.reagent.sharedRelief.step.startAssault.explanation":
    "The established feed, cell, and recovery network continues through the compressed combat timing.",
  "tutorial.reagent.sharedRelief.step.startAssault.instruction":
    "Start the assault and track CL-1 current through the wave.",
  "tutorial.reagent.sharedRelief.step.startAssault.result":
    "The faster formation is crossing the live production network.",
  "tutorial.reagent.sharedRelief.step.observeWave.title": "Sustain production",
  "tutorial.reagent.sharedRelief.step.observeWave.explanation":
    "Feed availability and gas-header headroom continue to set CL-1 current while the formation advances.",
  "tutorial.reagent.sharedRelief.step.observeWave.instruction":
    "Track the process and wave through the level result.",
  "tutorial.reagent.sharedRelief.step.observeWave.result":
    "Make the Reagent is complete with shared recovery online.",
  "tutorial.reagent.reason.cell": "Mount and run the Membrane Cell at the R-05 feed junction.",
  "tutorial.reagent.reason.feed": "Switch the Core–R-05 feed pump ON.",
  "tutorial.reagent.reason.production": "Establish CL-1 production across all three cell outlets.",
  "tutorial.reagent.reason.recovery": "Switch the R-05 recovery fan ON.",
  "tutorial.reagent.reason.flow": "Establish shared gas flow into Core recovery.",
  ...TUTORIAL_ACID_MESSAGES,
} as const;
