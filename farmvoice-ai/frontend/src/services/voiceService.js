import api from "./api";

/**
 * FarmVoice AI - Frontend Voice Service.
 * Connects React components with backend /api/voice and /api/ai voice endpoints.
 */
export const voiceService = {
  /**
   * Transcribe recorded audio blob through backend STT.
   * @param {Blob|File} audioBlob - Audio recording blob.
   * @param {string} languageCode - Target language code (e.g. 'kn', 'hi', 'en', 'ta', 'mr', 'te').
   */
  async transcribe(audioBlob, languageCode = "kn") {
    const formData = new FormData();
    formData.append("file", audioBlob, "farmer_recording.wav");
    formData.append("language_code", languageCode);

    try {
      const response = await api.post("/api/voice/transcribe", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data?.data || response.data;
    } catch (err) {
      // Fallback to legacy endpoint if needed
      const fallbackRes = await api.post("/api/ai/stt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return fallbackRes.data;
    }
  },

  /**
   * Synthesize text to regional spoken audio.
   * @param {string} text - Advisory text to speak.
   * @param {string} language - Regional language code.
   * @param {string|null} speaker - Specific speaker voice if requested.
   */
  async speak(text, language = "kn", speaker = null) {
    try {
      const response = await api.post("/api/voice/speak", {
        text,
        language,
        speaker,
      });
      return response.data?.data || response.data;
    } catch (err) {
      // Fallback to legacy endpoint if needed
      const fallbackRes = await api.post("/api/ai/tts", {
        text,
        language,
        speaker,
      });
      return fallbackRes.data;
    }
  },

  /**
   * Translate text between languages.
   * @param {string} text - Source text.
   * @param {string} targetLang - Target language code.
   * @param {string|null} sourceLang - Optional source language code.
   */
  async translate(text, targetLang, sourceLang = null) {
    const response = await api.post("/api/voice/translate", {
      text,
      target_language: targetLang,
      source_language: sourceLang,
    });
    return response.data?.data || response.data;
  },

  /**
   * Get supported languages with speech codes and native names.
   */
  async getLanguages() {
    try {
      const response = await api.get("/api/voice/languages");
      return response.data?.data?.languages || response.data;
    } catch (err) {
      const fallbackRes = await api.get("/api/ai/languages");
      return fallbackRes.data?.languages || fallbackRes.data;
    }
  },
};

export default voiceService;
