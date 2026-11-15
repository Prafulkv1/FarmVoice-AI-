import api from "./api";

/**
 * FarmVoice AI - Frontend AI Assistant Service.
 * Connects the React client with backend /api/ai endpoints.
 */
export const aiService = {
  /**
   * Send question and receive context-grounded, dialect-adapted AI guidance.
   * @param {string} message - Farmer's question text.
   * @param {number|null} conversationId - Existing conversation ID (or null to start new).
   * @param {string|null} language - Language code ('kn', 'hi', 'en', 'auto', etc.).
   * @param {string|null} dialect - Dialect code ('north_karnataka', 'standard', etc.).
   * @param {boolean|null} voiceMode - Whether voice synthesis is requested.
   */
  async sendMessage(
    message,
    conversationId = null,
    language = null,
    dialect = null,
    voiceMode = null
  ) {
    const payload = { message };
    if (conversationId) payload.conversation_id = conversationId;
    if (language) payload.language = language;
    if (dialect) payload.dialect = dialect;
    if (voiceMode !== null) payload.voice_mode = voiceMode;

    const response = await api.post("/api/ai/chat", payload);
    return response.data;
  },

  /**
   * Transcribe recorded audio bytes through backend /api/ai/stt (e.g. Sarvam AI).
   * @param {Blob|File} audioBlob - Audio recording blob.
   * @param {string} languageCode - Language code.
   */
  async speechToText(audioBlob, languageCode = "kn") {
    const formData = new FormData();
    formData.append("file", audioBlob, "farmer_voice.wav");
    formData.append("language_code", languageCode);

    const response = await api.post("/api/ai/stt", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Synthesize text to speech through backend /api/ai/tts (e.g. Sarvam AI).
   * @param {string} text - Response text.
   * @param {string} language - Target language code.
   * @param {string|null} speaker - Voice name.
   */
  async textToSpeech(text, language = "kn", speaker = null) {
    const response = await api.post("/api/ai/tts", {
      text,
      language,
      speaker,
    });
    return response.data;
  },

  /**
   * Get supported dialects grouped by language.
   */
  async getDialects() {
    const response = await api.get("/api/ai/dialects");
    return response.data;
  },

  /**
   * Get authenticated farmer's language, dialect, and voice settings.
   */
  async getPreferences() {
    const response = await api.get("/api/ai/preferences");
    return response.data;
  },

  /**
   * Update authenticated farmer's preferences in MySQL.
   * @param {Object} preferences - { preferred_language, preferred_dialect, voice_enabled, auto_play_voice }
   */
  async updatePreferences(preferences) {
    const response = await api.put("/api/ai/preferences", preferences);
    return response.data;
  },

  /**
   * List conversations for the logged-in farmer.
   */
  async getConversations(limit = 50, offset = 0) {
    const response = await api.get(`/api/ai/conversations?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  /**
   * Retrieve single conversation with all its messages.
   * @param {number} conversationId
   */
  async getConversation(conversationId) {
    const response = await api.get(`/api/ai/conversations/${conversationId}`);
    return response.data;
  },

  /**
   * Explicitly create a new conversation session.
   * @param {string} title
   * @param {string} language
   * @param {string} dialect
   */
  async createConversation(title = "New Farming Advisory", language = "en", dialect = "standard") {
    const response = await api.post("/api/ai/conversations", { title, language, dialect });
    return response.data;
  },

  /**
   * Delete a conversation.
   * @param {number} conversationId
   */
  async deleteConversation(conversationId) {
    const response = await api.delete(`/api/ai/conversations/${conversationId}`);
    return response.data;
  },

  /**
   * Fetch 9 supported regional languages.
   */
  async getSupportedLanguages() {
    const response = await api.get("/api/ai/languages");
    return response.data;
  },

  /**
   * Check AI service readiness and health.
   */
  async checkHealth() {
    const response = await api.get("/api/ai/health");
    return response.data;
  },

  /**
   * Get verified government agricultural schemes.
   */
  async getSchemes() {
    const response = await api.get("/api/ai/schemes");
    return response.data;
  },
};

export default aiService;
