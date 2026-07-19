import type { MassActionDirectionDefinition } from "../types";
import { clamp } from "./math";

export const temperatureFactor = (
  direction: MassActionDirectionDefinition,
  temperature: number
): number => {
  const warming = clamp(
    (temperature - direction.activationTemperature) /
      Math.max(direction.fullActivationTemperature - direction.activationTemperature, 0.0001),
    0,
    1
  );
  if (direction.deactivationTemperature === undefined) return warming;
  const inactive = direction.inactiveTemperature ?? direction.deactivationTemperature;
  const cooling = clamp(
    (inactive - temperature) / Math.max(inactive - direction.deactivationTemperature, 0.0001),
    0,
    1
  );
  return warming * cooling;
};

export const pressureFactor = (
  direction: MassActionDirectionDefinition,
  pressureRatio: number
): number => {
  if (direction.minimumPressureRatio === undefined) return 1;
  return clamp(
    (pressureRatio - direction.minimumPressureRatio) /
      Math.max(
        (direction.fullPressureRatio ?? direction.minimumPressureRatio) -
          direction.minimumPressureRatio,
        0.0001
      ),
    0,
    1
  );
};
