import { Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { setMuted, setMusicVolume, setSfxVolume, useAudioSettings } from "../audio";
import { useGamePresentation } from "../application/presentationContext";

export const AudioControls = () => {
  const { translator } = useGamePresentation();
  const settings = useAudioSettings();
  const [open, setOpen] = useState(false);
  const muteLabel = translator.text(
    settings.muted ? "ui.topbar.audio.unmute" : "ui.topbar.audio.mute"
  );
  return (
    <div className="audio-controls" data-testid="audio-controls">
      <button
        className="icon-button"
        type="button"
        aria-label={translator.text("ui.topbar.audio.settings")}
        title={translator.text("ui.topbar.audio.settings")}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {settings.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
      </button>
      {open && (
        <div
          className="audio-popover"
          role="group"
          aria-label={translator.text("ui.topbar.audio.settings")}
        >
          <label>
            <span>{translator.text("ui.topbar.audio.music")}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.musicVolume}
              aria-label={translator.text("ui.topbar.audio.musicVolume")}
              onChange={(event) => setMusicVolume(Number(event.target.value))}
            />
          </label>
          <label>
            <span>{translator.text("ui.topbar.audio.effects")}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sfxVolume}
              aria-label={translator.text("ui.topbar.audio.effectsVolume")}
              onChange={(event) => setSfxVolume(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            data-testid="audio-mute-toggle"
            onClick={() => setMuted(!settings.muted)}
          >
            {settings.muted ? <Volume2 size={14} /> : <VolumeX size={14} />} {muteLabel}
          </button>
        </div>
      )}
    </div>
  );
};
