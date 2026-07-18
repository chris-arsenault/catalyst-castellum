import type { EnemyAppearanceArchetype } from "../../game/types";
import { enemySpriteUrl } from "../gameMap/enemySprites";

export const EnemyGlyph = ({
  appearance,
  size,
}: {
  appearance: EnemyAppearanceArchetype;
  size: 24 | 58;
}) => (
  <span aria-hidden="true" className="enemy-sprite-glyph" data-size={size}>
    <img src={enemySpriteUrl(appearance)} alt="" draggable={false} />
  </span>
);
