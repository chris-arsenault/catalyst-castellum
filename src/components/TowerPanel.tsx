import { Crosshair, Move, RotateCw, Trash2, X } from "lucide-react";
import { useGameStore } from "../application/store";
import { useGamePresentation } from "../application/presentationContext";
import { DEFAULT_GAME_RUNTIME } from "../game/runtime";
import type { TowerInstance } from "../game/types";
import {
  chassisKey,
  defaultPlacement,
  idleKey,
  mountKey,
  orientationKey,
  packetDamage,
  policyKey,
  roleKey,
  towerColorClass,
  upgradeKey,
} from "../presentation/towerCopy";

const BuildPalette = () => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const selection = useGameStore((state) => state.towerBuildSelection);
  const setSelection = useGameStore((state) => state.setTowerBuildSelection);
  return (
    <section className="tower-panel-section" data-tutorial-anchor="tower-palette">
      <h3>{translator.text("tower.panel.build")}</h3>
      <div className="tower-palette">
        {game.availability.towers.map((chassisId) => {
          const tower = DEFAULT_GAME_RUNTIME.definition.towers[chassisId];
          const active = selection?.chassisId === chassisId;
          return (
            <button
              key={chassisId}
              type="button"
              className={active ? "selected" : ""}
              onClick={() => setSelection(active ? null : defaultPlacement(chassisId))}
              data-testid={`tower-build-${chassisId}`}
            >
              <span className={`tower-color ${towerColorClass(chassisId)}`} />
              <strong>{translator.text(chassisKey(chassisId))}</strong>
              <small>{translator.text(roleKey(tower.role))}</small>
              <b>{translator.text("tower.panel.buildAction", { cost: tower.buildCost })}</b>
            </button>
          );
        })}
      </div>
    </section>
  );
};

const PlacementControls = () => {
  const { translator } = useGamePresentation();
  const selection = useGameStore((state) => state.towerBuildSelection);
  const setSelection = useGameStore((state) => state.setTowerBuildSelection);
  if (!selection) return null;
  const tower = DEFAULT_GAME_RUNTIME.definition.towers[selection.chassisId];
  return (
    <section
      className="tower-panel-section placement-controls"
      data-tutorial-anchor="tower-placement"
    >
      <div className="tower-section-heading">
        <h3>{translator.text("tower.panel.placement")}</h3>
        <button
          type="button"
          onClick={() => setSelection(null)}
          aria-label={translator.text("tower.panel.cancel")}
        >
          <X size={14} />
        </button>
      </div>
      <p>{translator.text("tower.panel.placementHint")}</p>
      <div className="tower-option-row">
        {tower.mountFaces.map((mountFace) => (
          <button
            key={mountFace}
            type="button"
            className={selection.mountFace === mountFace ? "selected" : ""}
            onClick={() => setSelection({ ...selection, mountFace })}
          >
            {translator.text(mountKey(mountFace))}
          </button>
        ))}
      </div>
      <div className="tower-option-row">
        {tower.orientations.map((orientation) => (
          <button
            key={orientation}
            type="button"
            className={selection.orientation === orientation ? "selected" : ""}
            onClick={() => setSelection({ ...selection, orientation })}
          >
            <RotateCw size={12} /> {translator.text(orientationKey(orientation))}
          </button>
        ))}
      </div>
    </section>
  );
};

const TowerSummary = ({ tower }: { tower: TowerInstance }) => {
  const { formatters, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const setMovingTower = useGameStore((state) => state.setMovingTower);
  const stats = DEFAULT_GAME_RUNTIME.queries.effectiveTowerStats(tower, game);
  return (
    <>
      <div className="tower-stat-row">
        <span>
          {translator.text("tower.panel.range", { range: formatters.number(stats.range) })}
        </span>
        <span>
          {translator.text("tower.panel.cadence", { cadence: formatters.number(stats.cadence) })}
        </span>
        <span>{translator.text("tower.panel.targets", { count: stats.targetCap })}</span>
        <span>
          {translator.text("tower.panel.damagePerShot", {
            amount: formatters.number(packetDamage(tower.chassisId) * stats.damageMultiplier),
          })}
        </span>
        <span>
          {translator.text("tower.panel.arc", { degrees: formatters.number(stats.firingArc, 0) })}
        </span>
      </div>
      <button className="tower-move" type="button" onClick={() => setMovingTower(tower.id)}>
        <Move size={13} /> {translator.text("tower.panel.move")}
      </button>
    </>
  );
};

const TowerTargetingControls = ({ tower }: { tower: TowerInstance }) => {
  const { translator } = useGamePresentation();
  const dispatch = useGameStore((state) => state.dispatch);
  const definition = DEFAULT_GAME_RUNTIME.definition.towers[tower.chassisId];
  return (
    <>
      <h4>
        <Crosshair size={13} /> {translator.text("tower.panel.targeting")}
      </h4>
      <div className="tower-option-row">
        {definition.targetPolicies.map((policy) => (
          <button
            key={policy}
            type="button"
            data-testid={`tower-target-${policy}`}
            className={tower.targetPolicy === policy ? "selected" : ""}
            onClick={() => dispatch({ type: "set_tower_targeting", towerId: tower.id, policy })}
          >
            {translator.text(policyKey(policy))}
          </button>
        ))}
      </div>
    </>
  );
};

const TowerUpgradeControls = ({ tower }: { tower: TowerInstance }) => {
  const { formatters, selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const dispatch = useGameStore((state) => state.dispatch);
  const definition = DEFAULT_GAME_RUNTIME.definition.towers[tower.chassisId];
  const stats = DEFAULT_GAME_RUNTIME.queries.effectiveTowerStats(tower, game);
  const damage = packetDamage(tower.chassisId);
  return (
    <>
      <h4>{translator.text("tower.panel.upgrades")}</h4>
      <div className="tower-upgrade-list">
        {definition.upgrades.map((upgrade) => {
          const installed = tower.upgrades.includes(upgrade.id);
          const command = {
            type: "upgrade_tower",
            towerId: tower.id,
            upgradeId: upgrade.id,
          } as const;
          const decision = selectors.commandDecision(game, command);
          const after = DEFAULT_GAME_RUNTIME.queries.effectiveTowerStats(
            {
              ...tower,
              upgrades: [...new Set([...tower.upgrades, ...upgrade.requires, upgrade.id])],
            },
            game
          );
          const delta = translator.text("tower.panel.upgradeDelta", {
            damage: `${formatters.number(damage * stats.damageMultiplier)}→${formatters.number(damage * after.damageMultiplier)}`,
            cadence: `${formatters.number(stats.cadence)}→${formatters.number(after.cadence)}`,
            range: `${formatters.number(stats.range)}→${formatters.number(after.range)}`,
            targets: `${stats.targetCap}→${after.targetCap}`,
            arc: `${formatters.number(stats.firingArc, 0)}→${formatters.number(after.firingArc, 0)}`,
          });
          return (
            <button
              key={upgrade.id}
              type="button"
              data-testid={`tower-upgrade-${upgrade.id}`}
              disabled={installed || !decision.allowed}
              onClick={() => dispatch(command)}
            >
              <strong>{translator.text(upgradeKey(upgrade.id))}</strong>
              <span>
                {installed
                  ? translator.text("tower.panel.upgradeInstalled")
                  : translator.text("tower.panel.upgradeAction", { cost: upgrade.cost })}
              </span>
              <small>{delta}</small>
            </button>
          );
        })}
      </div>
    </>
  );
};

const TowerTelemetry = ({ tower }: { tower: TowerInstance }) => {
  const { formatters, translator } = useGamePresentation();
  const definition = DEFAULT_GAME_RUNTIME.definition.towers[tower.chassisId];
  return (
    <>
      <h4>{translator.text("tower.panel.telemetry")}</h4>
      <div className="tower-stat-row">
        <span>{translator.text("tower.panel.shots", { count: tower.shots })}</span>
        <span data-testid="tower-damage-dealt">
          {translator.text("tower.panel.damage", { amount: formatters.number(tower.damageDealt) })}
        </span>
        <span>{translator.text("tower.panel.kills", { count: tower.kills })}</span>
        <span>
          {translator.text("tower.panel.currentTargets", { count: tower.currentTargetIds.length })}
        </span>
        <span>
          {translator.text("tower.panel.targetsServiced", {
            count: tower.telemetry.targetsServiced,
          })}
        </span>
        <span>
          {translator.text("tower.panel.overkill", {
            amount: formatters.number(tower.telemetry.overkillDamage),
          })}
        </span>
        <span>
          {translator.text("tower.panel.engaged", {
            seconds: formatters.number(tower.telemetry.engagedSeconds),
          })}
        </span>
        <span>
          {translator.text("tower.panel.matterInvested", { matter: tower.totalMatterSpent })}
        </span>
      </div>
      <p>{translator.text(idleKey(tower.downtimeReason))}</p>
      {definition.attack.controlEffects.length > 0 && (
        <p>
          {translator.text("tower.panel.controlRule", {
            count: definition.attack.controlEffects.length,
          })}
        </p>
      )}
    </>
  );
};

const TowerSupplyStatus = ({ tower }: { tower: TowerInstance }) => {
  const { formatters, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const definition = DEFAULT_GAME_RUNTIME.definition.towers[tower.chassisId];
  const supplyStatus = game.towerSupply[tower.id] ?? null;
  if (!definition.supply) return null;
  return (
    <div className="tower-supply-status" data-testid="tower-supply-status">
      <p>{translator.text("tower.panel.supplyRule", { port: definition.supply.port })}</p>
      {supplyStatus && (
        <>
          <p>
            {translator.text("tower.panel.supplyDestination", {
              room: supplyStatus.destinationRoomId,
            })}
          </p>
          <p>
            {translator.text("tower.panel.supplyRate", {
              available: formatters.number(supplyStatus.availableRate),
              demand: formatters.number(supplyStatus.demandedRate),
            })}
          </p>
          <p>
            {translator.text("tower.panel.supplyStore", {
              stored: formatters.number(supplyStatus.storedAmount),
              capacity: formatters.number(supplyStatus.capacity),
            })}
          </p>
          <p>
            {translator.text("tower.panel.supplyConnections", {
              count: supplyStatus.connectionIds.length,
            })}
          </p>
          <p>
            {translator.text(`tower.panel.supplyMode.${supplyStatus.mode}` as const, {
              modifier: formatters.number(supplyStatus.modifier),
            })}
          </p>
          {supplyStatus.limitingSpecies && (
            <p>
              {translator.text("tower.panel.supplyLimiting", {
                species: supplyStatus.limitingSpecies,
              })}
            </p>
          )}
        </>
      )}
    </div>
  );
};

const SelectedTower = () => {
  const { selectors, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const towerId = useGameStore((state) => state.selectedTowerId);
  const selectTower = useGameStore((state) => state.selectTower);
  const dispatch = useGameStore((state) => state.dispatch);
  const tower = towerId ? game.towers[towerId] : null;
  if (!tower) return null;
  const dismantle = { type: "dismantle_tower", towerId: tower.id } as const;
  const dismantleDecision = selectors.commandDecision(game, dismantle);
  return (
    <section className="tower-panel-section selected-tower" data-tutorial-anchor="tower-inspector">
      <div className="tower-section-heading">
        <div>
          <span>{translator.text("tower.panel.selected")}</span>
          <h3>{translator.text(chassisKey(tower.chassisId))}</h3>
        </div>
        <button
          type="button"
          onClick={() => selectTower(null)}
          aria-label={translator.text("tower.panel.cancel")}
        >
          <X size={14} />
        </button>
      </div>
      <TowerSummary tower={tower} />
      <TowerTargetingControls tower={tower} />
      <TowerUpgradeControls tower={tower} />
      <TowerTelemetry tower={tower} />
      <TowerSupplyStatus tower={tower} />
      <button
        className="tower-dismantle"
        type="button"
        disabled={!dismantleDecision.allowed}
        onClick={() => {
          if (dispatch(dismantle)) selectTower(null);
        }}
      >
        <Trash2 size={13} />
        {translator.text("tower.panel.dismantle", { refund: dismantleDecision.refund })}
      </button>
    </section>
  );
};

export const TowerPanel = () => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const selection = useGameStore((state) => state.towerBuildSelection);
  const selectedTowerId = useGameStore((state) => state.selectedTowerId);
  return (
    <aside className="tower-panel" data-testid="tower-panel">
      <header>
        <span>{translator.text("tower.panel.kicker")}</span>
        <h2>{translator.text("tower.panel.title")}</h2>
      </header>
      <BuildPalette />
      <PlacementControls />
      <SelectedTower />
      {!selection && !selectedTowerId && Object.keys(game.towers).length === 0 && (
        <p className="tower-empty">{translator.text("tower.panel.empty")}</p>
      )}
    </aside>
  );
};
