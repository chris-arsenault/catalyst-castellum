import { useOptionalEncounterSurface } from "../../application/encounterSurface";

export const ChargeMeter = ({ enemyId, facing }: { enemyId: number; facing: -1 | 1 }) => {
  const surface = useOptionalEncounterSurface();
  const mechanics = surface?.presentation.context.combat.mechanics;
  if (!surface || mechanics?.kind !== "catalyst") return null;
  const amount = surface.encounter.catalyst?.chargeByEnemy[String(enemyId)]?.amount ?? 0;
  if (amount <= 0) return null;
  const ratio = Math.min(1, amount / mechanics.rules.chargeCapacity);
  return (
    <pixiContainer scale={{ x: facing, y: 1 }} eventMode="none">
      <pixiGraphics
        draw={(g) => {
          g.clear().roundRect(-15, -35, 30, 5, 2).fill({ color: 0x101d2b, alpha: 0.9 });
          g.roundRect(-15, -35, Math.max(1, ratio * 30), 5, 2).fill({ color: 0x8dc9ff });
        }}
      />
      <pixiText
        text={`ϟ ${Math.round(amount)}`}
        anchor={0.5}
        y={-43}
        style={{
          fontFamily: "IBM Plex Mono",
          fontSize: 10,
          fill: "#a9d7ff",
          stroke: { color: "#081014", width: 2 },
        }}
      />
    </pixiContainer>
  );
};
