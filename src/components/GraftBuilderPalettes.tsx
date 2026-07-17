import {
  Blocks,
  DoorClosed,
  DoorOpen,
  Eraser,
  Link2,
  Rows3,
  Trash2,
  Waypoints,
} from "lucide-react";
import { useMemo } from "react";

import { useGamePresentation } from "../application/presentationContext";
import { useGameStore } from "../application/store";
import type { FacilityPortalState } from "../game/types";
import { hullPlanningMap } from "../game/world/hullFragment";
import { architecturalConnections, type ArchitecturalConnection } from "../game/world/map";
import type { HullBuildTool } from "./HullBuilderCanvas";

const TOOLS = [
  { id: "select" as const, icon: Blocks, label: "ui.graft.tool.rooms" as const },
  { id: "connection" as const, icon: Link2, label: "ui.graft.tool.connection" as const },
  { id: "platform" as const, icon: Rows3, label: "ui.graft.tool.platform" as const },
  { id: "ladder" as const, icon: Waypoints, label: "ui.graft.tool.ladder" as const },
  { id: "erase" as const, icon: Eraser, label: "ui.graft.tool.erase" as const },
];

const toolHint = (tool: HullBuildTool) => {
  if (tool === "connection") return "ui.graft.tool.connectionHint" as const;
  if (tool === "select") return "ui.graft.tool.roomHint" as const;
  return "ui.graft.tool.strokeHint" as const;
};

export const GraftToolPalette = ({
  tool,
  onTool,
}: {
  tool: HullBuildTool;
  onTool: (tool: HullBuildTool) => void;
}) => {
  const { translator } = useGamePresentation();
  return (
    <section className="graft-tool-palette">
      <strong>{translator.text("ui.graft.tool.title")}</strong>
      <div>
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            className={tool === id ? "active" : ""}
            aria-pressed={tool === id}
            data-testid={`graft-tool-${id}`}
            onClick={() => onTool(id)}
          >
            <Icon size={15} /> {translator.text(label)}
          </button>
        ))}
      </div>
      <small>{translator.text(toolHint(tool))}</small>
    </section>
  );
};

const HorizontalPortalControls = ({
  portal,
  state,
}: {
  portal: ArchitecturalConnection;
  state: FacilityPortalState;
}) => {
  const { translator } = useGamePresentation();
  const dispatch = useGameStore((store) => store.dispatch);
  const configure = (kind: "passage" | "door", open: boolean): void => {
    dispatch({ type: "configure_hull_portal", connectionId: portal.id, kind, open });
  };
  return (
    <>
      <button
        type="button"
        className={portal.kind === "passage" ? "active" : ""}
        onClick={() => configure("passage", true)}
      >
        <Waypoints size={13} /> {translator.text("ui.graft.portal.passage")}
      </button>
      <button
        type="button"
        className={portal.kind === "door" && state?.open ? "active" : ""}
        onClick={() => configure("door", true)}
      >
        <DoorOpen size={13} /> {translator.text("ui.graft.portal.openDoor")}
      </button>
      <button
        type="button"
        className={portal.kind === "door" && !state?.open ? "active" : ""}
        onClick={() => configure("door", false)}
      >
        <DoorClosed size={13} /> {translator.text("ui.graft.portal.closedDoor")}
      </button>
    </>
  );
};

const PortalControls = ({
  portal,
  state,
}: {
  portal: ArchitecturalConnection;
  state: FacilityPortalState;
}) => {
  const { translator } = useGamePresentation();
  const dispatch = useGameStore((store) => store.dispatch);
  return (
    <div>
      {portal.orientation === "vertical" ? (
        <span className="graft-portal-kind">
          <Waypoints size={13} /> {translator.text("ui.graft.portal.ladder")}
        </span>
      ) : (
        <HorizontalPortalControls portal={portal} state={state} />
      )}
      {portal.id.startsWith("joint:bridge:") && (
        <button
          type="button"
          onClick={() => dispatch({ type: "remove_hull_connection", connectionId: portal.id })}
        >
          <Trash2 size={13} /> {translator.text("ui.graft.portal.remove")}
        </button>
      )}
    </div>
  );
};

export const GraftPortalPalette = () => {
  const { translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const map = useMemo(() => hullPlanningMap(game.map), [game.map]);
  const portals = architecturalConnections(map).filter(
    (portal) => portal.id.startsWith("joint:") && portal.kind !== "core_door"
  );
  if (portals.length === 0) return null;
  return (
    <section className="graft-portal-palette">
      <strong>{translator.text("ui.graft.portal.title")}</strong>
      {portals.map((portal) => (
        <article key={portal.id}>
          <span>
            {map.rooms[portal.rooms[0]]?.code} → {map.rooms[portal.rooms[1]]?.code}
          </span>
          <PortalControls
            portal={portal}
            state={
              game.portalStates[portal.id] ?? {
                open: portal.defaultOpen,
                sealed: portal.defaultSealed,
                lastGasFlow: 0,
                lastLiquidFlow: 0,
              }
            }
          />
        </article>
      ))}
    </section>
  );
};
