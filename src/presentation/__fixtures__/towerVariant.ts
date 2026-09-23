import { DEFAULT_GAME_DEFINITION, deriveGame } from "../../game/definition";
import { createGameRuntime } from "../../game/runtime";

export const towerVariantFixture = () => {
  const flash = DEFAULT_GAME_DEFINITION.towers.flash_chamber;
  const runtime = createGameRuntime(
    deriveGame(DEFAULT_GAME_DEFINITION, {
      id: "tower-presentation-variant",
      towers: {
        ...DEFAULT_GAME_DEFINITION.towers,
        flash_chamber: {
          ...flash,
          buildCost: 29,
          cadence: 2,
          range: 5,
          firingArc: 90,
          color: "#123abc",
          mountFaces: ["ceiling"],
          orientations: ["down", "right"],
          targetPolicies: ["strongest", "last"],
          attack: {
            ...flash.attack,
            packets: flash.attack.packets.map((packet) => ({
              ...packet,
              channels: { ...packet.channels, pressure: 40 },
            })),
          },
          upgrades: flash.upgrades.map((upgrade, index) =>
            index === 0
              ? {
                  ...upgrade,
                  cost: 7,
                  damageMultiplier: 1.5,
                  cadenceMultiplier: 1.25,
                  rangeDelta: 1,
                }
              : upgrade
          ),
        },
      },
    })
  );
  let game = runtime.execute(runtime.createScenario("claim_8_delta"), {
    type: "begin_level",
  }).state;
  game.encounter.matter = 500;
  const placed = runtime.execute(game, {
    type: "place_tower",
    chassisId: "flash_chamber",
    anchor: { column: 15, elevation: 11 },
    mountFace: "ceiling",
    orientation: "down",
  });
  if (!placed.accepted) throw new Error(`Variant placement rejected: ${placed.code}`);
  game = placed.state;
  const tower = Object.values(game.encounter.towers)[0]!;
  return { runtime, game, tower };
};
