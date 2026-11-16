import React, { useState } from "react";
import {
  Volume2,
  VolumeX,
  Volume1,
  Sliders,
  X,
  Check,
  Radio,
  Sparkles,
} from "lucide-react";

/**
 * FarmVoice AI - Voice Controls & Audio Settings Panel.
 * Provides volume slider, mute toggle, playback speed, and auto-play settings.
 */
export default function VoiceControls({
  volume = 1.0,
  isMuted = false,
  playbackSpeed = 1.0,
  autoPlay = true,
  onVolumeChange,
  onMuteToggle,
  onSpeedChange,
  onAutoPlayToggle,
  className = "",
}) {
  const [showSettings, setShowSettings] = useState(false);

  const speedOptions = [0.8, 1.0, 1.2, 1.5];

  return (
    <div className={`ai-voice-controls-panel ${className}`}>
      <div className="ai-voice-controls-bar">
        {/* Mute / Unmute Button */}
        <button
          type="button"
          className="ai-ctrl-icon-btn"
          onClick={onMuteToggle}
          title={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? (
            <VolumeX size={17} style={{ color: "#E53935" }} />
          ) : volume > 0.5 ? (
            <Volume2 size={17} />
          ) : (
            <Volume1 size={17} />
          )}
        </button>

        {/* Inline Volume Slider */}
        <div className="ai-ctrl-volume-slider-wrap">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="ai-ctrl-volume-slider"
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
          <span className="ai-ctrl-volume-label">
            {isMuted ? "Muted" : `${Math.round(volume * 100)}%`}
          </span>
        </div>

        {/* Speed Toggle Pill */}
        <button
          type="button"
          className="ai-ctrl-pill-btn"
          onClick={() => {
            const nextIdx = (speedOptions.indexOf(playbackSpeed) + 1) % speedOptions.length;
            onSpeedChange(speedOptions[nextIdx]);
          }}
          title="Change playback speed"
        >
          {playbackSpeed}x
        </button>

        {/* Settings Dialog Toggle */}
        <button
          type="button"
          className={`ai-ctrl-icon-btn ${showSettings ? "active" : ""}`}
          onClick={() => setShowSettings(!showSettings)}
          title="Voice response settings"
        >
          <Sliders size={16} />
        </button>
      </div>

      {/* Expandable Voice Settings Card */}
      {showSettings && (
        <div className="ai-voice-settings-dropdown">
          <div className="ai-settings-dropdown-header">
            <span>Voice &amp; Audio Settings</span>
            <button
              type="button"
              className="ai-settings-close-btn"
              onClick={() => setShowSettings(false)}
            >
              <X size={14} />
            </button>
          </div>

          <div className="ai-settings-row">
            <div className="ai-settings-label-wrap">
              <span className="ai-settings-label">Automatic Voice Response</span>
              <span className="ai-settings-sublabel">
                Automatically speak answers aloud when generated
              </span>
            </div>
            <label className="ai-toggle-switch">
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => onAutoPlayToggle(e.target.checked)}
              />
              <span className="ai-toggle-slider" />
            </label>
          </div>

          <div className="ai-settings-row">
            <div className="ai-settings-label-wrap">
              <span className="ai-settings-label">Voice Speed</span>
              <span className="ai-settings-sublabel">Pace of regional spoken guidance</span>
            </div>
            <div className="ai-speed-btn-group">
              {speedOptions.map((spd) => (
                <button
                  key={spd}
                  type="button"
                  className={`ai-speed-opt-btn ${playbackSpeed === spd ? "active" : ""}`}
                  onClick={() => onSpeedChange(spd)}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
