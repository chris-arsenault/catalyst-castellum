import { TUTORIAL_ACID_MESSAGES } from "./tutorialAcid";
import { TUTORIAL_FLASH_MESSAGES } from "./tutorialFlash";

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
  "tutorial.reagent.coProducts.completion.title": "Three co-products established",
  "tutorial.reagent.coProducts.completion.explanation":
    "The membrane cell converted mixed liquid feed into separated chlorine, hydrogen, and sodium hydroxide outlets.",
  "tutorial.reagent.coProducts.completion.instruction":
    "Continue to Shared Relief and sustain the cell through its gas outlet network.",
  "tutorial.reagent.coProducts.label": "Make the Reagent field lesson",
  "tutorial.reagent.coProducts.story.kicker": "Second field assignment",
  "tutorial.reagent.coProducts.story.title": "Commission the CL-02 membrane cell",
  "tutorial.reagent.coProducts.story.paragraph.0":
    "The deckmouth route crosses the CL-02 cell bay and CL-03 reservoir. Chlorine production turns both rooms into active defenses.",
  "tutorial.reagent.coProducts.story.paragraph.1":
    "A single cell current consumes water and brine together. Every reaction extent creates chlorine, hydrogen, and sodium hydroxide, so feed availability and the smallest outlet headroom control the whole process.",
  "tutorial.reagent.coProducts.mission.title": "Establish CL-1 production",
  "tutorial.reagent.coProducts.mission.summary":
    "Mount the Membrane Cell in CL-02, verify all three conserved outputs, then neutralize the deckmouth column.",
  "tutorial.reagent.coProducts.task.commissionCell": "Mount and run the Membrane Cell in CL-02.",
  "tutorial.reagent.coProducts.task.feedCell": "Open the Core → CL-02 water-and-brine feed.",
  "tutorial.reagent.coProducts.task.proveProducts": "Produce Cl₂, H₂, and NaOH through CL-1.",
  "tutorial.reagent.coProducts.task.holdCrossing": "Neutralize the first deckmouth column.",
  "tutorial.reagent.coProducts.step.installCell.title": "Install the membrane cell",
  "tutorial.reagent.coProducts.step.installCell.explanation":
    "CL-02 links the Core feed, the CL-03 transfer duct, and Core recovery for this assignment.",
  "tutorial.reagent.coProducts.step.installCell.instruction":
    "Install a Membrane Cell in an open CL-02 socket and keep it running.",
  "tutorial.reagent.coProducts.step.installCell.result":
    "The mounted cell owns three local product buffers and draws from the CL-02 feed junction.",
  "tutorial.reagent.coProducts.step.openFeed.title": "Open the liquid feed",
  "tutorial.reagent.coProducts.step.openFeed.explanation":
    "The Core pump mixes equal-use water and brine in one physical pipe and delivers both reactants to CL-02.",
  "tutorial.reagent.coProducts.step.openFeed.instruction": "Switch the Core–CL-02 feed pump ON.",
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
  "tutorial.reagent.coProducts.step.startAssault.title": "Release the deckmouth wave",
  "tutorial.reagent.coProducts.step.startAssault.explanation":
    "The live process continues while deckmouths cross CL-02 and CL-03, linking production state and defense timing on one clock.",
  "tutorial.reagent.coProducts.step.startAssault.instruction":
    "Start the assault and track the chlorine exposure along the route.",
  "tutorial.reagent.coProducts.step.startAssault.result":
    "The deckmouth column is moving through the live production network.",
  "tutorial.reagent.coProducts.step.observeWave.title": "Hold the crossing",
  "tutorial.reagent.coProducts.step.observeWave.explanation":
    "CL-03 receives the shared chlorine-and-hydrogen stream while the membrane cell responds to feed and outlet headroom.",
  "tutorial.reagent.coProducts.step.observeWave.instruction":
    "Track the wave and the CL-1 rate through the round result.",
  "tutorial.reagent.coProducts.step.observeWave.result":
    "The first reagent-production round is complete.",
  "tutorial.reagent.sharedRelief.completion.title": "Shared relief commissioned",
  "tutorial.reagent.sharedRelief.completion.explanation":
    "Core recovery moved the shared CL-02 gas stream and restored headroom for sustained membrane-cell current.",
  "tutorial.reagent.sharedRelief.completion.instruction":
    "Continue with the commissioned reagent-production network.",
  "tutorial.reagent.sharedRelief.label": "Shared Relief field guidance",
  "tutorial.reagent.sharedRelief.story.kicker": "Second production test",
  "tutorial.reagent.sharedRelief.story.title": "Sustain the shared gas outlet",
  "tutorial.reagent.sharedRelief.story.paragraph.0":
    "The CL-02 recovery fan connects the shared gas junction to Core recovery.",
  "tutorial.reagent.sharedRelief.story.paragraph.1":
    "Outlet flow restores anode and cathode headroom together, allowing the Membrane Cell to sustain its three-product cycle through the faster wave.",
  "tutorial.reagent.sharedRelief.mission.title": "Commission shared relief",
  "tutorial.reagent.sharedRelief.mission.summary":
    "Open Core recovery, confirm shared gas movement, and carry CL-1 production through the follow-up wave.",
  "tutorial.reagent.sharedRelief.task.openRecovery": "Open the CL-02 → Core recovery fan.",
  "tutorial.reagent.sharedRelief.task.establishFlow": "Confirm Cl₂/H₂ movement into Core recovery.",
  "tutorial.reagent.sharedRelief.task.sustainCell": "Track CL-1 current through the shorter prime.",
  "tutorial.reagent.sharedRelief.task.holdWave": "Hold the Shared Relief wave.",
  "tutorial.reagent.sharedRelief.step.openRecovery.title": "Open Core recovery",
  "tutorial.reagent.sharedRelief.step.openRecovery.explanation":
    "The recovery fan draws the combined chlorine-and-hydrogen junction stream toward Core recovery and restores gas-header headroom.",
  "tutorial.reagent.sharedRelief.step.openRecovery.instruction":
    "Switch the CL-02 recovery fan ON.",
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
    "Shared recovery flow is established from CL-02 to the Core.",
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
  "tutorial.reagent.reason.cell": "Mount and run the Membrane Cell in CL-02.",
  "tutorial.reagent.reason.feed": "Switch the Core–CL-02 feed pump ON.",
  "tutorial.reagent.reason.production": "Establish CL-1 production across all three cell outlets.",
  "tutorial.reagent.reason.recovery": "Switch the CL-02 recovery fan ON.",
  "tutorial.reagent.reason.flow": "Establish shared gas flow into Core recovery.",
  ...TUTORIAL_FLASH_MESSAGES,
  ...TUTORIAL_ACID_MESSAGES,
} as const;
