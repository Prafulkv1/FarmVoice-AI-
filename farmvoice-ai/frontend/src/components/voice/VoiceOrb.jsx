import React from "react";
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  AlertCircle,
} from "lucide-react";
import AudioWaveform from "./AudioWaveform";
import "./VoiceOrb.css";

/**
 * FarmVoice AI - Glowing Voice Orb (Design A).
 * Interactive circular voice interface reacting to actual application states:
 * - Idle: Breathing green glow, tap to speak
 * - Listening: Expanding pulsating glow, dynamic waveform, timer, stop action
 * - Processing: Rotating luminous aura ring, AI grounding status
 * - Speaking: Rhythmic speaking glow, audio playback progress, pause/stop controls
 * - Completed: Calm resting glow, replay controls
 * - Error: Friendly notification with one-tap recovery
 */
export default function VoiceOrb({
  state = "idle", // 'idle' | 'listening' | 'processing' | 'speaking' | 'completed' | 'error'
  onOrbClick,
  onStop,
  onReplay,
  onPauseResume,
  isPaused = false,
  recordingDuration = 0,
  audioLevel = 0,
  frequencies = [],
  audioProgress = 0,
  transcript = "",
  activeLanguage = {},
  activeDialect = {},
  errorMessage = null,
  onClearError,
  onTapToPlay, // Autoplay recovery
}) {
  // Format recording seconds to MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remSecs).padStart(2, "0")}`;
  };

  const handleOrbPress = (e) => {
    e.preventDefault();
    if (state === "error" && onTapToPlay) {
      onTapToPlay();
    } else if (onOrbClick) {
      onOrbClick();
    }
  };

  return (
    <div className={`ai-voice-orb-wrapper state-${state}`}>
      {/* Dynamic Background Aura Glow */}
      <div className={`ai-orb-ambient-glow state-${state}`} />

      {/* Main Orb Center Container */}
      <div className="ai-orb-center-stage">
        {/* Multi-layered Pulsing Glow Rings */}
        <div className={`ai-orb-ring ring-outer state-${state}`} />
        <div className={`ai-orb-ring ring-middle state-${state}`} />
        <div className={`ai-orb-ring ring-inner state-${state}`} />

        {/* The Interactive Circular Glowing Orb Button */}
        <button
          type="button"
          className={`ai-glowing-orb-btn state-${state}`}
          onClick={handleOrbPress}
          aria-label={
            state === "listening"
              ? "Stop listening"
              : state === "speaking"
              ? isPaused
                ? "Resume speech"
                : "Pause speech"
              : "Tap to speak"
          }
          title={
            state === "listening"
              ? "Tap to finish speaking"
              : state === "speaking"
              ? "Tap to pause speech"
              : `Tap to speak in ${activeLanguage.native_name || activeLanguage.name || "regional language"}`
          }
        >
          {/* Internal Radial Gradient Overlay */}
          <div className="ai-orb-core-gradient" />

          {/* State-specific Orb Icon or Visualizer */}
          <div className="ai-orb-icon-content">
            {state === "idle" && (
              <div className="ai-orb-idle-icon">
                <Mic size={38} className="ai-orb-mic-icon" />
              </div>
            )}

            {state === "listening" && (
              <div className="ai-orb-listening-visual">
                <AudioWaveform
                  mode="listening"
                  audioLevel={audioLevel}
                  frequencies={frequencies}
                  barCount={14}
                  className="ai-orb-mini-waveform"
                />
                <span className="ai-orb-timer-pill">{formatTime(recordingDuration)}</span>
              </div>
            )}

            {state === "processing" && (
              <div className="ai-orb-processing-spinner">
                <div className="ai-orb-spinner-track" />
                <Sparkles size={28} className="ai-orb-sparkle-center" />
              </div>
            )}

            {state === "speaking" && (
              <div className="ai-orb-speaking-visual">
                {isPaused ? (
                  <Play size={36} className="ai-orb-play-icon" />
                ) : (
                  <AudioWaveform
                    mode="speaking"
                    audioLevel={audioLevel || 0.6}
                    barCount={14}
                    className="ai-orb-mini-waveform"
                  />
                )}
              </div>
            )}

            {state === "completed" && (
              <div className="ai-orb-completed-icon">
                <RotateCcw size={32} className="ai-orb-replay-icon" />
              </div>
            )}

            {state === "error" && (
              <div className="ai-orb-error-icon">
                <AlertCircle size={36} style={{ color: "#E53935" }} />
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Dynamic Status Text and Dialect Badges */}
      <div className="ai-orb-caption-area">
        {state === "idle" && (
          <div className="ai-orb-caption-box">
            <h3 className="ai-orb-status-title">Tap Orb to Speak</h3>
            <p className="ai-orb-status-desc">
              Speak naturally in {activeLanguage.native_name || "your language"} (
              {activeDialect.native_name || activeDialect.name || "Standard"}). AI will answer aloud.
            </p>
          </div>
        )}

        {state === "listening" && (
          <div className="ai-orb-caption-box">
            <div className="ai-orb-status-badge listening">
              <span className="ai-pulse-dot" />
              Listening to your question...
            </div>
            {transcript ? (
              <div className="ai-orb-live-transcript">
                "{transcript}"
              </div>
            ) : (
              <p className="ai-orb-status-desc">
                Speak clearly into your microphone...
              </p>
            )}
            <div className="ai-orb-quick-controls">
              <button
                type="button"
                className="ai-orb-stop-btn"
                onClick={onStop || onOrbClick}
                title="Finish recording"
              >
                <Square size={14} />
                <span>Done Speaking</span>
              </button>
            </div>
          </div>
        )}

        {state === "processing" && (
          <div className="ai-orb-caption-box">
            <h3 className="ai-orb-status-title">Understanding your question...</h3>
            <p className="ai-orb-status-desc">
              Grounding agronomic guidance with your crops, soil, weather &amp; dialect rules...
            </p>
          </div>
        )}

        {state === "speaking" && (
          <div className="ai-orb-caption-box">
            <div className="ai-orb-status-badge speaking">
              <Volume2 size={14} />
              FarmVoice AI is speaking in {activeLanguage.native_name || "your language"}
            </div>
            {/* Extended Audio Waveform underneath Orb */}
            <div className="ai-orb-speaking-waveform-wrap">
              <AudioWaveform
                mode="speaking"
                audioLevel={audioLevel || 0.65}
                barCount={22}
                className="ai-orb-full-waveform"
              />
            </div>
            {/* Quick Audio Playback Controls */}
            <div className="ai-orb-quick-controls">
              <button
                type="button"
                className="ai-orb-action-pill"
                onClick={onPauseResume}
                title={isPaused ? "Resume Audio" : "Pause Audio"}
              >
                {isPaused ? <Play size={15} /> : <Pause size={15} />}
                <span>{isPaused ? "Resume" : "Pause"}</span>
              </button>

              <button
                type="button"
                className="ai-orb-action-pill"
                onClick={onReplay}
                title="Replay from start"
              >
                <RotateCcw size={15} />
                <span>Replay</span>
              </button>

              <button
                type="button"
                className="ai-orb-action-pill danger"
                onClick={onStop}
                title="Stop Audio"
              >
                <Square size={14} />
                <span>Stop</span>
              </button>
            </div>
          </div>
        )}

        {state === "completed" && (
          <div className="ai-orb-caption-box">
            <div className="ai-orb-status-badge completed">
              Response completed.
            </div>
            <p className="ai-orb-status-desc">
              Read the answer below, replay the voice, or tap the Orb to ask your next question.
            </p>
            <div className="ai-orb-quick-controls">
              <button
                type="button"
                className="ai-orb-action-pill"
                onClick={onReplay}
                title="Replay Voice Response"
              >
                <RotateCcw size={15} />
                <span>Replay Voice</span>
              </button>
              <button
                type="button"
                className="ai-orb-action-pill primary"
                onClick={handleOrbPress}
                title="Ask another question"
              >
                <Mic size={15} />
                <span>Ask Next Question</span>
              </button>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="ai-orb-caption-box error">
            <div className="ai-orb-status-badge error">
              <AlertCircle size={14} />
              {errorMessage || "Audio playback blocked or unavailable."}
            </div>
            {onTapToPlay && (
              <div className="ai-orb-quick-controls">
                <button
                  type="button"
                  className="ai-orb-action-pill primary"
                  onClick={onTapToPlay}
                >
                  <Play size={15} />
                  <span>Tap to Play Response</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
