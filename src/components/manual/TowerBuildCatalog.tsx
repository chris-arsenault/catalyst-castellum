import { Crosshair, LockKeyhole } from "lucide-react";
import { useMemo, useState } from "react";
import { useGamePresentation } from "../../application/presentationContext";
import { useGameStore } from "../../application/store";
import { TOWER_CHASSIS_IDS } from "../../game/identifiers";
import { DEFAULT_GAME_RUNTIME } from "../../game/runtime";
import type { TowerChassisId, TowerDefinition } from "../../game/types";
import {
  chassisKey,
  defaultPlacement,
  mountKey,
  packetDamage,
  roleKey,
  towerColorClass,
  upgradeKey,
} from "../../presentation/towerCopy";

const TowerList = ({
  onSelect,
  selectedId,
}: {
  onSelect: (id: TowerChassisId) => void;
  selectedId: TowerChassisId;
}) => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  return (
    <div className="manual-build-list" aria-label={translator.text("ui.manual.towers.catalog")}>
      {TOWER_CHASSIS_IDS.map((id) => {
        const tower = DEFAULT_GAME_RUNTIME.definition.towers[id];
        const available = game.availability.towers.includes(id);
        return (
          <button
            key={id}
            type="button"
            className={selectedId === id ? "selected" : ""}
            aria-pressed={selectedId === id}
            onClick={() => onSelect(id)}
            data-testid={`manual-tower-choice-${id}`}
          >
            <span className={`manual-tower-swatch ${towerColorClass(id)}`}>
              <Crosshair size={22} />
            </span>
            <span>
              <strong>{translator.text(chassisKey(id))}</strong>
              <small>{translator.text(roleKey(tower.role))}</small>
            </span>
            <em className={available ? "available" : ""}>
              {available ? <Crosshair size={12} /> : <LockKeyhole size={12} />}
              {tower.buildCost} M
            </em>
          </button>
        );
      })}
    </div>
  );
};

const TowerSpecifications = ({ tower }: { tower: TowerDefinition }) => {
  const { translator } = useGamePresentation();
  return (
    <dl className="manual-build-specs">
      <div>
        <dt>{translator.text("ui.manual.towers.damage")}</dt>
        <dd>{packetDamage(tower.id)}</dd>
      </div>
      <div>
        <dt>{translator.text("ui.manual.towers.service")}</dt>
        <dd>
          {translator.text("ui.manual.towers.serviceValue", {
            cadence: tower.cadence,
            targets: tower.targetCap,
          })}
        </dd>
      </div>
      <div>
        <dt>{translator.text("ui.manual.towers.coverage")}</dt>
        <dd>
          {translator.text("ui.manual.towers.coverageValue", {
            range: tower.range,
            arc: tower.firingArc,
          })}
        </dd>
      </div>
      <div>
        <dt>{translator.text("ui.manual.towers.mounts")}</dt>
        <dd>{tower.mountFaces.map((mount) => translator.text(mountKey(mount))).join(" · ")}</dd>
      </div>
    </dl>
  );
};

const TowerUpgradeList = ({ tower }: { tower: TowerDefinition }) => {
  const { translator } = useGamePresentation();
  return (
    <div className="manual-build-duties">
      <span className="manual-entry-code">{translator.text("tower.panel.upgrades")}</span>
      {tower.upgrades.map((upgrade) => (
        <div className="manual-build-duty" key={upgrade.id}>
          <strong>{translator.text(upgradeKey(upgrade.id))}</strong>
          <small>{translator.text("tower.panel.upgradeAction", { cost: upgrade.cost })}</small>
        </div>
      ))}
    </div>
  );
};

const TowerDetail = ({ id }: { id: TowerChassisId }) => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const setSelection = useGameStore((state) => state.setTowerBuildSelection);
  const closeManual = useGameStore((state) => state.closeManual);
  const tower = DEFAULT_GAME_RUNTIME.definition.towers[id];
  const available = game.phase === "build" && game.availability.towers.includes(id);
  const choosePlacement = () => {
    if (!available) return;
    setSelection(defaultPlacement(id));
    closeManual();
  };
  return (
    <article className="manual-build-detail manual-tower-detail">
      <div className={`manual-tower-mark ${towerColorClass(id)}`}>
        <Crosshair size={34} />
      </div>
      <div className="manual-build-copy">
        <span className="manual-entry-code">{translator.text(roleKey(tower.role))}</span>
        <h2>{translator.text(chassisKey(id))}</h2>
        <p>
          {translator.text("ui.manual.towers.doctrine", {
            role: translator.text(roleKey(tower.role)),
          })}
        </p>
        <TowerSpecifications tower={tower} />
        <TowerUpgradeList tower={tower} />
        <div className="manual-build-actions">
          <button
            type="button"
            className="manual-build-button"
            disabled={!available}
            onClick={choosePlacement}
            data-testid={`manual-place-tower-${id}`}
          >
            <Crosshair size={16} />{" "}
            {translator.text("tower.panel.buildAction", { cost: tower.buildCost })}
          </button>
        </div>
        {!available && (
          <small className="manual-build-reason">
            {translator.text("ui.manual.towers.locked")}
          </small>
        )}
      </div>
    </article>
  );
};

export const TowerBuildCatalog = () => {
  const game = useGameStore((state) => state.game);
  const initial = useMemo(
    () => game.availability.towers[0] ?? TOWER_CHASSIS_IDS[0],
    [game.availability.towers]
  );
  const [selectedId, setSelectedId] = useState<TowerChassisId>(initial);
  const { translator } = useGamePresentation();
  return (
    <section className="manual-page manual-build-page" data-testid="manual-tower-page">
      <header className="manual-context-bar">
        <div>
          <span>{translator.text("ui.manual.towers.kicker")}</span>
          <strong>{translator.text("ui.manual.towers.title")}</strong>
        </div>
        <p>{translator.text("ui.manual.towers.summary")}</p>
      </header>
      <div className="manual-catalog-layout">
        <TowerList onSelect={setSelectedId} selectedId={selectedId} />
        <TowerDetail id={selectedId} />
      </div>
    </section>
  );
};
