import React, { useMemo } from "react";

/**
 * FarmVoice AI - Dynamic Audio Waveform Component.
 * Visualizes live audio input during listening and audio output during playback.
 * Connects to Web Audio API analyser levels with smooth fallback animations.
 */
export default function AudioWaveform({
  mode = "idle", // 'idle' | 'listening' | 'speaking' | 'processing'
  audioLevel = 0, // 0.0 to 1.0 amplitude
  barCount = 18,
  frequencies = [],
  className = "",
  style = {},
}) {
  // Generate responsive bars with symmetrical natural bell curve
  const bars = useMemo(() => {
    const list = [];
    const mid = barCount / 2;

    for (let i = 0; i < barCount; i++) {
      // Bell-shaped distribution factor (higher in middle, lower on ends)
      const distFromMid = Math.abs(i - mid) / mid;
      const bellCurve = Math.cos(distFromMid * (Math.PI / 2.3));

      let heightPercent = 12; // Base minimum height

      if (mode === "listening") {
        if (frequencies && frequencies.length > 0) {
          const freqIndex = Math.floor((i / barCount) * frequencies.length);
          const rawVal = frequencies[freqIndex] || 0;
          const normalized = rawVal / 255.0;
          heightPercent = Math.max(12, Math.min(100, (normalized * 85 + 15) * bellCurve));
        } else {
          // Dynamic level fallback
          const variation = Math.sin(i * 1.2 + Date.now() / 150) * 0.25 + 0.75;
          heightPercent = Math.max(12, Math.min(100, (audioLevel * 80 + 15) * bellCurve * variation));
        }
      } else if (mode === "speaking") {
        const timeFactor = (Date.now() / 180 + i * 0.45) % Math.PI;
        const wave = Math.sin(timeFactor) * 0.4 + 0.6;
        heightPercent = Math.max(16, Math.min(95, (audioLevel * 75 + 20) * bellCurve * wave));
      } else if (mode === "processing") {
        // Rotating wave during processing
        const phase = (Date.now() / 200 + i * 0.4) % (Math.PI * 2);
        heightPercent = Math.max(15, (Math.sin(phase) * 0.35 + 0.45) * 60 * bellCurve + 15);
      } else {
        // Idle gentle breathing
        heightPercent = Math.max(10, (Math.sin(i * 0.8) * 0.15 + 0.25) * 35 * bellCurve);
      }

      list.push({
        id: i,
        height: `${Math.round(heightPercent)}%`,
        delay: `${(i * 0.05).toFixed(2)}s`,
      });
    }

    return list;
  }, [mode, audioLevel, barCount, frequencies]);

  return (
    <div
      className={`ai-waveform-container ${mode} ${className}`}
      style={style}
      aria-label={`Audio waveform in ${mode} mode`}
    >
      {bars.map((bar) => (
        <span
          key={bar.id}
          className={`ai-waveform-bar ${mode}`}
          style={{
            height: bar.height,
            animationDelay: bar.delay,
          }}
        />
      ))}
    </div>
  );
}
