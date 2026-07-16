import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { GamePresentationProvider } from "./application/GamePresentationProvider";
import { DEFAULT_GAME_PRESENTATION } from "./presentation/services";
import "./styles/base.css";
import "./styles/save-slots.css";
import "./styles/topbar.css";
import "./styles/workspace.css";
import "./styles/map-shell.css";
import "./styles/map-and-feedstock.css";
import "./styles/event-log.css";
import "./styles/inspector.css";
import "./styles/process-controls.css";
import "./styles/modals.css";
import "./styles/intermission.css";
import "./styles/manual.css";
import "./styles/tutorial.css";
import "./styles/responsive.css";

const root = document.getElementById("root");

if (!root) throw new Error("Missing application root.");

createRoot(root).render(
  <StrictMode>
    <GamePresentationProvider presentation={DEFAULT_GAME_PRESENTATION}>
      <App />
    </GamePresentationProvider>
  </StrictMode>
);
