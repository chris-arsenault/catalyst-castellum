import { enemyWorldPosition } from "../../game/queries";
import type { GameState } from "../../game/types";
import {
  damageChannelStyle,
  damageSourceLabel,
  dominantDamageChannel,
} from "../../presentation/damageCopy";
import { worldToMapPoint } from "./mapGeometry";

const VISIBLE_SECONDS = 1.35;

export const DamageNumberLayer = ({ game }: { game: GameState }) => (
  <>
    {game.enemies.flatMap((enemy) => {
      if (!enemy.lastDamage) return [];
      const age = game.elapsed - enemy.lastDamage.elapsed;
      if (age < 0 || age > VISIBLE_SECONDS || enemy.lastDamage.amount < 0.05) return [];
      const channel = dominantDamageChannel(enemy.lastDamage.channels);
      const style = damageChannelStyle[channel];
      const position = worldToMapPoint(enemyWorldPosition(enemy));
      const progress = age / VISIBLE_SECONDS;
      return [
        <pixiContainer
          key={`${enemy.id}-${enemy.lastDamage.elapsed}`}
          x={position.x}
          y={position.y - 34 - progress * 38}
          alpha={Math.max(0, 1 - progress)}
          eventMode="none"
        >
          <pixiText
            text={`−${Math.max(1, Math.round(enemy.lastDamage.amount))} ${style.label}`}
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
            text={damageSourceLabel[enemy.lastDamage.sourceId].toUpperCase()}
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
    })}
  </>
);
