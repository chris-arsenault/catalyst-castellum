import type { GameState } from "../../game/types";
import {
  damageChannelStyle,
  damageSourceDisplay,
  damageSourceLabel,
  dominantDamageChannel,
  formatDamageAmount,
} from "../../presentation/damageCopy";
import { mapViewFor } from "./mapGeometry";

const VISIBLE_SECONDS = 1.35;

export const DamageNumberLayer = ({ game }: { game: GameState }) => (
  <>
    {game.incidents.flatMap((incident) => {
      const age = game.elapsed - incident.elapsed;
      if (
        age < 0 ||
        age > VISIBLE_SECONDS ||
        damageSourceDisplay[incident.sourceId] === "continuous"
      )
        return [];
      const progress = age / VISIBLE_SECONDS;
      return incident.targets.flatMap((target) => {
        const amount = Object.values(target.damageByChannel).reduce(
          (total, value) => total + value,
          0
        );
        if (amount < 0.05) return [];
        const channel = dominantDamageChannel(target.damageByChannel);
        const style = damageChannelStyle[channel];
        const position = mapViewFor(game.map).worldToMapPoint(target.worldPosition);
        return [
          <pixiContainer
            key={`${incident.id}-${target.enemyId}`}
            x={position.x}
            y={position.y - 34 - progress * 38}
            alpha={Math.max(0, 1 - progress)}
            eventMode="none"
          >
            <pixiText
              text={`−${formatDamageAmount(amount)} ${style.label}`}
              anchor={{ x: 0.5, y: 1 }}
              eventMode="none"
              style={{
                fontFamily: "IBM Plex Mono, ui-monospace, monospace",
                fontSize: 19,
                fontWeight: "900",
                fill: style.color,
                stroke: { color: "#07100d", width: 4 },
                dropShadow: { color: "#000000", alpha: 0.55, blur: 3, distance: 2 },
              }}
            />
            <pixiText
              text={damageSourceLabel[incident.sourceId].toUpperCase()}
              anchor={{ x: 0.5, y: 0 }}
              y={2}
              eventMode="none"
              style={{
                fontFamily: "IBM Plex Mono, ui-monospace, monospace",
                fontSize: 11,
                fontWeight: "700",
                fill: "#e8f0e9",
                stroke: { color: "#07100d", width: 3 },
              }}
            />
          </pixiContainer>,
        ];
      });
    })}
  </>
);
