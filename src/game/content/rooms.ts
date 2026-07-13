import type { RoomDefinition, RoomId } from "../types";

export const ROOM_DEFINITIONS: Record<RoomId, RoomDefinition> = {
  west_intake: {
    id: "west_intake",
    name: "West Breach",
    code: "ENTRY",
    structure: "entry",
    ambientTemperature: 22,
    socketCount: 0,
    features: [],
    blurb: "Hostiles enter through this excavated breach before following the outer spiral.",
  },
  switchyard: {
    id: "switchyard",
    name: "Upper Outer Bay",
    code: "R-01",
    structure: "room",
    ambientTemperature: 22,
    socketCount: 2,
    features: [],
    blurb: "A high outer chamber on the hostile path, with two generic equipment sockets.",
  },
  furnace: {
    id: "furnace",
    name: "Lower Outer Bay",
    code: "R-02",
    structure: "room",
    ambientTemperature: 22,
    socketCount: 2,
    features: [],
    blurb:
      "A deep outer chamber on the hostile path. Any mixing, heat, or reaction role comes from installed equipment.",
  },
  reservoir: {
    id: "reservoir",
    name: "Upper Middle Bay",
    code: "R-03",
    structure: "room",
    ambientTemperature: 22,
    socketCount: 2,
    features: [],
    blurb: "A high middle chamber with two generic sockets and no intrinsic process role.",
  },
  gallery: {
    id: "gallery",
    name: "Lower Middle Bay",
    code: "R-04",
    structure: "room",
    ambientTemperature: 22,
    socketCount: 2,
    features: [],
    blurb: "A low middle chamber where the inward corridor turns toward the Core.",
  },
  lower_intake: {
    id: "lower_intake",
    name: "Upper Inner Bay",
    code: "R-05",
    structure: "room",
    ambientTemperature: 22,
    socketCount: 2,
    features: ["separated_cell_manifold"],
    blurb:
      "A high inner chamber beside an explicit separated-outlet manifold used by compatible equipment.",
  },
  washlock: {
    id: "washlock",
    name: "Lower Inner Bay",
    code: "R-06",
    structure: "room",
    ambientTemperature: 22,
    socketCount: 2,
    features: [],
    blurb: "A low inner chamber on the final corridor approach, with two generic sockets.",
  },
  core: {
    id: "core",
    name: "Catalyst Core",
    code: "CORE",
    structure: "core",
    ambientTemperature: 26,
    socketCount: 0,
    features: [],
    blurb:
      "The central keep houses feedstock, exhaust, recovery, and the structure the facility defends.",
  },
};

export const ROOM_ORDER = Object.keys(ROOM_DEFINITIONS) as RoomId[];
