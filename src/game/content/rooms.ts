import type { RoomDefinition, RoomId } from "../types";

export const ROOM_DEFINITIONS: Record<RoomId, RoomDefinition> = {
  west_intake: {
    id: "west_intake",
    code: "ENTRY",
    structure: "entry",
    ambientTemperature: 22,
    socketCount: 0,
  },
  switchyard: {
    id: "switchyard",
    code: "R-01",
    structure: "room",
    ambientTemperature: 22,
    socketCount: 2,
  },
  furnace: {
    id: "furnace",
    code: "R-02",
    structure: "room",
    ambientTemperature: 22,
    socketCount: 2,
  },
  reservoir: {
    id: "reservoir",
    code: "R-03",
    structure: "room",
    ambientTemperature: 22,
    socketCount: 2,
  },
  gallery: {
    id: "gallery",
    code: "R-04",
    structure: "room",
    ambientTemperature: 22,
    socketCount: 2,
  },
  lower_intake: {
    id: "lower_intake",
    code: "R-05",
    structure: "room",
    ambientTemperature: 22,
    socketCount: 2,
  },
  washlock: {
    id: "washlock",
    code: "R-06",
    structure: "room",
    ambientTemperature: 22,
    socketCount: 2,
  },
  core: {
    id: "core",
    code: "CORE",
    structure: "core",
    ambientTemperature: 26,
    socketCount: 0,
  },
};

/** Authored simulation order for the pack's rooms. */
export const ROOM_ORDER: readonly RoomId[] = [
  "west_intake",
  "switchyard",
  "furnace",
  "reservoir",
  "gallery",
  "lower_intake",
  "washlock",
  "core",
];
