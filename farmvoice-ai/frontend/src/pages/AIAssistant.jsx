import { useState, useEffect, useRef } from "react";
import { useAuth } from "../components/AuthProvider";
import { Bot, MessageCircle, Mic, MicOff, Send, Loader2 } from "lucide-react";
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

  const farmerName = user?.username || "Farmer";

  useEffect(() => {
    setMessages([
      {
        id: 0,
        type: "ai",
        text: `Hello ${farmerName}! I'm your FarmVoice AI assistant. Ask me about crops, weather, or farming in your selected language. The AI backend service is being integrated, so detailed responses will be available shortly.`,
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
      recognition.start();
      setVoiceActive(true);
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

    // NOTE: The FarmVoice AI backend currently exposes authentication endpoints
    // only. Regional-language AI query endpoints are not yet implemented, so we
    // do not fabricate a response. A pending state is shown instead.
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          text: "Your query has been received. The AI assistant backend is being integrated and will respond in your selected language soon.",
        },
      ]);
      setSending(false);
    }, 1000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">AI Assistant</h1>
        <p className="page-sub">Ask farming questions in your regional language.</p>
      </div>

      <section className="feature-card">
        <div className="feature-icon"><Bot size={20} /></div>
        <div>
          <p className="feature-title">Regional language support</p>
          <p className="feature-text">
            Select your preferred language. Voice input uses your browser's speech recognition.
          </p>
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-secondary)", margin: 0 }}>
            Language:
          </label>
          <select
            value={language}
            onChange={handleLanguageChange}
            className="form-input"
            style={{ width: 170, height: 36, padding: "0 8px 0 36px" }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="chat-box">
        <div className="messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.type}`}
              style={{ alignSelf: msg.type === "user" ? "flex-end" : "flex-start" }}
            >
              <div className="message-bubble">
                {msg.type === "ai" && <span className="message-role">FarmVoice AI</span>}
                {msg.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="message message-ai" style={{ alignSelf: "flex-start" }}>
              <div className="message-bubble">
                <span className="message-role">FarmVoice AI</span>
                <Loader2 size={16} className="loader" /> Thinking...
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSend} className="chat-input" noValidate>
          <input
            className="form-input"
            placeholder="Type your farming question..."
            value={query}
            onChange={handleQueryChange}
            disabled={sending}
          />
          <button type="submit" className="btn-send" disabled={sending || !query.trim()}>
            <Send size={18} />
          </button>
          <button
            type="button"
            className={`btn-voice ${voiceActive ? "active" : ""}`}
            onClick={toggleVoice}
            disabled={!voiceSupported || sending}
            aria-label={voiceActive ? "Stop voice input" : "Start voice input"}
            title={
              !voiceSupported
                ? "Voice input not supported in this browser"
                : voiceActive
                  ? "Listening..."
                  : "Start voice input"
            }
          >
            {voiceActive ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          {!voiceSupported && <span className="voice-note">Voice input not supported</span>}
        </form>
      </section>

      <section className="feature-card">
        <div className="feature-icon"><MessageCircle size={20} /></div>
        <div>
          <p className="feature-title">What you can ask</p>
          <p className="feature-text">
            Crop care tips, pest control, weather-based sowing advice, fertilizer guidance, and government schemes in your language.
          </p>
        </div>
      </section>
    </div>
  );
}
