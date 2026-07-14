import type { CommandDecision, CommandResult, CommandRejectionCode } from "../game/types";
import { DEFAULT_TRANSLATOR, type Translator } from "../localization/translator";
import type { LocaleKey } from "../localization/types";

const REJECTION_KEYS: Record<CommandRejectionCode, LocaleKey> = {
  already_complete: "commands.rejection.already_complete",
  already_installed: "commands.rejection.already_installed",
  capacity: "commands.rejection.capacity",
  empty_socket: "commands.rejection.empty_socket",
  insufficient_matter: "commands.rejection.insufficient_matter",
  invalid_phase: "commands.rejection.invalid_phase",
  not_installed: "commands.rejection.not_installed",
  occupied_socket: "commands.rejection.occupied_socket",
  placement: "commands.rejection.placement",
  route_unavailable: "commands.rejection.route_unavailable",
  unavailable: "commands.rejection.unavailable",
  unique_equipment: "commands.rejection.unique_equipment",
};

type RejectionSource =
  | Pick<CommandDecision, "code" | "cost">
  | (Pick<CommandResult, "code"> & {
      parameters: CommandResult["parameters"];
    });

export const createCommandCopy =
  (translator: Translator) =>
  (source: RejectionSource): string | null => {
    if (!source.code) return null;
    if (source.code === "insufficient_matter") {
      const cost = "cost" in source ? source.cost : (source.parameters.cost ?? 0);
      return translator.text("commands.rejection.insufficient_matter", { cost });
    }
    return translator.text(REJECTION_KEYS[source.code]);
  };

export const commandRejectionCopy = createCommandCopy(DEFAULT_TRANSLATOR);
