import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
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
import "./styles/manual.css";
import "./styles/tutorial.css";
import "./styles/responsive.css";

const root = document.getElementById("root");

if (!root) throw new Error("Missing application root.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
