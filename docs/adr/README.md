# Architecture decision records

Decisions with real rejected alternatives live here, one file per decision, in the order
they were made. Design ledgers and completion contracts stay in `docs/` proper; ADRs are
the only home for trade-off discussion.

| ADR                                             | Decision                                                       |
| ----------------------------------------------- | -------------------------------------------------------------- |
| [0001](0001-simulation-runs-on-a-map.md)        | The simulation runs on a Map; producers make Maps              |
| [0002](0002-instance-keyed-world-identity.md)   | Rooms, runs, and portals are instance-keyed, not closed unions |
| [0003](0003-random-producer-chunk-assembly.md)  | The random-layout producer assembles authored chunks by seed   |
| [0004](0004-save-is-hull-is-one-run.md)         | A save is one hull is one run                                  |
| [0005](0005-connections-are-routed-map-data.md) | Connections are routed map data between arbitrary rooms        |
