import { GAS_BUFFERS, LIQUID_BUFFERS, ROOM_DEFINITIONS, ROOM_ORDER } from "../config";
import {
  GAS_ZONES,
  ROOM_REACTION_IDS,
  type GameState,
  type GasZone,
  type RoomReactionId,
  type RoomState,
} from "../types";
import { addEvent } from "./events";
import type { HazardBurst } from "./damage";
import {
  findEquipmentInstallation,
  membraneCellPower,
  membraneCellRate,
  roomContactReactionMultiplier,
  roomGasReactionMultiplier,
} from "./equipment";
import { simulateHydrogenOxygenFlash } from "./flashReaction";
import { clamp } from "./math";
import {
  analyzeRoom,
  gasAmountTotal,
  liquidAmountTotal,
  liquidTotal,
  roomGasHeadroom,
  roomLiquidHeadroom,
} from "./roomState";

const PRESSURE_PULSE_DECAY_PER_SECOND = 160;

const rate = (amount: number, dt: number): number => amount / Math.max(dt, 0.0001);

const setTelemetry = (
  room: RoomState,
  reactionId: RoomReactionId,
  amount: number,
  dt: number,
  limitingReactant: string
): void => {
  const telemetry = room.reactions[reactionId];
  if (amount > 0) {
    telemetry.lastRate += rate(amount, dt);
    telemetry.limitingReactant = limitingReactant;
    room.reactionIntensity = Math.max(room.reactionIntensity, rate(amount, dt));
  } else if (telemetry.lastRate <= 0) {
    telemetry.limitingReactant = limitingReactant;
  }
};

const limitingLabel = (candidates: Array<[string, number]>): string =>
  candidates.reduce((minimum, candidate) => (candidate[1] < minimum[1] ? candidate : minimum))[0];

const recordReaction = (state: GameState, amount: number): void => {
  state.stats.reactions += amount;
};

const hasEvent = (state: GameState, title: string): boolean =>
  state.events.some((event) => event.title === title);

const zoneName = (zone: GasZone): string => (zone === "lower" ? "lower layer" : "upper layer");

const simulateSeparatorBackflow = (state: GameState, roomId: RoomState["id"], dt: number): void => {
  const process = state.processes.chlor_alkali_cell;
  const anode = state.gasBuffers.anode_header.gas;
  const cathode = state.gasBuffers.cathode_header.gas;
  const anodeFill = gasAmountTotal(anode) / GAS_BUFFERS.anode_header.capacity;
  const cathodeFill = gasAmountTotal(cathode) / GAS_BUFFERS.cathode_header.capacity;
  const difference = anodeFill - cathodeFill;
  if (Math.abs(difference) < 0.48) return;

  const previousLeak = process.separatorLeakTotal;
  if (difference > 0) {
    const leaked = Math.min(anode.chlorine, (difference - 0.42) * 0.16 * dt);
    anode.chlorine -= leaked;
    cathode.chlorine += leaked;
    process.separatorLeakTotal += leaked;
  } else {
    const leaked = Math.min(cathode.hydrogen, (-difference - 0.42) * 0.16 * dt);
    cathode.hydrogen -= leaked;
    anode.hydrogen += leaked;
    process.separatorLeakTotal += leaked;
  }

  if (previousLeak === 0 && process.separatorLeakTotal > 0) {
    addEvent(
      state,
      "danger",
      "Electrolyzer separator cross-leak",
      "Unequal outlet backpressure has contaminated an isolated product header. Balance or stop cell current before routing the mixture.",
      roomId
    );
  }
};

const simulateElectrolysis = (state: GameState, dt: number): void => {
  const process = state.processes.chlor_alkali_cell;
  const installation = findEquipmentInstallation(state, "membrane_cell");
  if (!installation || !installation.instance.enabled) {
    process.setting = 0;
    process.lastRate = 0;
    process.powerDraw = 0;
    process.limitingReactant = "cell offline";
    return;
  }
  process.setting = 1;
  const room = state.rooms[installation.roomId];
  const anode = state.gasBuffers.anode_header.gas;
  const cathode = state.gasBuffers.cathode_header.gas;
  const liquor = state.liquidBuffers.cell_liquor.liquid;
  const anodeHeadroom = GAS_BUFFERS.anode_header.capacity - gasAmountTotal(anode);
  const cathodeHeadroom = GAS_BUFFERS.cathode_header.capacity - gasAmountTotal(cathode);
  const liquorHeadroom = LIQUID_BUFFERS.cell_liquor.capacity - liquidAmountTotal(liquor);
  const maximum = membraneCellRate(installation.instance.level) * dt;
  const candidates: Array<[string, number]> = [
    ["NaCl(aq)", room.liquid.sodium_chloride / 2],
    ["H₂O(l)", room.liquid.water / 2],
    ["Cl₂ anode headroom", anodeHeadroom],
    ["H₂ cathode headroom", cathodeHeadroom],
    ["NaOH outlet headroom", liquorHeadroom / 2],
    ["cell current", maximum],
  ];
  const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));

  room.liquid.sodium_chloride -= reacted * 2;
  room.liquid.water -= reacted * 2;
  anode.chlorine += reacted;
  cathode.hydrogen += reacted;
  liquor.sodium_hydroxide += reacted * 2;
  room.temperature = clamp(room.temperature + reacted * 0.62, 0, 180);

  process.lastRate = rate(reacted, dt);
  process.limitingReactant = limitingLabel(candidates);
  process.powerDraw = reacted > 0 ? membraneCellPower(installation.instance.level) : 0;
  if (reacted > 0 && process.totalProcessed === 0) {
    addEvent(
      state,
      "reaction",
      "Chlor-alkali cell producing",
      `${ROOM_DEFINITIONS[room.id].code} is consuming NaCl and water into isolated Cl₂, H₂, and NaOH outlet inventories.`,
      room.id
    );
  }
  process.totalProcessed += reacted;
  room.reactionIntensity = Math.max(room.reactionIntensity, process.lastRate);
  recordReaction(state, reacted);
  simulateSeparatorBackflow(state, room.id, dt);
};

const simulateHydrogenChlorine = (
  state: GameState,
  room: RoomState,
  zone: GasZone,
  dt: number
): void => {
  const gas = room.gas[zone];
  const activation = clamp((room.gasTemperature[zone] - 38) / 28, 0, 1);
  const equipmentMultiplier = roomGasReactionMultiplier(room);
  const candidates: Array<[string, number]> = [
    ["H₂(g)", gas.hydrogen],
    ["Cl₂(g)", gas.chlorine],
    ["activation temperature", 0.95 * activation * equipmentMultiplier * dt],
  ];
  const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
  gas.hydrogen -= reacted;
  gas.chlorine -= reacted;
  gas.hydrogen_chloride += reacted * 2;
  room.gasTemperature[zone] = clamp(room.gasTemperature[zone] + reacted * 4.8, 0, 260);
  room.temperature = clamp(room.temperature + reacted * 0.8, 0, 220);
  setTelemetry(
    room,
    "hydrogen_chlorine_recombination",
    reacted,
    dt,
    `${zoneName(zone)}: ${limitingLabel(candidates)}`
  );
  recordReaction(state, reacted);
  if (reacted > 0 && room.id === "furnace" && !hasEvent(state, "R-02 HCl production established")) {
    addEvent(
      state,
      "reaction",
      "R-02 HCl production established",
      "Installed heat and gas agitation are recombining balanced H₂ and Cl₂. The complete atmosphere remains available to connected lines.",
      "furnace"
    );
  }
};

const simulateHydrogenChlorideAbsorption = (
  state: GameState,
  room: RoomState,
  dt: number
): void => {
  const gas = room.gas.lower;
  const aqueousInventory = liquidTotal(room);
  const solventFactor = clamp(aqueousInventory / 8, 0, 1);
  const acidFraction = room.liquid.hydrochloric_acid / Math.max(aqueousInventory, 0.1);
  const contactMultiplier = roomContactReactionMultiplier(room);
  const concentrationHeadroom = Math.max(0, 0.58 - acidFraction) * Math.max(aqueousInventory, 1);
  const volumeHeadroom = roomLiquidHeadroom(room);
  const candidates: Array<[string, number]> = [
    ["lower HCl(g)", gas.hydrogen_chloride],
    ["aqueous solvent", 1.75 * solventFactor * contactMultiplier * dt],
    ["acid concentration", concentrationHeadroom],
    ["liquid headroom", volumeHeadroom],
  ];
  const absorbed = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
  gas.hydrogen_chloride -= absorbed;
  room.liquid.hydrochloric_acid += absorbed;
  setTelemetry(room, "hydrogen_chloride_absorption", absorbed, dt, limitingLabel(candidates));
  recordReaction(state, absorbed);
};

const simulateNeutralization = (state: GameState, room: RoomState, dt: number): void => {
  const mixing = clamp(liquidTotal(room) / 6, 0, 1);
  const contactMultiplier = roomContactReactionMultiplier(room);
  const candidates: Array<[string, number]> = [
    ["HCl(aq)", room.liquid.hydrochloric_acid],
    ["NaOH(aq)", room.liquid.sodium_hydroxide],
    ["liquid mixing", 2.8 * mixing * contactMultiplier * dt],
  ];
  const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
  room.liquid.hydrochloric_acid -= reacted;
  room.liquid.sodium_hydroxide -= reacted;
  room.liquid.sodium_chloride += reacted;
  room.liquid.water += reacted;
  room.temperature = clamp(room.temperature + reacted * 0.42, 0, 180);
  setTelemetry(room, "acid_neutralization", reacted, dt, limitingLabel(candidates));
  recordReaction(state, reacted);
};

const simulateHypochloriteFormation = (state: GameState, room: RoomState, dt: number): void => {
  const mixing = clamp(liquidTotal(room) / 6, 0, 1);
  const contactMultiplier = roomContactReactionMultiplier(room);
  const volumeHeadroom = roomLiquidHeadroom(room);
  const candidates: Array<[string, number]> = [
    ["lower Cl₂(g)", room.gas.lower.chlorine],
    ["NaOH(aq)", room.liquid.sodium_hydroxide / 2],
    ["liquid mixing", 0.82 * mixing * contactMultiplier * dt],
    ["liquid headroom", volumeHeadroom],
  ];
  const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
  room.gas.lower.chlorine -= reacted;
  room.liquid.sodium_hydroxide -= reacted * 2;
  room.liquid.sodium_hypochlorite += reacted;
  room.liquid.sodium_chloride += reacted;
  room.liquid.water += reacted;
  room.temperature = clamp(room.temperature + reacted * 0.28, 0, 180);
  setTelemetry(room, "hypochlorite_formation", reacted, dt, limitingLabel(candidates));
  recordReaction(state, reacted);
};

const simulateAcidChlorineRelease = (state: GameState, room: RoomState, dt: number): void => {
  const mixing = clamp(liquidTotal(room) / 6, 0, 1);
  const contactMultiplier = roomContactReactionMultiplier(room);
  const candidates: Array<[string, number]> = [
    ["NaOCl(aq)", room.liquid.sodium_hypochlorite],
    ["HCl(aq)", room.liquid.hydrochloric_acid / 2],
    ["liquid mixing", 0.72 * mixing * contactMultiplier * dt],
    ["gas headroom", roomGasHeadroom(room)],
  ];
  const reacted = Math.max(0, Math.min(...candidates.map(([, available]) => available)));
  room.liquid.sodium_hypochlorite -= reacted;
  room.liquid.hydrochloric_acid -= reacted * 2;
  room.liquid.sodium_chloride += reacted;
  room.gas.lower.chlorine += reacted;
  room.liquid.water += reacted;
  room.temperature = clamp(room.temperature + reacted * 0.34, 0, 180);
  setTelemetry(room, "acid_chlorine_release", reacted, dt, limitingLabel(candidates));
  recordReaction(state, reacted);
  if (
    reacted > 0 &&
    room.id === "washlock" &&
    !hasEvent(state, "R-06 chlorine evolution established")
  ) {
    addEvent(
      state,
      "reaction",
      "R-06 chlorine evolution established",
      "Absorbed HCl has cleared residual NaOH and is now acidifying NaOCl into delayed Cl₂ gas.",
      "washlock"
    );
  }
};

const simulatePhaseChanges = (room: RoomState, dt: number): void => {
  if (room.temperature > 100 && room.liquid.water > 0.05) {
    const vaporized = Math.min(
      room.liquid.water,
      (room.temperature - 96) * 0.012 * dt,
      roomGasHeadroom(room)
    );
    room.liquid.water -= vaporized;
    room.gas.lower.steam += vaporized;
    room.gasTemperature.lower = Math.max(room.gasTemperature.lower, room.temperature);
    room.temperature -= vaporized * 0.5;
  }
  if (room.temperature < 44 && roomLiquidHeadroom(room) > 0) {
    for (const zone of GAS_ZONES) {
      const steam = room.gas[zone].steam;
      if (steam <= 0.05) continue;
      const condensed = Math.min(steam, steam * 0.014 * dt, roomLiquidHeadroom(room));
      room.gas[zone].steam -= condensed;
      room.liquid.water += condensed;
    }
  }
};

const simulateRoomChemistry = (
  state: GameState,
  room: RoomState,
  dt: number,
  bursts: HazardBurst[]
): void => {
  for (const reactionId of ROOM_REACTION_IDS) room.reactions[reactionId].lastRate = 0;
  room.pressurePulse = Math.max(0, room.pressurePulse - PRESSURE_PULSE_DECAY_PER_SECOND * dt);
  for (const zone of GAS_ZONES) {
    room.flashCooldown[zone] = Math.max(0, room.flashCooldown[zone] - dt);
    const flash = simulateHydrogenOxygenFlash(state, room, zone, dt);
    if (flash) bursts.push(flash);
    simulateHydrogenChlorine(state, room, zone, dt);
  }
  simulateHydrogenChlorideAbsorption(state, room, dt);
  simulateNeutralization(state, room, dt);
  simulateHypochloriteFormation(state, room, dt);
  simulateAcidChlorineRelease(state, room, dt);
  simulatePhaseChanges(room, dt);
  const baseline = ROOM_DEFINITIONS[room.id].ambientTemperature;
  room.temperature += (baseline - room.temperature) * 0.008 * dt;
  room.reactionIntensity = Math.max(0, room.reactionIntensity - dt * 1.3);
  state.stats.peakHazard = Math.max(state.stats.peakHazard, analyzeRoom(room).hazard);
};

export const simulateReactions = (state: GameState, dt: number): HazardBurst[] => {
  const bursts: HazardBurst[] = [];
  simulateElectrolysis(state, dt);
  for (const roomId of ROOM_ORDER) simulateRoomChemistry(state, state.rooms[roomId], dt, bursts);
  return bursts;
};
