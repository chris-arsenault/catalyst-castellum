import { createContext, useContext } from "react";
import type { EncounterCommand, EncounterState } from "../game/tactical";
import type { RoomId } from "../game/types";
import type { TacticalPresentation } from "../presentation/tactical";
import type { TowerBuildSelection } from "./storeTypes";

export type EncounterInteraction =
  | { kind: "inspect"; towerId: string | null }
  | { kind: "place"; selection: TowerBuildSelection }
  | { kind: "move"; towerId: string; selection: TowerBuildSelection }
  | { kind: "configure_field"; towerId: string };

export interface EncounterSurfaceValue {
  encounter: EncounterState;
  presentation: TacticalPresentation;
  interaction: EncounterInteraction;
  setInteraction: (interaction: EncounterInteraction) => void;
  selectedRoomId: RoomId;
  selectRoom: (roomId: RoomId) => void;
  dispatch: (command: EncounterCommand) => boolean;
  currentEncounter: () => EncounterState;
  reducedMotion: boolean;
  focusedRouteId: string | null;
  focusRoute: (routeId: string | null) => void;
}

export const EncounterSurfaceContext = createContext<EncounterSurfaceValue | null>(null);
export const useOptionalEncounterSurface = () => useContext(EncounterSurfaceContext);
export const useEncounterSurface = (): EncounterSurfaceValue => {
  const value = useOptionalEncounterSurface();
  if (!value) throw new Error("Encounter controls require their session provider.");
  return value;
};

export const surfaceSelection = (interaction: EncounterInteraction) =>
  interaction.kind === "place" || interaction.kind === "move" ? interaction.selection : null;
export const surfaceTowerId = (interaction: EncounterInteraction) =>
  interaction.kind === "place" ? null : interaction.towerId;

export const useEncounterControls = () => {
  const surface = useEncounterSurface();
  return {
    ...surface,
    selection: surfaceSelection(surface.interaction),
    selectedTowerId: surfaceTowerId(surface.interaction),
    selectTower: (towerId: string | null) => surface.setInteraction({ kind: "inspect", towerId }),
    setSelection: (selection: TowerBuildSelection | null) => {
      if (!selection) surface.setInteraction({ kind: "inspect", towerId: null });
      else if (surface.interaction.kind === "move")
        surface.setInteraction({ ...surface.interaction, selection });
      else surface.setInteraction({ kind: "place", selection });
    },
    setMovingTower: (towerId: string) => {
      const tower = surface.encounter.towers[towerId];
      if (tower)
        surface.setInteraction({
          kind: "move",
          towerId,
          selection: {
            chassisId: tower.chassisId,
            mountFace: tower.placement.mountFace,
            orientation: tower.placement.orientation,
          },
        });
    },
  };
};
