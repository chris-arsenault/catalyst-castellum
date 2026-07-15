export const ENVIRONMENT_HAZARD_RULES = {
  gasTemperature: {
    threshold: 60,
    rate: 0.015,
  },
  staticPressure: {
    ratioThreshold: 2.2,
    rate: 90,
  },
} as const;
