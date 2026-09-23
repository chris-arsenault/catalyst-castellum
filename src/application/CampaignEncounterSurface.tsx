import { useMemo, type ReactNode } from "react";
import { useGameStore } from "./store";
import { EncounterSurfaceContext, type EncounterInteraction } from "./encounterSurface";
import { campaignEncounterContext } from "../game/tactical";
import { createTacticalPresentation } from "../presentation/tactical";
import { useGamePresentation } from "./presentationContext";
import type { GameStore } from "./storeTypes";
import { useEncounterPreferences } from "./useEncounterPreferences";

const campaignInteraction = (session: GameStore): EncounterInteraction => {
  if (!session.towerBuildSelection) return { kind: "inspect", towerId: session.selectedTowerId };
  if (session.movingTowerId)
    return { kind: "move", towerId: session.movingTowerId, selection: session.towerBuildSelection };
  return { kind: "place", selection: session.towerBuildSelection };
};

/** Campaign ownership stays here; reusable tactical controls receive only their encounter. */
export const CampaignEncounterSurface = ({ children }: { children: ReactNode }) => {
  const session = useGameStore();
  const preferences = useEncounterPreferences();
  const { runtime, locale } = useGamePresentation();
  const presentation = useMemo(
    () =>
      createTacticalPresentation(
        campaignEncounterContext(session.game, runtime.definition),
        locale
      ),
    [session.game, runtime, locale]
  );
  const interaction = campaignInteraction(session);
  const setInteraction = (next: EncounterInteraction) => {
    if (next.kind === "place") session.setTowerBuildSelection(next.selection);
    else if (next.kind === "move") {
      session.setMovingTower(next.towerId);
      session.setTowerBuildSelection(next.selection);
    } else session.selectTower(next.towerId);
  };
  return (
    <EncounterSurfaceContext.Provider
      value={{
        ...preferences,
        encounter: session.game.encounter,
        presentation,
        interaction,
        setInteraction,
        selectedRoomId: session.selectedRoomId,
        selectRoom: session.selectRoom,
        dispatch: session.dispatch,
        currentEncounter: () => useGameStore.getState().game.encounter,
      }}
    >
      {children}
    </EncounterSurfaceContext.Provider>
  );
};
