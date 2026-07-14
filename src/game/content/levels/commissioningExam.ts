import type { LevelDefinition } from "../../definitionTypes";
import { COMMISSIONING_WAVES } from "../enemies";
import { TUTORIAL_EQUIPMENT, TUTORIAL_INITIAL_TEMPERATURES } from "../scenario";
import { ALL_AVAILABILITY, FULL_GAS_LOADOUT, FULL_LIQUID_LOADOUT } from "./fullPlant";
import { emptyLoadout } from "./helpers";

export const COMMISSIONING_EXAM_LEVEL: LevelDefinition = {
  id: "commissioning_exam",
  number: 5,
  focusRoomId: "lower_intake",
  startingMatter: 58,
  startingCoreIntegrity: 100,
  assaultTheme: "boss",
  loadout: {
    ...emptyLoadout(),
    equipment: TUTORIAL_EQUIPMENT,
    initialTemperatures: TUTORIAL_INITIAL_TEMPERATURES,
    gasConduits: FULL_GAS_LOADOUT,
    liquidConduits: FULL_LIQUID_LOADOUT,
    gasSourceGas: { starter_gas_header: { hydrogen: 40, oxygen: 20 } },
    liquidSourceAmounts: { water_tank: 140, sodium_chloride_tank: 140 },
  },
  rounds: COMMISSIONING_WAVES.map((wave, index) => ({
    id: `commissioning_${index + 1}`,
    primeSeconds: 72,
    wave,
    availability: ALL_AVAILABILITY,
  })),
};
