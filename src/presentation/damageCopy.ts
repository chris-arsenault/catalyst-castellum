import { DAMAGE_SOURCE_IDS, type DamageSourceId, type HazardChannels } from "../game/types";
import { DEFAULT_TRANSLATOR, type Translator } from "../localization/translator";
import type { LocaleKey } from "../localization/types";

export type DamageChannel = keyof HazardChannels;

export const DAMAGE_CHANNELS: readonly DamageChannel[] = [
  "atmosphere",
  "corrosion",
  "heat",
  "pressure",
  "radiation",
];

const localized = (translator: Translator, key: string): string =>
  translator.text(key as LocaleKey);

export const createDamageCopy = (translator: Translator) => ({
  channelStyle: Object.fromEntries(
    DAMAGE_CHANNELS.map((channel) => [
      channel,
      {
        color: {
          atmosphere: "#72d5e1",
          corrosion: "#9df06c",
          heat: "#ff755c",
          pressure: "#ffb14d",
          radiation: "#d69cff",
        }[channel],
        label: localized(translator, `damage.channel.${channel}.label`),
      },
    ])
  ) as Record<DamageChannel, { color: string; label: string }>,
  channelDetail: Object.fromEntries(
    DAMAGE_CHANNELS.map((channel) => [
      channel,
      localized(translator, `damage.channel.${channel}.detail`),
    ])
  ) as Record<DamageChannel, string>,
  sourceLabel: Object.fromEntries(
    DAMAGE_SOURCE_IDS.map((source) => [
      source,
      localized(translator, `damage.source.${source}.label`),
    ])
  ) as Record<DamageSourceId, string>,
  sourceDetail: Object.fromEntries(
    DAMAGE_SOURCE_IDS.map((source) => [
      source,
      localized(translator, `damage.source.${source}.detail`),
    ])
  ) as Record<DamageSourceId, string>,
});

const DEFAULT_DAMAGE_COPY = createDamageCopy(DEFAULT_TRANSLATOR);
export const damageChannelStyle = DEFAULT_DAMAGE_COPY.channelStyle;
export const damageChannelDetail = DEFAULT_DAMAGE_COPY.channelDetail;
export const damageSourceLabel = DEFAULT_DAMAGE_COPY.sourceLabel;
export const damageSourceDetail = DEFAULT_DAMAGE_COPY.sourceDetail;

export const damageSourceDisplay: Record<DamageSourceId, "continuous" | "impact"> = {
  asphyxiation: "continuous",
  carbon_monoxide: "continuous",
  chlorine_gas: "continuous",
  hydrogen_chloride_gas: "continuous",
  liquid_corrosion: "continuous",
  nitrogen_chemistry: "continuous",
  nickel_carbonyl: "continuous",
  hydrogen_fluoride: "continuous",
  fluorine: "continuous",
  uranium_chemistry: "continuous",
  thermal_exposure: "continuous",
  catastrophic_overpressure: "continuous",
  hydrogen_oxygen_combustion: "impact",
};

export const formatDamageAmount = (amount: number): string => {
  if (amount >= 10) return Math.round(amount).toString();
  if (amount >= 1) return amount.toFixed(1).replace(/\.0$/, "");
  const fixed = amount.toFixed(2);
  if (fixed.endsWith("00")) return fixed.slice(0, -3);
  if (fixed.endsWith("0")) return fixed.slice(0, -1);
  return fixed;
};

export const dominantDamageChannel = (channels: HazardChannels): DamageChannel =>
  DAMAGE_CHANNELS.reduce(
    (best, channel) => (channels[channel] > channels[best] ? channel : best),
    "atmosphere"
  );
