import { useEncounterControls } from "../../application/encounterSurface";
import { previewCatalystField, previewDischarge, type DischargePreview } from "../../game/tactical";

const DischargeStatus = ({ discharge }: { discharge: DischargePreview }) => {
  const {
    encounter,
    presentation: { translator, formatters, towers },
  } = useEncounterControls();
  const tower = encounter.towers[discharge.sourceId];
  const device = tower ? towers.device(tower.chassisId) : null;
  return (
    <>
      <p role="status" data-testid="catalyst-waiting">
        {discharge.waitingReason === "recharging"
          ? translator.text("catalyst.recharging", {
              seconds: formatters.number(discharge.readyIn, 1),
            })
          : translator.text(`catalyst.${discharge.waitingReason}`)}
      </p>
      <p>
        {translator.text("catalyst.chain", {
          count: discharge.chainEnemyIds.length,
          capacity: discharge.targetCap,
        })}
      </p>
      <p>
        {translator.text("catalyst.thresholds", {
          seed: discharge.seedThreshold,
          secondary: discharge.secondaryThreshold,
        })}
      </p>
      <p>{translator.text("catalyst.blockedLinks", { count: discharge.blockedLinks.length })}</p>
      <p>{translator.text("catalyst.radius", { radius: discharge.radius })}</p>
      {device?.kind === "discharge" && (
        <p>
          {translator.text("catalyst.dischargeStats", {
            distance: device.linkDistance,
            cap: device.consumeCap,
            damage: device.damagePerCharge,
            cooldown: device.cooldownSeconds,
          })}
        </p>
      )}
    </>
  );
};

export const CatalystDeviceControls = ({ towerId }: { towerId: string }) => {
  const { encounter, presentation, dispatch, setInteraction } = useEncounterControls();
  const { translator, formatters, context } = presentation;
  const field = previewCatalystField(encounter, towerId, context);
  const discharge = previewDischarge(encounter, towerId, context);
  if (!field && !discharge) return null;
  return (
    <section className="catalyst-device-status" data-testid="catalyst-device-status">
      <h4>{translator.text("catalyst.coverage")}</h4>
      {field && (
        <>
          <p role="status">
            {field.activationRemaining > 0
              ? translator.text("catalyst.activating", {
                  seconds: formatters.number(field.activationRemaining, 1),
                })
              : translator.text("catalyst.active")}
          </p>
          <div className="tower-option-row">
            {(["attract", "repel"] as const).map((mode) => {
              const command = { type: "set_field_mode", towerId, mode } as const;
              const decision = presentation.evaluate(encounter, command);
              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={field.mode === mode}
                  disabled={!decision.allowed}
                  data-testid={`field-mode-${mode}`}
                  onClick={() => {
                    if (dispatch(command)) setInteraction({ kind: "configure_field", towerId });
                  }}
                >
                  {translator.text(`catalyst.${mode}`)}
                </button>
              );
            })}
          </div>
          <p>
            {translator.text("catalyst.serviced", {
              count: field.servicedEnemyIds.length,
              capacity: field.targetCap,
            })}
          </p>
          <p>{translator.text("catalyst.radius", { radius: field.radius })}</p>
          <small>{translator.text("catalyst.acceleration")}</small>
        </>
      )}
      {discharge && <DischargeStatus discharge={discharge} />}
    </section>
  );
};
