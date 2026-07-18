import type { SpritePalette } from "../spriteSheets/svg";

export interface RoomSectionMaterial {
  backA: string;
  backB: string;
  bevel: string;
  detail: string;
  hardware: string;
  highlight: string;
  interior: string;
  kind: "hull" | "site";
  ladderRail: string;
  ladderRung: string;
  machinery: string;
  outline: string;
  palette: SpritePalette;
  passage: string;
  pressure: string;
  seam: string;
  shadow: string;
  signal: string;
}

export const SITE_MATERIAL: RoomSectionMaterial = {
  backA: "#0e1a1f",
  backB: "#121f25",
  bevel: "#020607",
  detail: "#2c414a",
  hardware: "#9c6048",
  highlight: "#c3d2d3",
  interior: "#071115",
  kind: "site",
  ladderRail: "#58727d",
  ladderRung: "#b96a4d",
  machinery: "#263a42",
  outline: "#0b1215",
  palette: {
    dark: "#192b32",
    body: "#3f5964",
    light: "#80949a",
    accent: "#b5664b",
    glow: "#d5996a",
  },
  passage: "#5e8e99",
  pressure: "#c46d4d",
  seam: "#5d747c",
  shadow: "#020405",
  signal: "#d5996a",
};

export const HULL_MATERIAL: RoomSectionMaterial = {
  backA: "#3b3023",
  backB: "#473827",
  bevel: "#130e08",
  detail: "#6d4e2e",
  hardware: "#f2b34b",
  highlight: "#fff0c9",
  interior: "#1b130b",
  kind: "hull",
  ladderRail: "#d5b478",
  ladderRung: "#ffe1a0",
  machinery: "#71512e",
  outline: "#291c10",
  palette: {
    dark: "#4b3825",
    body: "#a07d4e",
    light: "#e6d2a4",
    accent: "#f2b34b",
    glow: "#ffe5a0",
  },
  passage: "#e2b965",
  pressure: "#ef7846",
  seam: "#c29b5c",
  shadow: "#070403",
  signal: "#ffe16e",
};
