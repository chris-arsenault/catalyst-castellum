import { useMemo, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import type { WorldPoint } from "../../game/types";
import { useEncounterControls } from "../../application/encounterSurface";
import { mapViewFor } from "./mapGeometry";
import type { useMapCamera } from "./useMapCamera";

const directions: Record<string, WorldPoint> = {
  ArrowLeft: { x: -1, elevation: 0 },
  ArrowRight: { x: 1, elevation: 0 },
  ArrowUp: { x: 0, elevation: 1 },
  ArrowDown: { x: 0, elevation: -1 },
};

const placementKeys =
  (
    controls: ReturnType<typeof useEncounterControls>,
    pointer: WorldPoint | null,
    setPointer: React.Dispatch<React.SetStateAction<WorldPoint | null>>,
    place: (point: WorldPoint | null) => void
  ) =>
  (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Escape") {
      controls.setSelection(null);
      setPointer(null);
      return;
    }
    const selection = controls.selection;
    if (!selection) return;
    const delta = directions[event.key];
    if (delta) {
      event.preventDefault();
      const room =
        controls.encounter.map.rooms[controls.selectedRoomId] ??
        Object.values(controls.encounter.map.rooms)[0]!;
      setPointer((current) => ({
        x: (current?.x ?? room.bounds.column) + delta.x,
        elevation: (current?.elevation ?? room.bounds.elevation) + delta.elevation,
      }));
    } else if (event.key.toLowerCase() === "r") {
      const orientations = controls.presentation.towers.definition(
        selection.chassisId
      ).orientations;
      controls.setSelection({
        ...selection,
        orientation:
          orientations[(orientations.indexOf(selection.orientation) + 1) % orientations.length]!,
      });
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      place(pointer);
    }
  };

export const useEncounterPlacement = (camera: ReturnType<typeof useMapCamera>) => {
  const controls = useEncounterControls();
  const {
    encounter,
    selection,
    interaction,
    presentation,
    dispatch,
    selectTower,
    currentEncounter,
  } = controls;
  const [pointer, setPointer] = useState<WorldPoint | null>(null);
  const movingId = interaction.kind === "move" ? interaction.towerId : null;
  const preview = useMemo(
    () =>
      selection && pointer
        ? presentation.towerPlanning.planPlacement(
            encounter,
            pointer,
            selection.chassisId,
            selection.orientation,
            movingId
          )
        : null,
    [encounter, pointer, selection, movingId, presentation]
  );
  const worldPoint = (event: MouseEvent<HTMLDivElement> | PointerEvent<HTMLDivElement>) => {
    const bounds =
      event.currentTarget.querySelector("canvas")?.getBoundingClientRect() ??
      event.currentTarget.getBoundingClientRect();
    return mapViewFor(encounter.map).clientToWorldPoint(
      { x: event.clientX, y: event.clientY },
      camera.camera,
      { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height }
    );
  };
  const place = (point: WorldPoint | null) => {
    if (!selection || !point) return;
    const candidate = presentation.towerPlanning.planPlacement(
      encounter,
      point,
      selection.chassisId,
      selection.orientation,
      movingId
    );
    if (!candidate) return;
    const placement = {
      anchor: candidate.anchor,
      mountFace: candidate.mountFace,
      orientation: candidate.orientation,
    };
    const accepted = dispatch(
      movingId
        ? { type: "move_tower", towerId: movingId, ...placement }
        : { type: "place_tower", chassisId: selection.chassisId, ...placement }
    );
    if (accepted) selectTower(movingId ?? Object.keys(currentEncounter().towers).at(-1) ?? null);
  };
  return {
    preview,
    onKeyDown: placementKeys(controls, pointer, setPointer, place),
    trackPlacement: (event: PointerEvent<HTMLDivElement>) => {
      if (selection && event.target instanceof HTMLCanvasElement) setPointer(worldPoint(event));
    },
    onClick: (event: MouseEvent<HTMLDivElement>) => {
      if (!(event.target instanceof HTMLCanvasElement) || !selection) return;
      const point = worldPoint(event);
      setPointer(point);
      place(point);
    },
  };
};
