/**
 * FarmVoice AI - Regional Voice Integration Utilities (STT & TTS).
 * Provides Web Audio API analysis, hybrid Speech-to-Text (Sarvam / Google / Browser),
 * and Text-to-Speech audio streaming with autoplay resilience, volume controls,
 * and real-time audio visualization data for 9 Indian languages.
 */

// BCP-47 Speech Recognition and Synthesis Locales
export const LANGUAGE_SPEECH_MAP = {
  kn: "kn-IN", // Kannada
  hi: "hi-IN", // Hindi
  te: "te-IN", // Telugu
  ta: "ta-IN", // Tamil
  ml: "ml-IN", // Malayalam
  mr: "mr-IN", // Marathi
  bn: "bn-IN", // Bengali
  pa: "pa-IN", // Punjabi
  en: "en-IN", // Indian English
};

/**
 * Remove markdown symbols and format text for natural, conversational speech.
 */
export function stripMarkdownForSpeech(text) {
  if (!text) return "";
  return text
    .replace(/^\s*#+\s*/gm, "") // Headings (including indented)
    .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
    .replace(/\*(.*?)\*/g, "$1") // Italics
    .replace(/_{1,2}(.*?)_{1,2}/g, "$1") // Underscores
    .replace(/`{1,3}[^`]*`{1,3}/g, "") // Inline/block code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links -> link text
    .replace(/^\s*[\*\-\+]\s+/gm, "") // Bullet points
    .replace(/^\s*\d+\.\s+/gm, "") // Numbered lists
    .replace(/---+/g, "") // Horizontal rules
    .replace(/>\s+/g, "") // Blockquotes
    .replace(/\n{2,}/g, ". ") // Newlines -> pause
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Shared Web Audio Context with autoplay unlocker.
 */
let sharedAudioCtx = null;

export function getSharedAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    try {
      sharedAudioCtx = new AudioCtx();
    } catch (e) {
      console.warn("Could not create AudioContext:", e);
    }
  }
  return sharedAudioCtx;
}

export async function unlockAudioContext() {
  const ctx = getSharedAudioContext();
  if (ctx && ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch (e) {
      console.warn("AudioContext resume failed:", e);
    }
  }
  return ctx;
}

/**
 * Convert base64 data to Blob URL for clean HTML5 Audio playback.
 */
export function base64ToAudioBlob(base64Data, mimeType = "audio/mpeg") {
  if (!base64Data) return null;
  try {
    const cleanB64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const byteCharacters = atob(cleanB64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (err) {
    console.error("Failed to convert base64 to audio Blob:", err);
    return null;
  }
}

/**
 * Audio Stream Recorder with Web Audio Analyser for live microphone level & dynamic waveforms.
 */
export class AudioStreamRecorder {
  constructor(onChunk, onComplete, onError) {
    this.onChunk = onChunk;
    this.onComplete = onComplete;
    this.onError = onError;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;

    // Web Audio Analyser for microphone visualization
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.dataArray = null;
  }

  async start() {
    this.audioChunks = [];
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone recording is not supported in this browser.");
      }

      await unlockAudioContext();
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up Audio Analyser for dynamic waveform
      const ctx = getSharedAudioContext();
      if (ctx) {
        this.audioCtx = ctx;
        if (this.audioCtx.state === "suspended") {
          await this.audioCtx.resume();
        }
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;
        this.source = this.audioCtx.createMediaStreamSource(this.stream);
        this.source.connect(this.analyser);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      }

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "audio/wav";

      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
          if (this.onChunk) this.onChunk(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        if (this.onComplete) this.onComplete(audioBlob);
        this.cleanup();
      };

      this.mediaRecorder.start(200); // 200ms slices
      this.isRecording = true;
      return true;
    } catch (err) {
      this.cleanup();
      if (this.onError) {
        let msg = "Microphone access denied. Please grant microphone permissions in your browser.";
        if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          msg = "No microphone hardware found on this device.";
        }
        this.onError(msg, err);
      }
      return false;
    }
  }

  /**
   * Get current microphone input amplitude (0.0 to 1.0) and frequency array for waveforms.
   */
  getAudioData() {
    if (!this.analyser || !this.isRecording) {
      return { level: 0, frequencies: [] };
    }
    if (!this.dataArray) {
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
    this.analyser.getByteFrequencyData(this.dataArray);

    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const avg = sum / (this.dataArray.length || 1);
    const level = Math.min(1.0, avg / 128.0);

    return {
      level,
      frequencies: Array.from(this.dataArray),
    };
  }

  stop() {
    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    this.isRecording = false;
  }

  cleanup() {
    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) {}
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.isRecording = false;
  }
}

/**
 * Speech-to-Text Manager with browser recognition.
 */
export class SpeechRecognitionManager {
  constructor(onResult, onError, onEnd, onStart) {
    this.onResult = onResult;
    this.onError = onError;
    this.onEnd = onEnd;
    this.onStart = onStart;
    this.recognition = null;
    this.isSupported = false;

    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;

        this.recognition.onstart = () => {
          if (this.onStart) this.onStart();
        };

        this.recognition.onresult = (event) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          const currentText = finalTranscript || interimTranscript;
          if (this.onResult) {
            this.onResult(currentText, Boolean(finalTranscript));
          }
        };

        this.recognition.onerror = (event) => {
          let message = "Speech recognition error occurred.";
          if (event.error === "not-allowed") {
            message = "Microphone access denied. Please allow microphone permissions in your browser.";
          } else if (event.error === "no-speech") {
            message = "No speech detected. Please speak clearly into your microphone.";
          } else if (event.error === "network") {
            message = "Network error during speech recognition. Please check your internet connection.";
          }
          if (this.onError) this.onError(message, event.error);
        };

        this.recognition.onend = () => {
          if (this.onEnd) this.onEnd();
        };
      }
    }
  }

  start(langCode = "kn") {
    if (!this.isSupported || !this.recognition) {
      if (this.onError) {
        this.onError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      }
      return false;
    }

    const locale = LANGUAGE_SPEECH_MAP[langCode] || "kn-IN";
    this.recognition.lang = locale;

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      try {
        this.recognition.stop();
      } catch (e) {}
      if (this.onError) this.onError("Could not initialize voice recording.");
      return false;
    }
  }

  stop() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }
}

/**
 * Hybrid Audio Player Controller
 * Plays server-generated audio streams (gTTS / Sarvam AI) with HTML5 Audio,
 * dynamic audio analysis, autoplay resilience, volume/speed controls,
 * and automatic fallback to browser SpeechSynthesis.
 */
export class HybridAudioPlayer {
  constructor(callbacks = {}) {
    this.onStart = callbacks.onStart;
    this.onEnd = callbacks.onEnd;
    this.onPause = callbacks.onPause;
    this.onResume = callbacks.onResume;
    this.onProgress = callbacks.onProgress;
    this.onError = callbacks.onError;
    this.onAutoplayBlocked = callbacks.onAutoplayBlocked;

    this.audioElement = typeof Audio !== "undefined" ? new Audio() : null;
    this.synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.activeMessageId = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.playbackRate = 1.0;
    this.volume = 1.0;
    this.isMuted = false;
    this.isUsingServerAudio = false;
    this.currentObjectUrl = null;

    // Web Audio Analyser for speaking animation
    this.audioCtx = null;
    this.analyser = null;
    this.sourceNode = null;
    this.dataArray = null;

    if (this.audioElement) {
      this.audioElement.preload = "auto";

      this.audioElement.onplay = () => {
        this.isPlaying = true;
        this.isPaused = false;
        if (this.onStart) this.onStart(this.activeMessageId);
      };

      this.audioElement.onpause = () => {
        if (!this.audioElement.ended) {
          this.isPlaying = false;
          this.isPaused = true;
          if (this.onPause) this.onPause(this.activeMessageId);
        }
      };

      this.audioElement.onended = () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.activeMessageId = null;
        this.revokeObjectUrl();
        if (this.onEnd) this.onEnd();
      };

      this.audioElement.ontimeupdate = () => {
        if (this.onProgress && this.audioElement.duration) {
          const current = this.audioElement.currentTime;
          const duration = this.audioElement.duration;
          const percent = duration > 0 ? (current / duration) * 100 : 0;
          this.onProgress(current, duration, percent);
        }
      };

      this.audioElement.onerror = (e) => {
        this.isPlaying = false;
        this.isPaused = false;
        console.warn("AudioElement error:", e);
        if (this.onError) this.onError("Audio playback error occurred.", e);
        if (this.onEnd) this.onEnd();
      };
    }
  }

  setVolume(vol = 1.0) {
    this.volume = Math.max(0.0, Math.min(1.0, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
    }
    if (this.currentUtterance) {
      this.currentUtterance.volume = this.isMuted ? 0 : this.volume;
    }
  }

  setMuted(muted = false) {
    this.isMuted = Boolean(muted);
    if (this.audioElement) {
      this.audioElement.muted = this.isMuted;
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
    }
  }

  setPlaybackRate(rate = 1.0) {
    this.playbackRate = rate;
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
    if (this.currentUtterance) {
      this.currentUtterance.rate = rate;
    }
  }

  revokeObjectUrl() {
    if (this.currentObjectUrl) {
      try {
        URL.revokeObjectURL(this.currentObjectUrl);
      } catch (e) {}
      this.currentObjectUrl = null;
    }
  }

  /**
   * Play audio response.
   * Prioritizes server-generated audio payload or URL; falls back to browser TTS.
   */
  async play(messageId, text, langCode = "kn", audioPayload = null) {
    this.stop();
    this.activeMessageId = messageId;
    await unlockAudioContext();

    // 1. Play Server Audio if provided
    if (audioPayload && (audioPayload.audio_base64 || audioPayload.audio_url) && this.audioElement) {
      this.isUsingServerAudio = true;
      try {
        let audioSrc = "";
        if (audioPayload.audio_base64) {
          const mime = audioPayload.mime_type || "audio/mpeg";
          const blob = base64ToAudioBlob(audioPayload.audio_base64, mime);
          if (blob) {
            this.currentObjectUrl = URL.createObjectURL(blob);
            audioSrc = this.currentObjectUrl;
          } else {
            audioSrc = `data:${mime};base64,${audioPayload.audio_base64}`;
          }
        } else if (audioPayload.audio_url) {
          audioSrc = audioPayload.audio_url;
        }

        this.audioElement.src = audioSrc;
        this.audioElement.playbackRate = this.playbackRate;
        this.audioElement.volume = this.isMuted ? 0 : this.volume;
        this.audioElement.muted = this.isMuted;

        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.isPlaying = true;
              this.isPaused = false;
            })
            .catch((err) => {
              console.warn("Autoplay was prevented or audio failed:", err);
              if (err.name === "NotAllowedError") {
                if (this.onAutoplayBlocked) {
                  this.onAutoplayBlocked(messageId, () => {
                    this.audioElement.play();
                  });
                }
              } else {
                // Try fallback to browser TTS
                this.playBrowserTTS(messageId, text, langCode);
              }
            });
        }
        return;
      } catch (err) {
        console.warn("Error playing server audio:", err);
      }
    }

    // 2. Fallback to Browser Speech Synthesis
    this.playBrowserTTS(messageId, text, langCode);
  }

  pause() {
    if (this.isUsingServerAudio && this.audioElement && this.isPlaying) {
      this.audioElement.pause();
      this.isPaused = true;
      this.isPlaying = false;
    } else if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.isPaused = true;
      this.isPlaying = false;
      if (this.onPause) this.onPause(this.activeMessageId);
    }
  }

  resume() {
    if (this.isUsingServerAudio && this.audioElement && this.isPaused) {
      this.audioElement
        .play()
        .then(() => {
          this.isPlaying = true;
          this.isPaused = false;
          if (this.onResume) this.onResume(this.activeMessageId);
        })
        .catch((err) => {
          console.warn("Resume failed:", err);
        });
    } else if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.isPlaying = true;
      this.isPaused = false;
      if (this.onResume) this.onResume(this.activeMessageId);
    }
  }

  stop() {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {}
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.activeMessageId = null;
    this.revokeObjectUrl();
  }

  /**
   * Get audio playback visualization amplitude (0.0 to 1.0) and waveform bar levels.
   */
  getPlaybackData() {
    if (!this.isPlaying) {
      return { level: 0, isActive: false };
    }
    // Calculate synthetic or real rhythmic amplitude based on currentTime
    if (this.audioElement && this.audioElement.duration > 0) {
      const t = this.audioElement.currentTime;
      // Organic speech envelope simulation
      const baseWave = Math.sin(t * 8) * 0.35 + Math.cos(t * 14) * 0.25 + 0.4;
      const level = Math.max(0.15, Math.min(1.0, baseWave * this.volume));
      return { level, isActive: true };
    }
    return { level: 0.5, isActive: true };
  }

  playBrowserTTS(messageId, text, langCode) {
    if (!this.synth) {
      if (this.onError) this.onError("Voice playback is not supported on this device.");
      return;
    }

    this.isUsingServerAudio = false;
    const cleanText = stripMarkdownForSpeech(text);
    if (!cleanText) return;

    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = this.synth.getVoices() || [];
    const locale = LANGUAGE_SPEECH_MAP[langCode] || "kn-IN";
    const langPrefix = langCode.toLowerCase();

    let matchedVoice =
      voices.find((v) => v.lang.toLowerCase() === locale.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(langPrefix)) ||
      (langPrefix === "en" ? voices.find((v) => v.lang.toLowerCase().includes("in")) : null) ||
      voices.find((v) => v.default) ||
      voices[0];

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      utterance.lang = locale;
    }

    utterance.rate = this.playbackRate * 0.95;
    utterance.volume = this.isMuted ? 0 : this.volume;
    utterance.pitch = 1.0;
    this.currentUtterance = utterance;

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      if (this.onStart) this.onStart(messageId);
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      this.activeMessageId = null;
      if (this.onEnd) this.onEnd();
    };

    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis error:", e);
      this.isPlaying = false;
      this.isPaused = false;
      if (this.onError) this.onError("Browser speech synthesis notice.", e);
      if (this.onEnd) this.onEnd();
    };

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.warn("Failed to invoke speech synthesis:", err);
      this.isPlaying = false;
      if (this.onEnd) this.onEnd();
    }
  }
}
