/**
 * FarmVoice AI - Regional Voice Integration Utilities (STT & TTS).
 * Provides hybrid Speech-to-Text (Sarvam AI API + Browser SpeechRecognition)
 * and Text-to-Speech (Sarvam AI audio stream + Browser SpeechSynthesis)
 * with play, pause, resume, seek, and auto-play controls for 9 Indian languages.
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
    .replace(/^#+\s+/gm, "") // Headings
    .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
    .replace(/\*(.*?)\*/g, "$1") // Italics
    .replace(/_{1,2}(.*?)_{1,2}/g, "$1") // Underscores
    .replace(/`{1,3}[^`]*`{1,3}/g, "") // Inline/block code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links -> link text
    .replace(/^[\*\-\+]\s+/gm, "") // Bullet points
    .replace(/^\d+\.\s+/gm, "") // Numbered lists
    .replace(/---+/g, "") // Horizontal rules
    .replace(/>\s+/g, "") // Blockquotes
    .replace(/\n{2,}/g, ". ") // Newlines -> pause
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Audio Stream Recorder for microphone capture and audio Blob creation.
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
  }

  async start() {
    this.audioChunks = [];
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone recording is not supported in this browser.");
      }

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/ogg;codecs=opus";

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

      this.mediaRecorder.start(250); // Slice chunks every 250ms
      this.isRecording = true;
      return true;
    } catch (err) {
      this.cleanup();
      if (this.onError) {
        let msg = "Microphone access denied. Please grant microphone permissions.";
        if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          msg = "No microphone hardware found on this device.";
        }
        this.onError(msg, err);
      }
      return false;
    }
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

  start(langCode = "en") {
    if (!this.isSupported || !this.recognition) {
      if (this.onError) {
        this.onError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      }
      return false;
    }

    const locale = LANGUAGE_SPEECH_MAP[langCode] || "en-IN";
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
 * Plays Sarvam AI Audio Base64 WAV or falls back to Web SpeechSynthesis.
 */
export class HybridAudioPlayer {
  constructor(callbacks = {}) {
    this.onStart = callbacks.onStart;
    this.onEnd = callbacks.onEnd;
    this.onPause = callbacks.onPause;
    this.onResume = callbacks.onResume;
    this.onProgress = callbacks.onProgress;
    this.onError = callbacks.onError;

    this.audioElement = typeof Audio !== "undefined" ? new Audio() : null;
    this.synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.activeMessageId = null;
    this.isPlaying = false;
    this.playbackRate = 1.0;
    this.isUsingServerAudio = false;

    if (this.audioElement) {
      this.audioElement.onplay = () => {
        this.isPlaying = true;
        if (this.onStart) this.onStart(this.activeMessageId);
      };

      this.audioElement.onpause = () => {
        if (!this.audioElement.ended) {
          this.isPlaying = false;
          if (this.onPause) this.onPause(this.activeMessageId);
        }
      };

      this.audioElement.onended = () => {
        this.isPlaying = false;
        this.activeMessageId = null;
        if (this.onEnd) this.onEnd();
      };

      this.audioElement.ontimeupdate = () => {
        if (this.onProgress && this.audioElement.duration) {
          this.onProgress(
            this.audioElement.currentTime,
            this.audioElement.duration
          );
        }
      };

      this.audioElement.onerror = (e) => {
        this.isPlaying = false;
        if (this.onError) this.onError("Audio playback error.", e);
        if (this.onEnd) this.onEnd();
      };
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

  /**
   * Play audio response.
   * If audioPayload (base64) is provided from Sarvam AI, play via HTML5 Audio.
   * Otherwise, fallback to SpeechSynthesis.
   */
  play(messageId, text, langCode = "kn", audioPayload = null) {
    this.stop();
    this.activeMessageId = messageId;

    // 1. Check if server-generated audio is available
    if (audioPayload && audioPayload.audio_base64 && this.audioElement) {
      this.isUsingServerAudio = true;
      const mime = audioPayload.mime_type || "audio/wav";
      const audioSrc = `data:${mime};base64,${audioPayload.audio_base64}`;

      this.audioElement.src = audioSrc;
      this.audioElement.playbackRate = this.playbackRate;
      this.audioElement
        .play()
        .then(() => {
          this.isPlaying = true;
        })
        .catch((err) => {
          console.warn("Server audio playback failed, falling back to speech synthesis:", err);
          this.playBrowserTTS(messageId, text, langCode);
        });
      return;
    }

    // 2. Fallback to Browser Speech Synthesis
    this.playBrowserTTS(messageId, text, langCode);
  }

  playBrowserTTS(messageId, text, langCode) {
    if (!this.synth) {
      if (this.onError) this.onError("Voice playback is not supported on this device.");
      return;
    }

    this.isUsingServerAudio = false;
    const cleanText = stripMarkdownForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = this.synth.getVoices() || [];
    const locale = LANGUAGE_SPEECH_MAP[langCode] || "en-IN";
    const langPrefix = langCode.toLowerCase();

    let matchedVoice =
      voices.find((v) => v.lang.toLowerCase() === locale.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
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
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isPlaying = true;
      if (this.onStart) this.onStart(messageId);
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.activeMessageId = null;
      this.currentUtterance = null;
      if (this.onEnd) this.onEnd();
    };

    utterance.onerror = (e) => {
      this.isPlaying = false;
      this.activeMessageId = null;
      this.currentUtterance = null;
      if (this.onError) this.onError("Speech synthesis playback error.", e);
      if (this.onEnd) this.onEnd();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    this.isPlaying = true;
  }

  pause() {
    if (this.isUsingServerAudio && this.audioElement && this.isPlaying) {
      this.audioElement.pause();
      this.isPlaying = false;
      if (this.onPause) this.onPause(this.activeMessageId);
    } else if (this.synth && this.isPlaying) {
      this.synth.pause();
      this.isPlaying = false;
      if (this.onPause) this.onPause(this.activeMessageId);
    }
  }

  resume() {
    if (this.isUsingServerAudio && this.audioElement) {
      this.audioElement.play();
      this.isPlaying = true;
      if (this.onResume) this.onResume(this.activeMessageId);
    } else if (this.synth) {
      this.synth.resume();
      this.isPlaying = true;
      if (this.onResume) this.onResume(this.activeMessageId);
    }
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
    this.isPlaying = false;
    this.activeMessageId = null;
  }
}
