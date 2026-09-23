# Local encounter experiments

The encounter CLI runs literal one-wave maps through the shared simulation kernel. Its fixtures
import no campaign content, browser runtime, or process inventory. These are extraction and
comparison cases; their results establish mechanics and replay behavior, not player enjoyment.

## Run and compare

```bash
pnpm encounter:run --fixture corridor --variant paired --ticks 300
pnpm encounter:compare --fixture rush --ticks 300
```

`corridor` sends eight enemies ten ticks apart. `rush` sends twelve enemies three ticks apart.
Each starts with 20 Matter and 40 Core integrity. `paired` buys two direct towers for 20 Matter;
`calibrated` buys one tower and its upgrade for the same 20 Matter. `idle` spends zero and provides
a failure control. Comparisons print every result and rejection; they assign no winner.

`--ticks` is a maximum number of additional integer ticks, each 0.1 simulated seconds. A completed
or defeated encounter stops early. `tick_limit` means the requested run ended with a live snapshot;
the fixture's own 300-tick limit produces terminal `timeout`. Neither limit counts as success.
`--batch-size` changes call size, with a default of 50; it preserves command timing and outcomes.

JSON goes to local stdout. Each run reports Core, retained and pending Matter, investment, damage,
kills, breaches, actual ticks, and every command decision. `setupMs` covers fixture creation or
snapshot loading and initial validation/encoding. `runMs` covers runner validation, stepping, and
observer collection; final snapshot encoding is outside that measurement. Timing is machine-specific.
Defeat and timeout are reported experiment results with exit code 0. Invalid options, command order,
or snapshots produce exit code 1.

## Snapshots and replay

```bash
pnpm encounter:run --fixture corridor --variant calibrated --ticks 10 --output /tmp/encounter.json
pnpm encounter:replay --input /tmp/encounter.json --ticks 290
```

`--output` writes a generated local artifact containing fixture/definition identities, the initial
and final validated snapshots, the complete scheduled command log, decisions, results, and timings.
Replay resumes the final snapshot with the unconsumed commands. It validates the artifact version
and bound definition identities. Commands already consumed by the snapshot stay consumed.
Comparison artifacts contain multiple runs; replay accepts a single run artifact.

`run --commands <local-json-file>` replaces the fixture's scheduled commands with a JSON array of
`{ "tick": 0, "sequence": 0, "command": { "type": "start_assault" } }` records. The CLI accepts
placement, movement, rotation, targeting, upgrade, dismantling, portal, and assault commands.
Inputs must be ordered by tick and strictly increasing sequence at each tick. A gameplay rejection
consumes its position and appears in the command log. The runner never retries a failed purchase.
The reusable typed runner also accepts the kernel's process commands with a configured context.

## Observers

`--observer off` and `--observer summary` retain authoritative totals and command decisions.
`--observer trace --trace-limit 200` additionally records at most 200 committed encounter events;
`traceDropped` reports omitted events. Trace copies stay outside the snapshot. All observer modes
produce the same authoritative state. Charge, field, and projectile-impact diagnostics belong to
the later catalyst mechanics milestone.
