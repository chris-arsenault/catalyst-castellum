import { DoorClosed, Droplets, Fan, Flame, FlaskConical, Waves, Wind } from "lucide-react";
import type { DeviceKind } from "../game/types";

interface DeviceGlyphProps {
  kind: DeviceKind;
  size?: number;
}

export const DeviceGlyph = ({ kind, size = 18 }: DeviceGlyphProps) => {
  if (kind === "gas_tank") return <FlaskConical size={size} aria-hidden="true" />;
  if (kind === "liquid_tank") return <Droplets size={size} aria-hidden="true" />;
  if (kind === "vent") return <Wind size={size} aria-hidden="true" />;
  if (kind === "drain") return <Waves size={size} aria-hidden="true" />;
  if (kind === "igniter") return <Flame size={size} aria-hidden="true" />;
  if (kind === "door") return <DoorClosed size={size} aria-hidden="true" />;
  if (kind === "boiler") return <FlaskConical size={size} aria-hidden="true" />;
  return <Fan size={size} aria-hidden="true" />;
};
