export type CoreDamageState = "stable" | "worn" | "critical" | "failing";

export interface CoreDamageProfile {
  alarmColor: number;
  damageMarks: number;
  hullColor: number;
  integrity: number;
  state: CoreDamageState;
}

export const coreDamageProfile = (integrityPercent: number): CoreDamageProfile => {
  const integrity = Math.max(0, Math.min(1, integrityPercent / 100));
  if (integrity >= 0.75)
    return {
      alarmColor: 0xcaf47c,
      damageMarks: 0,
      hullColor: 0x496a5d,
      integrity,
      state: "stable",
    };
  if (integrity >= 0.5)
    return {
      alarmColor: 0xf1ca68,
      damageMarks: 1,
      hullColor: 0x516657,
      integrity,
      state: "worn",
    };
  if (integrity >= 0.25)
    return {
      alarmColor: 0xf29a55,
      damageMarks: 3,
      hullColor: 0x5b5747,
      integrity,
      state: "critical",
    };
  return {
    alarmColor: 0xf05d50,
    damageMarks: 5,
    hullColor: 0x57443c,
    integrity,
    state: "failing",
  };
};

export const coreIntegrityColor = (integrityPercent: number): number =>
  coreDamageProfile(integrityPercent).alarmColor;
