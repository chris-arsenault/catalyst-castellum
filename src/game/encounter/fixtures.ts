import { corridorCombat, corridorEncounter } from "./__fixtures__/corridor";
import type { EncounterContext, OrderedEncounterCommand } from "./types";

export const ENCOUNTER_FIXTURES = ["corridor", "rush"] as const;
export const ENCOUNTER_VARIANTS = ["paired", "calibrated", "idle"] as const;
export type EncounterFixtureName = (typeof ENCOUNTER_FIXTURES)[number];
export type EncounterVariantName = (typeof ENCOUNTER_VARIANTS)[number];

export interface EncounterFixture {
  name: EncounterFixtureName;
  variant: EncounterVariantName;
  context: EncounterContext;
  commands: readonly OrderedEncounterCommand[];
}

const placement = (elevation: number): OrderedEncounterCommand["command"] => ({
  type: "place_tower",
  chassisId: "flash_chamber",
  anchor: { column: 1, elevation },
  mountFace: "left_wall",
  orientation: "right",
});

const variantCommands = (variant: EncounterVariantName): OrderedEncounterCommand[] => {
  const commands: OrderedEncounterCommand["command"][] = [];
  if (variant !== "idle") commands.push(placement(1));
  if (variant === "paired") commands.push(placement(3));
  if (variant === "calibrated")
    commands.push({
      type: "upgrade_tower",
      towerId: "tower:isolated:1",
      upgradeId: "flash_calibration",
    });
  commands.push({ type: "start_assault" });
  return commands.map((command, sequence) => ({ tick: 0, sequence, command }));
};

/** Literal process-free fixtures compare tower count and calibration at the same 20 Matter cost. */
export const createNamedEncounterFixture = (
  name: EncounterFixtureName,
  variant: EncounterVariantName
): EncounterFixture => {
  const tower = corridorCombat.towers.flash_chamber!;
  return {
    name,
    variant,
    context: {
      combat: {
        ...corridorCombat,
        id: "direct-comparison",
        contentVersion: 1,
        enemies: { deckmouth: { ...corridorCombat.enemies.deckmouth!, speed: 0.06 } },
        towers: {
          flash_chamber: {
            ...tower,
            range: 8,
            upgrades: tower.upgrades.map((upgrade) => ({ ...upgrade, cost: 10 })),
          },
        },
      },
      definition: {
        ...corridorEncounter,
        id: `direct-comparison:${name}`,
        contentVersion: 1,
        startingMatter: 20,
        startingCoreIntegrity: 40,
        maximumTicks: 300,
        wave: Array.from({ length: name === "rush" ? 12 : 8 }, (_, index) => ({
          tick: index * (name === "rush" ? 3 : 10),
          type: "deckmouth",
          level: 20,
          routeId: "lane",
        })),
      },
      process: null,
    },
    commands: variantCommands(variant),
  };
};
