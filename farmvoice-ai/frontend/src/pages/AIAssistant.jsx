import { useState, useEffect, useRef } from "react";
import { useAuth } from "../components/AuthProvider";
import { Bot, MessageCircle, Mic, MicOff, Send, Loader2, Sparkles, User, HelpCircle } from "lucide-react";
import "../styles/dashboard.css";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिन्दी (Hindi)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "gu", name: "ગુજરાતી (Gujarati)" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
];

export default function AIAssistant() {
  const { user } = useAuth();
  const [language, setLanguage] = useState("en");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const farmerName = user?.username || "Farmer";

  useEffect(() => {
    setMessages([
      {
        id: 0,
        type: "ai",
        text: `Namaste ${farmerName}! I am your FarmVoice AI assistant. Ask me questions about crop selection, pest control, weather impact, or government schemes in your preferred language.`,
      },
    ]);

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setVoiceActive(false);
      };
      recognition.onerror = () => {
        setVoiceActive(false);
      };
      recognition.onend = () => {
        setVoiceActive(false);
      };
      recognitionRef.current = recognition;
    }
  }, [farmerName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };

  const toggleVoice = () => {
    if (!voiceSupported) return;
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (voiceActive) {
      recognition.stop();
      setVoiceActive(false);
    } else {
      recognition.lang = language;
      try {
        recognition.start();
        setVoiceActive(true);
      } catch (err) {
        setVoiceActive(false);
      }
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = query.trim();
    if (!text || sending) return;

    const userMessage = { id: Date.now(), type: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setSending(true);

    // Backend query endpoint integration pending notice:
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          text: `Your query has been recorded. Our regional agricultural models are processing advisories for "${text}" and localized recommendations will appear shortly.`,
        },
      ]);
      setSending(false);
    }, 1000);
  };

  return (
    <div className="page ai-page-container">
      <div className="page-header">
        <h1 className="page-title">Multilingual AI Farming Assistant</h1>
        <p className="page-sub">
          Ask questions in your regional language via voice or text for tailored agronomic insights.
        </p>
      </div>

      {/* Language Configuration Card */}
      <section className="feature-card ai-config-card">
        <div className="ai-config-top">
          <div className="feature-icon"><Bot size={22} /></div>
          <div className="ai-config-info">
            <p className="feature-title">Regional Language &amp; Speech Support</p>
            <p className="feature-text">
              Select your spoken language. The voice microphone uses your browser&rsquo;s speech recognition.
            </p>
          </div>
        </div>

        <div className="ai-lang-selector-row">
          <label className="ai-lang-label">
            Active Language:
          </label>
          <select
            value={language}
            onChange={handleLanguageChange}
            className="ai-lang-select"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Main Chat Interface */}
      <section className="ai-chat-card">
        <div className="ai-chat-header">
          <div className="ai-chat-status">
            <span className="ai-status-pulse" />
            <span className="ai-status-text">FarmVoice AI Active</span>
          </div>
          <span className="ai-chat-lang-badge">
            {LANGUAGES.find((l) => l.code === language)?.name}
          </span>
        </div>

        <div className="ai-chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`ai-message-row ${msg.type === "user" ? "user-row" : "ai-row"}`}
            >
              <div className="ai-message-avatar">
                {msg.type === "ai" ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className="ai-message-bubble">
                <span className="ai-message-author">
                  {msg.type === "ai" ? "FarmVoice AI Assistant" : farmerName}
                </span>
                <p className="ai-message-body">{msg.text}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="ai-message-row ai-row">
              <div className="ai-message-avatar">
                <Bot size={18} />
              </div>
              <div className="ai-message-bubble loading-bubble">
                <Loader2 size={16} className="loader" />
                <span>Consulting agricultural database...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="ai-chat-input-bar" noValidate>
          <input
            className="ai-chat-input"
            placeholder="Type your farming question (e.g. paddy fertilizer timing, pest symptoms)..."
            value={query}
            onChange={handleQueryChange}
            disabled={sending}
          />

          <button
            type="button"
            className={`btn-ai-voice ${voiceActive ? "voice-listening" : ""}`}
            onClick={toggleVoice}
            disabled={!voiceSupported || sending}
            aria-label={voiceActive ? "Stop listening" : "Start voice input"}
            title={
              !voiceSupported
                ? "Voice input not supported in this browser"
                : voiceActive
                  ? "Listening now..."
                  : "Start voice input"
            }
          >
            {voiceActive ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            type="submit"
            className="btn-ai-send"
            disabled={sending || !query.trim()}
            title="Send question"
          >
            <Send size={18} />
          </button>
        </form>
      </section>

      {/* Suggested Inquiries Card */}
      <section className="feature-card ai-topics-card">
        <div className="feature-icon"><HelpCircle size={20} /></div>
        <div>
          <p className="feature-title">Popular Farming Topics You Can Ask</p>
          <p className="feature-text">
            &bull; Optimal sowing dates based on current soil temperature and rainfall forecast.<br />
            &bull; Bio-fertilizer dosage and N-P-K nutrient balancing for cereals and cash crops.<br />
            &bull; Integrated pest management for stem borer, bollworm, and aphid control.<br />
            &bull; Eligibility criteria for PM-KISAN, crop insurance claims, and drip irrigation subsidies.
          </p>
        </div>
      </section>
    </div>
  );
}
