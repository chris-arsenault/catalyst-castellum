import { CircleHelp, LogOut } from "lucide-react";
import { useGamePresentation } from "../application/presentationContext";
import { useGameStore } from "../application/store";

/** Shell chrome shared by the play surface and the captain's log. */
export const BrandLockup = () => {
  const { translator } = useGamePresentation();
  return (
    <div className="brand-lockup" aria-label={translator.text("ui.brand.name")}>
      <div className="brand-mark">
        <span />
        <span />
        <span />
      </div>
      <div>
        <p>{translator.text("ui.brand.first")}</p>
        <strong>{translator.text("ui.brand.second")}</strong>
      </div>
    </div>
  );
};

export { AudioControls } from "./AudioControls";

export const SaveSlotsButton = () => {
  const { translator } = useGamePresentation();
  const returnToMainMenu = useGameStore((state) => state.returnToMainMenu);
  return (
    <button
      className="menu-shortcut-button"
      type="button"
      aria-label={translator.text("ui.topbar.returnSaveSlots")}
      data-testid="save-slots-button"
      title={translator.text("ui.topbar.saveSlots")}
      onClick={returnToMainMenu}
    >
      <LogOut size={17} /> <span>{translator.text("ui.topbar.saveSlots")}</span>
    </button>
  );
};

export const EncyclopediaButton = () => {
  const { translator } = useGamePresentation();
  const openManual = useGameStore((state) => state.openManual);
  return (
    <button
      className="icon-button"
      type="button"
      data-testid="open-encyclopedia"
      aria-label={translator.text("ui.topbar.openManual")}
      title={translator.text("ui.topbar.manual")}
      onClick={() => openManual("operations")}
    >
      <CircleHelp size={18} />
    </button>
  );
};
