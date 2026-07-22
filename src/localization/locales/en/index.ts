import { COMMAND_MESSAGES } from "./commands";
import { UI_MESSAGES } from "./ui";
import { LEVEL_MESSAGES } from "./levels";
import { ENTITY_MESSAGES } from "./entities";
import { EVENT_MESSAGES } from "./events";
import { MANUAL_MESSAGES } from "./manual";
import { PRESENTATION_MESSAGES } from "./presentation";
import { DAMAGE_MESSAGES } from "./damage";
import { TUTORIAL_MESSAGES } from "./tutorials";
import { NARRATIVE_MESSAGES } from "./narrative";
import { DEBUG_MESSAGES } from "./debug";
import { PROCESS_FEEDBACK_MESSAGES } from "./processFeedback";
import { LOGBOOK_MESSAGES } from "./logbook";

export const EN_LOCALE = {
  locale: "en",
  messages: {
    ...UI_MESSAGES,
    ...COMMAND_MESSAGES,
    ...LEVEL_MESSAGES,
    ...ENTITY_MESSAGES,
    ...EVENT_MESSAGES,
    ...MANUAL_MESSAGES,
    ...PRESENTATION_MESSAGES,
    ...DAMAGE_MESSAGES,
    ...TUTORIAL_MESSAGES,
    ...NARRATIVE_MESSAGES,
    ...DEBUG_MESSAGES,
    ...PROCESS_FEEDBACK_MESSAGES,
    ...LOGBOOK_MESSAGES,
  },
} as const;
