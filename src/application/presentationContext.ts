import { createContext, useContext } from "react";
import { DEFAULT_GAME_PRESENTATION, type GamePresentation } from "../presentation/services";

export const GamePresentationContext = createContext<GamePresentation>(DEFAULT_GAME_PRESENTATION);

export const useGamePresentation = (): GamePresentation => useContext(GamePresentationContext);
