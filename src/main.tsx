import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
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
import "./styles/logbook.css";
import "./styles/manual.css";
import "./styles/tutorial.css";
import "./styles/responsive.css";
import "./styles/towers.css";
import "./styles/exercise.css";

const App = lazy(() =>
  new URLSearchParams(window.location.search).get("fixture") === "harker-catalyst"
    ? import("./components/ExerciseApp")
    : import("./App")
);

const root = document.getElementById("root");

if (!root) throw new Error("Missing application root.");

createRoot(root).render(
  <StrictMode>
    <GamePresentationProvider presentation={DEFAULT_GAME_PRESENTATION}>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </GamePresentationProvider>
  </StrictMode>
);
