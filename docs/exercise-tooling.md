# Catalyst exercise tooling

`pnpm exercise:run` runs the authored five-wave Harker exercise locally through the shared exercise runtime. Its default input starts each wave with zero purchases; it measures an idle defense and can lose on wave one. A loss is a successful simulation result and exits zero. Invalid commands, options, or snapshots exit one.

```sh
pnpm exercise:run --commands /tmp/exercise-commands.json --ticks 12000 --output /tmp/exercise-run.json
pnpm exercise:run --input /tmp/exercise-run.json --ticks 500 --observer trace --trace-limit 100
```

Command files contain ordered JSON entries with `waveIndex` (zero-based), `tick` (local to that wave), `sequence`, and `command`. Entries must increase by wave, then tick, then sequence. Sequence gaps are accepted. The tool passes the exact sequence to the kernel. Authored inputs include their own `start_assault`; a supplied empty array spends time in build mode until the tick limit or encounter timeout.

```json
[{ "waveIndex": 0, "tick": 0, "sequence": 0, "command": { "type": "start_assault" } }]
```

The command schema accepts ordinary placement, movement, rotation, upgrades, dismantling, targeting, field-mode changes, portals, and assault start. The runtime records denied decisions once. It never retries a denied purchase. Successful waves automatically advance to the next build phase; defeat and timeout stop the run. Commands scheduled after a wave completes appear in `skippedCommands`; inputs beyond the stopped run appear in `unexecutedCommands`.

`--ticks` is a total additional integer tick budget, default 12000. `--observer summary` returns per-wave reports, current combat and charge accounting, command decisions, and termination. `--observer trace` also copies bounded committed encounter events; `--trace-limit` defaults to 200. Observation never changes the simulation.

`--output` writes a local generated artifact with the exact final exercise snapshot and original scheduled inputs. `--input` restores that artifact and executes only unconsumed inputs. Replay retains the recorded command stream; it rejects a simultaneous `--commands` override. JSON summaries print to standard output. The tool uploads nothing.

These runs verify the shared fixture and reproducibility. They do not establish human comprehension, enjoyment, or a winning balance baseline.

## Regression layouts

Two checked-in command streams exercise five-wave continuity from the same 85-Matter opening:

```sh
pnpm exercise:run --commands tooling/fixtures/harker-direct-regression.json
pnpm exercise:run --commands tooling/fixtures/harker-catalyst-regression.json
```

They are known legal solutions for regression checks. Their later spending and earned rewards differ;
they are not controlled equal-spend comparisons. The direct layout currently finishes with more Core
than the catalytic layout. M4 measures device usefulness and human discovery before campaign tuning.
Per-wave catalyst reports use the same wave scope as combat totals. Snapshots also retain up to 64
cleanup reports for charged retries or restarts.
