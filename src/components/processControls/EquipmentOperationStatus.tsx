import { Activity, Gauge } from "lucide-react";
import { useGamePresentation } from "../../application/presentationContext";
import { useGameStore } from "../../application/store";
import {
  GAS_TYPES,
  LIQUID_TYPES,
  type EquipmentOutputDefinition,
  type EquipmentOutputState,
  type EquipmentReactionOperationDefinition,
  type EquipmentSocketId,
  type StationaryType,
  type GasAmounts,
  type LiquidAmounts,
  type RoomId,
} from "../../game/types";
import { gasAmountTotal, liquidAmountTotal } from "../../game/queries";
import { roomState } from "../../game/world/instances";
import type { LocaleFormatters } from "../../localization/formatters";
import type { Translator } from "../../localization/translator";
import { EQUIPMENT_DEFINITIONS, SPECIES_DEFINITIONS } from "../../presentation/defaultGame";
import { dutyReactionSummaries } from "../../presentation/dutyCopy";
import { equipmentCopy, equipmentOutputCopy, speciesCopy } from "../../presentation/entityCopy";
import { TUTORIAL_ANCHORS } from "../../tutorial/anchors";

const gasSummary = (
  gas: GasAmounts,
  translator: Translator,
  formatters: LocaleFormatters
): string => {
  const total = gasAmountTotal(gas);
  if (total < 0.05) return translator.text("ui.process.empty");
  const dominant = GAS_TYPES.reduce((best, type) => (gas[type] > gas[best] ? type : best));
  return `${speciesCopy(SPECIES_DEFINITIONS[dominant], translator).name} ${formatters.percent(
    gas[dominant] / total,
    0
  )}`;
};

const liquidSummary = (
  liquid: LiquidAmounts,
  translator: Translator,
  formatters: LocaleFormatters
): string => {
  const total = liquidAmountTotal(liquid);
  if (total < 0.05) return translator.text("ui.process.empty");
  const dominant = LIQUID_TYPES.reduce((best, type) => (liquid[type] > liquid[best] ? type : best));
  return `${speciesCopy(SPECIES_DEFINITIONS[dominant], translator).name} ${formatters.percent(
    liquid[dominant] / total,
    0
  )}`;
};

const outputReading = (
  definition: EquipmentOutputDefinition,
  state: EquipmentOutputState,
  translator: Translator,
  formatters: LocaleFormatters
) => {
  const amount =
    state.phase === "gas" ? gasAmountTotal(state.gas) : liquidAmountTotal(state.liquid);
  const intendedAmount =
    state.phase === "gas"
      ? state.gas[definition.speciesId as keyof GasAmounts]
      : state.liquid[definition.speciesId as keyof LiquidAmounts];
  return {
    amount,
    composition:
      state.phase === "gas"
        ? gasSummary(state.gas, translator, formatters)
        : liquidSummary(state.liquid, translator, formatters),
    contaminated: amount - intendedAmount > 0.01,
  };
};

const activeDuty = (
  operation: EquipmentReactionOperationDefinition,
  medium: StationaryType | null
) => operation.duties.find((candidate) => candidate.medium === medium) ?? operation.duties[0];

export const EquipmentOperationStatus = ({
  roomId,
  socketId,
}: {
  roomId: RoomId;
  socketId: EquipmentSocketId;
}) => {
  const { formatters, limitingFactorCopy, translator } = useGamePresentation();
  const game = useGameStore((state) => state.game);
  const instance = roomState(game, roomId).equipment[socketId];
  if (!instance?.operation) return null;
  const equipment = EQUIPMENT_DEFINITIONS[instance.equipmentId];
  const operation = equipment.operation;
  if (!operation) return null;
  const outputs = operation.outputs.flatMap((definition) => {
    const state = instance.operation?.outputs[definition.id];
    return state
      ? [{ definition, state, ...outputReading(definition, state, translator, formatters) }]
      : [];
  });
  const tutorialAnchor =
    instance.equipmentId === "membrane_cell" ? TUTORIAL_ANCHORS.lowerIntakeOutlets : undefined;
  const duty = activeDuty(operation, instance.medium);
  const summaries = duty ? dutyReactionSummaries(duty, translator) : [];
  return (
    <div
      className={`outlet-buffer-panel ${outputs.length === 0 ? "local-process-panel" : ""}`}
      data-tutorial-anchor={tutorialAnchor}
    >
      <div className="control-kind-heading">
        {outputs.length > 0 ? <Gauge size={14} /> : <Activity size={14} />}
        {equipmentCopy(equipment, translator).name}
      </div>
      {outputs.length > 0 && (
        <div className="outlet-buffer-grid">
          {outputs.map(({ amount, composition, contaminated, definition }) => (
            <div className={contaminated ? "contaminated" : ""} key={definition.id}>
              <span>{equipmentOutputCopy(definition, translator).name}</span>
              <strong>
                {formatters.number(amount, 1)} / {formatters.number(definition.capacity, 1)}
              </strong>
              <small>
                {contaminated ? translator.text("ui.process.contaminated") : composition}
              </small>
            </div>
          ))}
        </div>
      )}
      <div className="equipment-duty-list">
        {summaries.map((summary) => (
          <div className="equipment-duty-row" key={summary.reactionId}>
            <span>{summary.name}</span>
            <strong>{summary.equation}</strong>
            <small>{summary.effect}</small>
          </div>
        ))}
      </div>
      <div className="equipment-process-readout">
        <strong>{formatters.measurement(instance.operation.lastRate, "mol-eq/s", 2)}</strong>
        <small>
          {translator.text("ui.process.limiting", {
            power: formatters.number(instance.operation.powerDraw, 0),
            factor: limitingFactorCopy(instance.operation.limitingFactor),
          })}
        </small>
      </div>
    </div>
  );
};
