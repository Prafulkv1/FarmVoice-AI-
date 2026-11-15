import api from "./api";

/**
 * FarmVoice AI - Frontend AI Assistant Service.
 * Connects the React client with backend /api/ai endpoints.
 */
export const aiService = {
  /**
   * Send question and receive context-grounded AI guidance.
   * @param {string} message - Farmer's question text.
   * @param {number|null} conversationId - Existing conversation ID (or null to start new).
   * @param {string|null} language - Language code ('kn', 'hi', 'en', etc.).
   */
  async sendMessage(message, conversationId = null, language = null) {
    const payload = { message };
    if (conversationId) payload.conversation_id = conversationId;
    if (language) payload.language = language;

    const response = await api.post("/api/ai/chat", payload);
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
   */
  async createConversation(title = "New Farming Advisory", language = "en") {
    const response = await api.post("/api/ai/conversations", { title, language });
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
