import { COMMAND_MESSAGES } from "./commands";
import { UI_MESSAGES } from "./ui";
import { LEVEL_MESSAGES } from "./levels";
import { ENTITY_MESSAGES } from "./entities";
import { EVENT_MESSAGES } from "./events";
import { MANUAL_MESSAGES } from "./manual";

export const EN_LOCALE = {
  locale: "en",
  messages: {
    ...UI_MESSAGES,
    ...COMMAND_MESSAGES,
    ...LEVEL_MESSAGES,
    ...ENTITY_MESSAGES,
    ...EVENT_MESSAGES,
    ...MANUAL_MESSAGES,
  },
} as const;
