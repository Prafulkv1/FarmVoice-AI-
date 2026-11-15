/**
 * FarmVoice AI - Regional Voice Integration Utilities (STT & TTS).
 * Provides Speech-to-Text recognition and Text-to-Speech synthesis
 * for 9 Indian regional languages.
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
 * Remove markdown symbols and format text for natural audio reading.
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
 * Speech-to-Text Helper.
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
        this.onError("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      }
      return false;
    }

    const locale = LANGUAGE_SPEECH_MAP[langCode] || "en-IN";
    this.recognition.lang = locale;

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      // If already started or aborting
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
 * Text-to-Speech Helper.
 */
export class TextToSpeechManager {
  constructor(onStart, onEnd, onError) {
    this.onStart = onStart;
    this.onEnd = onEnd;
    this.onError = onError;
    this.synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.voices = [];

    if (this.synth) {
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices() || [];
  }

  getBestVoice(langCode) {
    const locale = LANGUAGE_SPEECH_MAP[langCode] || "en-IN";
    const langPrefix = langCode.toLowerCase();

    // 1. Try exact locale match (e.g., 'kn-IN')
    let match = this.voices.find(
      (v) => v.lang.toLowerCase() === locale.toLowerCase()
    );
    if (match) return match;

    // 2. Try prefix match (e.g., 'kn')
    match = this.voices.find((v) =>
      v.lang.toLowerCase().startsWith(langPrefix)
    );
    if (match) return match;

    // 3. Try Indian English if target was en
    if (langPrefix === "en") {
      match = this.voices.find((v) => v.lang.toLowerCase().includes("in"));
      if (match) return match;
    }

    // 4. Default voice
    return this.voices.find((v) => v.default) || this.voices[0] || null;
  }

  speak(text, langCode = "en", messageId = null) {
    if (!this.synth) {
      if (this.onError) this.onError("Text-to-Speech is not supported on this device.");
      return false;
    }

    // Stop any ongoing playback
    this.stop();

    const cleanText = stripMarkdownForSpeech(text);
    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voice = this.getBestVoice(langCode);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = LANGUAGE_SPEECH_MAP[langCode] || "en-IN";
    }

    utterance.rate = 0.95; // Slightly slower, clear pace for farmers
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      if (this.onStart) this.onStart(messageId);
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (this.onEnd) this.onEnd(messageId);
    };

    utterance.onerror = (event) => {
      this.currentUtterance = null;
      if (this.onError) {
        this.onError("Speech playback could not be completed.", event);
      }
      if (this.onEnd) this.onEnd(messageId);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    return true;
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking() {
    return Boolean(this.synth && this.synth.speaking);
  }
}
