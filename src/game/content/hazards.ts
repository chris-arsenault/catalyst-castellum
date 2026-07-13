export const ENVIRONMENT_HAZARD_RULES = {
  gasTemperature: {
    threshold: 48,
    rate: 0.17,
  },
  staticPressure: {
    ratioThreshold: 2.2,
    rate: 90,
  },
} as const;
