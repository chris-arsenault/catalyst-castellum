import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION, deriveGame } from "../definition";
import type { TowerDefinition } from "../types";
import { GamePackCompilationError } from "./compiler";

const invalidVariants: [string, (tower: TowerDefinition) => TowerDefinition][] = [
  [
    "negative upgrade cost",
    (tower) => ({ ...tower, upgrades: tower.upgrades.map((u) => ({ ...u, cost: -100 })) }),
  ],
  ["nonfinite cadence", (tower) => ({ ...tower, cadence: Number.NaN })],
  ["overflowing cooldown", (tower) => ({ ...tower, cadence: Number.MIN_VALUE })],
  [
    "overflowing upgraded damage",
    (tower) => ({
      ...tower,
      attack: {
        ...tower.attack,
        packets: [
          {
            ...tower.attack.packets[0]!,
            channels: {
              atmosphere: 0,
              corrosion: 0,
              heat: Number.MAX_VALUE,
              pressure: 0,
              radiation: 0,
            },
          },
        ],
      },
    }),
  ],
  ["unsupported cadence", (tower) => ({ ...tower, cadence: 11 })],
  ["negative recovery", (tower) => ({ ...tower, recoveryRatio: -1 })],
  ["profitable recovery", (tower) => ({ ...tower, recoveryRatio: 1.1 })],
  ["fractional footprint", (tower) => ({ ...tower, footprint: { width: 1.5, height: 1 } })],
  ["inverted range", (tower) => ({ ...tower, minimumRange: tower.range + 1 })],
  ["empty orientations", (tower) => ({ ...tower, orientations: [] })],
  ["empty layers", (tower) => ({ ...tower, eligibleLayers: [] })],
  [
    "nonfinite damage",
    (tower) => ({
      ...tower,
      attack: {
        ...tower.attack,
        packets: [
          {
            ...tower.attack.packets[0]!,
            channels: { ...tower.attack.packets[0]!.channels, heat: Infinity },
          },
        ],
      },
    }),
  ],
  [
    "cyclic upgrades",
    (tower) => ({
      ...tower,
      upgrades: tower.upgrades.map((u, index) => ({
        ...u,
        requires: [tower.upgrades[1 - index]!.id],
      })),
    }),
  ],
  [
    "unsupported upgraded cadence",
    (tower) => ({
      ...tower,
      upgrades: tower.upgrades.map((u) => ({ ...u, cadenceMultiplier: 10 })),
    }),
  ],
  [
    "invalid supply species",
    (tower) => ({
      ...tower,
      supply: {
        port: "gas",
        acceptedSpecies: ["water"],
        rate: 1,
        localCapacity: 1,
        insufficientFlow: "direct_mode",
      },
    }),
  ],
];

describe("tower authoring boundary", () => {
  it.each(invalidVariants)("rejects %s before creating runtime state", (_, change) => {
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        towers: {
          ...DEFAULT_GAME_DEFINITION.towers,
          flash_chamber: change(DEFAULT_GAME_DEFINITION.towers.flash_chamber),
        },
      })
    ).toThrow(GamePackCompilationError);
  });

  it("accepts finite zero damage for an effect-only fixture", () => {
    const tower = DEFAULT_GAME_DEFINITION.towers.flash_chamber;
    expect(() =>
      deriveGame(DEFAULT_GAME_DEFINITION, {
        towers: {
          ...DEFAULT_GAME_DEFINITION.towers,
          flash_chamber: {
            ...tower,
            attack: {
              ...tower.attack,
              packets: tower.attack.packets.map((packet) => ({
                ...packet,
                channels: { atmosphere: 0, corrosion: 0, heat: 0, pressure: 0, radiation: 0 },
              })),
            },
          },
        },
      })
    ).not.toThrow();
  });
});
