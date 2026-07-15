/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { initialPortalStates, roomAtWorldPoint } from "../../game/config";
import { emptyDamageLedger, emptyHazardChannels } from "../../game/engine/damage";
import { createScenarioGame, findEnemyPath } from "../../game/simulation";
import type { EnemyState } from "../../game/types";
import { EnemyTooltip } from "./EnemyTooltip";

afterEach(cleanup);

const furnaceCrawler = (): EnemyState => {
  const path = findEnemyPath({ flying: false, portalStates: initialPortalStates() });
  const pathIndex = path.findIndex(
    (step) =>
      roomAtWorldPoint({
        x: step.cell.column + 0.5,
        elevation: step.cell.elevation + 0.5,
      }) === "furnace"
  );
  return {
    id: 7,
    type: "crawler",
    health: 61.6,
    maxHealth: 74,
    routeId: "entry_to_core",
    path,
    pathIndex,
    progress: 0,
    mode: path[pathIndex]?.mode ?? "walking",
    facing: 1,
    spawnAge: 4,
    damageTaken: 12.4,
    damageBySource: emptyDamageLedger(),
    lastDamage: {
      sourceId: "thermal_exposure",
      channels: { ...emptyHazardChannels(), heat: 0.41 },
      amount: 0.41,
      elapsed: 8,
    },
  };
};

describe("enemy map detail", () => {
  it("explains current damage rate and preserves the fractional last tick", () => {
    const game = createScenarioGame("flash_point");
    const enemy = furnaceCrawler();
    game.elapsed = 8;
    game.rooms.furnace.gasTemperature.lower = 72;
    game.enemies = [enemy];

    render(<EnemyTooltip game={game} enemyId={enemy.id} />);

    const tooltip = screen.getByTestId("enemy-map-tooltip");
    expect(tooltip.textContent).toContain("R-02 · lower gas");
    expect(tooltip.textContent).toContain("THERMAL");
    expect(tooltip.textContent).toContain("0.2 HP/s");
    expect(tooltip.textContent).toContain("Last tick · −0.41 THERMAL");
    expect(tooltip.textContent).toContain("hot gas exposure");
  });
});
