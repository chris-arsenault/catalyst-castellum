export const ENVIRONMENT_HAZARD_RULES = {
  gasTemperature: {
    threshold: 60,
    rate: 0.014,
  },
  staticPressure: {
    ratioThreshold: 2.2,
    rate: 36,
  },
} as const;
