import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { useGamePresentation } from "../application/presentationContext";
import type { ConduitRoomEffectCopy, RoomEffectTone } from "../presentation/roomEffect";

const ToneArrow = ({ tone }: { tone: RoomEffectTone }) => {
  if (tone === "increase") return <ArrowUp size={15} />;
  if (tone === "decrease") return <ArrowDown size={15} />;
  return <ArrowRight size={15} />;
};

export const ConduitRoomEffect = ({ effect }: { effect: ConduitRoomEffectCopy }) => {
  const { translator } = useGamePresentation();
  return (
    <section
      className="conduit-room-effect"
      data-testid={`conduit-room-effect-${effect.connectionId}`}
    >
      <header>{translator.text("ui.roomEffect.title")}</header>
      <ul>
        {effect.rooms.map((room) => (
          <li key={room.roomId} data-room-effect={room.tone}>
            <ToneArrow tone={room.tone} />
            <strong>{room.name}</strong>
            <span>{room.label}</span>
          </li>
        ))}
      </ul>
      <small>{effect.basisLabel}</small>
    </section>
  );
};
