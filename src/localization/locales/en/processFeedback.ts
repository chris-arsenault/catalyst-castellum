export const PROCESS_FEEDBACK_MESSAGES = {
  "ui.reactionEngine.title": "Reaction engine",
  "ui.reactionEngine.sampling": "Measuring live process change",
  "ui.reactionEngine.change.low": "Low change",
  "ui.reactionEngine.change.moderate": "Moderate change",
  "ui.reactionEngine.change.high": "High change",
  "ui.reactionEngine.summary.building":
    "{change} · {homeostasis} homeostasis · Building rooms: {building}",
  "ui.reactionEngine.summary.draining":
    "{change} · {homeostasis} homeostasis · Draining rooms: {draining}",
  "ui.reactionEngine.summary.mixed":
    "{change} · {homeostasis} homeostasis · Building rooms: {building} · draining: {draining}",
  "ui.reactionEngine.summary.priming":
    "{change} · {homeostasis} homeostasis · Priming lines: {priming}",
  "ui.reactionEngine.summary.steady":
    "{change} · {homeostasis} homeostasis · {rate} mol-eq/s reacting",
  "ui.roomEffect.title": "Target room effect",
  "ui.roomEffect.increase": "Effectiveness increases",
  "ui.roomEffect.decrease": "Effectiveness decreases",
  "ui.roomEffect.steady": "Effectiveness holds",
  "ui.roomEffect.basis": "Immediate room response",
  "ui.process.telemetry": "Process telemetry",
} as const;
