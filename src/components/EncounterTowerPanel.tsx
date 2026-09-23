import { Crosshair, Move, RotateCw, Trash2, X } from "lucide-react";
import { useEncounterControls } from "../application/encounterSurface";
import type { EncounterTower } from "../game/encounter/types";
import { idleKey, orientationKey, policyKey, roleKey, upgradeKey } from "../presentation/towerCopy";
import { TowerAimControls } from "./towerPanel/TowerAimControls";
import { CatalystDeviceControls } from "./towerPanel/CatalystDeviceControls";

const BuildPalette = () => {
  const { towers, translator } = useEncounterControls().presentation;
  const encounter = useEncounterControls().encounter;
  const selection = useEncounterControls().selection;
  const setSelection = useEncounterControls().setSelection;
  return (
    <section className="tower-panel-section" data-tutorial-anchor="tower-palette">
      <h3>{translator.text("tower.panel.build")}</h3>
      <div className="tower-palette">
        {encounter.availability.towers.map((chassisId) => {
          const tower = towers.definition(chassisId);
          const active = selection?.chassisId === chassisId;
          return (
            <button
              key={chassisId}
              type="button"
              className={active ? "selected" : ""}
              onClick={() => setSelection(active ? null : towers.defaultPlacement(chassisId))}
              data-testid={`tower-build-${chassisId}`}
            >
              <svg className="tower-color" aria-hidden="true">
                <rect width="100%" height="100%" rx="3" fill={tower.color} />
              </svg>
              <strong>{towers.name(chassisId)}</strong>
              {!towers.device(chassisId) && <small>{translator.text(roleKey(tower.role))}</small>}
              <small className="tower-process">{towers.description(chassisId)}</small>
              <b>{translator.text("tower.panel.buildAction", { cost: tower.buildCost })}</b>
            </button>
          );
        })}
      </div>
    </section>
  );
};

const PlacementControls = () => {
  const { towers, translator } = useEncounterControls().presentation;
  const selection = useEncounterControls().selection;
  const setSelection = useEncounterControls().setSelection;
  if (!selection) return null;
  const tower = towers.definition(selection.chassisId);
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

const TowerSummary = ({ tower }: { tower: EncounterTower }) => {
  const { formatters, towers, translator } = useEncounterControls().presentation;
  const encounter = useEncounterControls().encounter;
  const setMovingTower = useEncounterControls().setMovingTower;
  const stats = towers.stats(tower, encounter);
  const device = towers.device(tower.chassisId);
  if (device && device.kind !== "weapon")
    return (
      <button className="tower-move" type="button" onClick={() => setMovingTower(tower.id)}>
        <Move size={13} /> {translator.text("tower.panel.move")}
      </button>
    );
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
            amount: formatters.number(
              towers.packetDamage(tower.chassisId) * stats.damageMultiplier
            ),
          })}
        </span>
        <span>
          {translator.text("tower.panel.arc", { degrees: formatters.number(stats.firingArc, 0) })}
        </span>
      </div>
      <button className="tower-move" type="button" onClick={() => setMovingTower(tower.id)}>
        <Move size={13} /> {translator.text("tower.panel.move")}
      </button>
      {device?.kind === "weapon" && device.chargePerHit > 0 && (
        <p>{translator.text("catalyst.chargePerHit", { amount: device.chargePerHit })}</p>
      )}
    </>
  );
};

const TowerTargetingControls = ({ tower }: { tower: EncounterTower }) => {
  const { towers, translator } = useEncounterControls().presentation;
  const dispatch = useEncounterControls().dispatch;
  const definition = towers.definition(tower.chassisId);
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

const TowerUpgradeControls = ({ tower }: { tower: EncounterTower }) => {
  const { formatters, evaluate, towers, translator } = useEncounterControls().presentation;
  const encounter = useEncounterControls().encounter;
  const dispatch = useEncounterControls().dispatch;
  const definition = towers.definition(tower.chassisId);
  const stats = towers.stats(tower, encounter);
  const damage = towers.packetDamage(tower.chassisId);
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
          const decision = evaluate(encounter, command);
          const after = towers.stats(
            {
              ...tower,
              upgrades: [...new Set([...tower.upgrades, ...upgrade.requires, upgrade.id])],
            },
            encounter
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

const TowerTelemetry = ({ tower }: { tower: EncounterTower }) => {
  const { formatters, towers, translator } = useEncounterControls().presentation;
  const definition = towers.definition(tower.chassisId);
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

const TowerSupplyStatus = ({ tower }: { tower: EncounterTower }) => {
  const { formatters, towers, translator } = useEncounterControls().presentation;
  const encounter = useEncounterControls().encounter;
  const definition = towers.definition(tower.chassisId);
  const supplyStatus = encounter.process?.towerSupply[tower.id] ?? null;
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
  const { evaluate, towers, translator } = useEncounterControls().presentation;
  const encounter = useEncounterControls().encounter;
  const towerId = useEncounterControls().selectedTowerId;
  const selectTower = useEncounterControls().selectTower;
  const dispatch = useEncounterControls().dispatch;
  const tower = towerId ? encounter.towers[towerId] : null;
  if (!tower) return null;
  const dismantle = { type: "dismantle_tower", towerId: tower.id } as const;
  const dismantleDecision = evaluate(encounter, dismantle);
  const device = towers.device(tower.chassisId);
  const weapon = !device || device.kind === "weapon";
  return (
    <section className="tower-panel-section selected-tower" data-tutorial-anchor="tower-inspector">
      <div className="tower-section-heading">
        <div>
          <span>{translator.text("tower.panel.selected")}</span>
          <h3>{towers.name(tower.chassisId)}</h3>
          <p className="tower-process-detail">{towers.description(tower.chassisId)}</p>
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
      <CatalystDeviceControls towerId={tower.id} />
      {weapon && <TowerAimControls tower={tower} />}
      {weapon && <TowerTargetingControls tower={tower} />}
      {towers.definition(tower.chassisId).upgrades.length > 0 && (
        <TowerUpgradeControls tower={tower} />
      )}
      {weapon && <TowerTelemetry tower={tower} />}
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

export const EncounterTowerPanel = () => {
  const { translator } = useEncounterControls().presentation;
  const encounter = useEncounterControls().encounter;
  const selection = useEncounterControls().selection;
  const selectedTowerId = useEncounterControls().selectedTowerId;
  return (
    <aside className="tower-panel" data-testid="tower-panel">
      <header>
        <span>{translator.text("tower.panel.kicker")}</span>
        <h2>{translator.text("tower.panel.title")}</h2>
      </header>
      <BuildPalette />
      <PlacementControls />
      <SelectedTower />
      {!selection && !selectedTowerId && Object.keys(encounter.towers).length === 0 && (
        <p className="tower-empty">{translator.text("tower.panel.empty")}</p>
      )}
    </aside>
  );
};
