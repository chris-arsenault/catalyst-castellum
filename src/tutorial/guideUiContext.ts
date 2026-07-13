import { createContext, useContext } from "react";

export const GuideAdvanceContext = createContext<(() => void) | null>(null);

export const useGuideAdvance = (): (() => void) => {
  const advance = useContext(GuideAdvanceContext);
  if (!advance) throw new Error("Guide tooltip rendered outside its tutorial controller.");
  return advance;
};
