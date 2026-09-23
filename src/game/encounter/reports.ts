import type { EncounterReport, EncounterResult, EncounterState } from "./types";
import { catalystReport } from "./catalystReport";

export const encounterReport = (state: EncounterState): EncounterReport => ({
  ...structuredClone(state.stats),
  catalyst: catalystReport(state),
  towers: Object.fromEntries(
    Object.values(state.towers).map((tower) => [
      tower.id,
      {
        chassisId: tower.chassisId,
        damageDealt: tower.damageDealt,
        kills: tower.kills,
        shots: tower.shots,
        overkillDamage: tower.telemetry.overkillDamage,
        engagedSeconds: tower.telemetry.engagedSeconds,
        targetsServiced: tower.telemetry.targetsServiced,
        controlApplications: tower.telemetry.controlApplications,
        matterInvested: tower.totalMatterSpent,
        downtime: { ...tower.telemetry.downtime },
      },
    ])
  ),
});

export const finishEncounter = (
  state: EncounterState,
  termination: EncounterResult["termination"]
): void => {
  state.phase = termination;
  state.result = {
    encounterId: state.definition.id,
    termination,
    ticks: state.tick,
    coreIntegrity: state.coreIntegrity,
    matter: state.matter,
    pendingMatter: state.pendingMatter,
    report: encounterReport(state),
  };
};
