import type { ReactNode } from "react";
import type { GamePresentation } from "../presentation/services";
import { GamePresentationContext } from "./presentationContext";

export const GamePresentationProvider = ({
  children,
  presentation,
}: {
  children: ReactNode;
  presentation: GamePresentation;
}) => (
  <GamePresentationContext.Provider value={presentation}>
    {children}
  </GamePresentationContext.Provider>
);
