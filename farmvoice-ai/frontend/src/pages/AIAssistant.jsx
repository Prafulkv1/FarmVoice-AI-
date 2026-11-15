import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../components/AuthProvider";
import aiService from "../services/aiService";
import { profileService } from "../services/profileService";
import {
  SpeechRecognitionManager,
  TextToSpeechManager,
  LANGUAGE_SPEECH_MAP,
} from "../utils/voiceUtils";
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  Square,
  Copy,
  Check,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sprout,
  ShieldCheck,
  CloudSun,
  Droplets,
  Landmark,
  FileQuestion,
  Menu,
  X,
  AlertCircle,
  MapPin,
  Layers,
  CheckCircle,
  MessageSquare,
} from "lucide-react";

import "../styles/dashboard.css";
import "../styles/aiAssistant.css";

const FALLBACK_LANGUAGES = [
  { code: "kn", name: "Kannada", native_name: "ಕನ್ನಡ", speech_code: "kn-IN" },
  { code: "hi", name: "Hindi", native_name: "हिन्दी", speech_code: "hi-IN" },
  { code: "te", name: "Telugu", native_name: "తెలుగు", speech_code: "te-IN" },
  { code: "ta", name: "Tamil", native_name: "தமிழ்", speech_code: "ta-IN" },
  { code: "ml", name: "Malayalam", native_name: "മലയാളം", speech_code: "ml-IN" },
  { code: "mr", name: "Marathi", native_name: "मराठी", speech_code: "mr-IN" },
  { code: "bn", name: "Bengali", native_name: "বাংলা", speech_code: "bn-IN" },
  { code: "pa", name: "Punjabi", native_name: "ਪੰਜਾਬੀ", speech_code: "pa-IN" },
  { code: "en", name: "English", native_name: "English", speech_code: "en-IN" },
];

// Helper to map profile language string (e.g. "Kannada") to code ("kn")
const LANGUAGE_CODE_MAP = {
  kannada: "kn",
  hindi: "hi",
  telugu: "te",
  tamil: "ta",
  malayalam: "ml",
  marathi: "mr",
  bengali: "bn",
  punjabi: "pa",
  english: "en",
};

// 6 Structured AgriTech Question Cards
const PROMPT_CARDS = [
  {
    id: "crop-selection",
    icon: Sprout,
    title: "Crop Selection",
    questions: {
      kn: "ನನ್ನ ಜಮೀನಿನ ಮಣ್ಣು ಮತ್ತು ಹವಾಮಾನಕ್ಕೆ ಯಾವ ಬೆಳೆ ಅತ್ಯಂತ ಸೂಕ್ತ ಹಾಗೂ ಲಾಭದಾಯಕ?",
      hi: "मेरी मिट्टी और मौसम के लिए कौन सी फसल सबसे उपयुक्त और लाभदायक है?",
      te: "నా నేల మరియు వాతావరణానికి ఏ పంట చాలా అనుకూలమైనది మరియు లాభదాయకమైనది?",
      ta: "என் நிலத்தின் மண் மற்றும் காலநிலைக்கு எந்தப் பயிர் மிகவும் பொருத்தமானது?",
      ml: "എന്റെ മണ്ണിനും കാലാവസ്ഥയ്ക്കും ഏറ്റവും അനുയോജ്യമായ വിള ഏതാണ്?",
      mr: "माझ्या जमिनीच्या मातीसाठी आणि हवामानासाठी कोणते पीक सर्वात योग्य आणि फायदेशीर आहे?",
      bn: "আমার জমির মাটি ও আবহাওয়ার জন্য কোন ফসলটি সবচেয়ে উপযুক্ত ও লাভজনক?",
      pa: "ਮੇਰੀ ਜ਼ਮੀਨ ਦੀ ਮਿੱਟੀ ਅਤੇ ਮੌਸਮ ਲਈ ਕਿਹੜੀ ਫ਼ਸਲ ਸਭ ਤੋਂ ਵਧੀਆ ਅਤੇ ਲਾਹੇਵੰਦ ਹੈ?",
      en: "Which crops are most suitable and profitable for my soil type and location?",
    },
  },
  {
    id: "pest-disease",
    icon: ShieldCheck,
    title: "Pest & Disease Help",
    questions: {
      kn: "ಬೆಳೆಯಲ್ಲಿ ಎಲೆ ಹಳದಿಯಾಗುವುದು ಮತ್ತು ಕೀಟ ಬಾಧೆಯನ್ನು ಹೇಗೆ ನಿಯಂತ್ರಿಸುವುದು?",
      hi: "फसल में पत्तियों का पीला पड़ना और कीट प्रकोप को कैसे रोकें?",
      te: "పంటలో ఆకులు పసుపు రంగులోకి మారడం మరియు తెగుళ్లను ఎలా నియంత్రించాలి?",
      ta: "பயிரில் இலைகள் மஞ்சள் நிறமாவதை மற்றும் பூச்சி தாக்குதலை எவ்வாறு கட்டுப்படுத்துவது?",
      ml: "വിളകളിൽ ഇലകൾ മഞ്ഞളിക്കുന്നതും കീടബാധയും എങ്ങനെ നിയന്ത്രിക്കാം?",
      mr: "पिकांमध्ये पाने पिवळी पडणे आणि किडींचा प्रादुर्भाव कसा रोखावा?",
      bn: "ফসলের পাতা হলুদ হওয়া এবং পোকার আক্রমণ কীভাবে নিয়ন্ত্রণ করবেন?",
      pa: "ਫਸਲ ਵਿੱਚ ਪੱਤੇ ਪੀਲੇ ਪੈਣ ਅਤੇ ਕੀੜਿਆਂ ਦੇ ਹਮਲੇ ਦੀ ਰੋਕਥਾਮ ਕਿਵੇਂ ਕਰੀਏ?",
      en: "How do I identify and manage common crop leaf yellowing and pest infestations?",
    },
  },
  {
    id: "irrigation-guidance",
    icon: Droplets,
    title: "Irrigation Guidance",
    questions: {
      kn: "ಪ್ರಸ್ತುತ ಹವಾಮಾನದಲ್ಲಿ ನನ್ನ ಬೆಳೆಗೆ ಎಷ್ಟು ನೀರಾವರಿ ಅಗತ್ಯವಿದೆ?",
      hi: "वर्तमान मौसम की स्थिति में मेरी फसल को कितनी सिंचाई की आवश्यकता है?",
      te: "ప్రస్తుత వాతావరణ పరిస్థితులలో నా పంటకు ఎంత నీటిపారుదల అవసరం?",
      ta: "தற்போதைய வானிலையில் எனது பயிருக்கு எவ்வளவு பாசனம் தேவை?",
      ml: "നിലവിലെ കാലാവസ്ഥയിൽ എന്റെ വിളയ്ക്ക് എത്രമാത്രം നനവ് ആവശ്യമാണ്?",
      mr: "सध्याच्या हवामानात माझ्या पिकाला किती पाणी देण्याची गरज आहे?",
      bn: "বর্তমান আবহাওয়ায় আমার ফসলের জন্য কতটা সেচ প্রয়োজন?",
      pa: "ਮੌਜੂਦਾ ਮੌਸਮ ਵਿੱਚ ਮੇਰੀ ਫਸਲ ਨੂੰ ਕਿੰਨੀ ਸਿੰਚਾਈ ਦੀ ਲੋੜ ਹੈ?",
      en: "How should I plan my irrigation based on the current weather and soil moisture?",
    },
  },
  {
    id: "weather-advice",
    icon: CloudSun,
    title: "Weather-Based Advice",
    questions: {
      kn: "ಈ ವಾರದ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ ಆಧರಿಸಿ ಕೃಷಿ ಕೆಲಸಗಳನ್ನು ಹೇಗೆ ಯೋಜಿಸಬೇಕು?",
      hi: "इस सप्ताह के मौसम पूर्वानुमान के अनुसार कृषि कार्यों की योजना कैसे बनाएं?",
      te: "ఈ వారం వాతావరణ సూచన ఆధారంగా వ్యవసాయ పనులను ఎలా ప్లాన్ చేసుకోవాలి?",
      ta: "இந்த வார வானிலை முன்னறிவிப்பின் அடிப்படையில் விவசாயப் பணிகளை எவ்வாறு திட்டமிடுவது?",
      ml: "ഈ ആഴ്ചയിലെ കാലാവസ്ഥാ പ്രവചനത്തിന്റെ അടിസ്ഥാനത്തിൽ കൃഷിപ്പണികൾ എങ്ങനെ ആസൂത്രണം ചെയ്യാം?",
      mr: "या आठवड्याच्या हवामान अंदाजानुसार शेती कामांचे नियोजन कसे करावे?",
      bn: "এই সপ্তাহের আবহাওয়ার পূর্বাভাসের ভিত্তিতে কীভাবে চাষের কাজের পরিকল্পনা করবেন?",
      pa: "ਇਸ ਹਫ਼ਤੇ ਦੇ ਮੌਸਮ ਦੇ ਅਨੁਮਾਨ ਦੇ ਆਧਾਰ 'ਤੇ ਖੇਤੀ ਦੇ ਕੰਮਾਂ ਦੀ ਯੋਜਨਾ ਕਿਵੇਂ ਬਣਾਈਏ?",
      en: "How should I adjust my spraying and field work based on the upcoming weather forecast?",
    },
  },
  {
    id: "fertilizer-guidance",
    icon: Layers,
    title: "Fertilizer Guidance",
    questions: {
      kn: "ನನ್ನ ಮಣ್ಣಿನ ಪ್ರಕಾರಕ್ಕೆ ಸರಿಯಾದ ಪೋಷಕಾಂಶ ಮತ್ತು ಗೊಬ್ಬರ ನಿರ್ವಹಣೆ ಹೇಗೆ?",
      hi: "मेरी मिट्टी के प्रकार के लिए सही पोषक तत्व और उर्वरक प्रबंधन क्या है?",
      te: "నా నేల రకానికి సరైన పోషక మరియు ఎరువుల నిర్వహణ ఏమిటి?",
      ta: "எனது மண் வகைக்கு சரியான ஊட்டச்சத்து மற்றும் உர மேலாண்மை என்ன?",
      ml: "എന്റെ മണ്ണിന്റെ തരത്തിന് അനുയോജ്യമായ വളപ്രയോഗവും പോഷക പരിപാലനവും എന്താണ്?",
      mr: "माझ्या मातीच्या प्रकारानुसार योग्य खत व्यवस्थापन कसे करावे?",
      bn: "আমার মাটির প্রকারের জন্য সঠিক সার ও পুষ্টি ব্যবস্থাপনা কী?",
      pa: "ਮੇਰੀ ਮਿੱਟੀ ਦੀ ਕਿਸਮ ਲਈ ਸਹੀ ਖਾਦ ਅਤੇ ਪੌਸ਼ਟਿਕ ਪ੍ਰਬੰਧਨ ਕੀ ਹੈ?",
      en: "What is the recommended fertilizer schedule and nutrient dosage for my soil and crops?",
    },
  },
  {
    id: "government-schemes",
    icon: Landmark,
    title: "Government Schemes",
    questions: {
      kn: "ನನಗೆ ಯಾವ ಸರ್ಕಾರಿ ಕೃಷಿ ಸಬ್ಸಿಡಿ ಮತ್ತು ಬೆಳೆ ವಿಮೆ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ?",
      hi: "मुझे कौन सी सरकारी कृषि सब्सिडी और फसल बीमा योजनाएं मिल सकती हैं?",
      te: "నాకు ఏ ప్రభుత్వ వ్యవసాయ సబ్సిడీ మరియు పంట బీమా పథకాలు అందుబాటులో ఉన్నాయి?",
      ta: "எனக்கு என்ன அரசு மானியங்கள் மற்றும் பயிர் காப்பீட்டு திட்டங்கள் கிடைக்கின்றன?",
      ml: "എനിക്ക് ഏതൊക്കെ സർക്കാർ സബ്സിഡികളും വിള ഇൻഷുറൻസ് പദ്ധതികളും ലഭ്യമാണ്?",
      mr: "मला कोणती सरकारी कृषी सबसिडी आणि पीक विमा योजना मिळू शकतात?",
      bn: "আমার জন্য কোন সরকারি কৃষি ভর্তুকি এবং ফসল বীমা প্রকল্পগুলি প্রযোজ্য?",
      pa: "ਮੇਰੇ ਲਈ ਕਿਹੜੀਆਂ ਸਰਕਾਰੀ ਖੇਤੀਬਾੜੀ ਸਬਸਿਡੀਆਂ ਅਤੇ ਫ਼ਸਲੀ ਬੀਮਾ ਸਕੀਮਾਂ ਉਪਲਬਧ ਹਨ?",
      en: "What government agricultural subsidies, PM-KISAN, or crop insurance schemes am I eligible for?",
    },
  },
];

/**
 * Lightweight helper to render formatted markdown response text
 * without external heavyweight parser dependencies.
 */
function MarkdownRenderer({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  const renderedElements = [];
  let currentList = [];
  let listType = null; // 'ul' or 'ol'

  const flushList = (keyPrefix) => {
    if (currentList.length > 0) {
      if (listType === "ol") {
        renderedElements.push(
          <ol key={`${keyPrefix}-ol`} className="ai-markdown-ol">
            {currentList.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ol>
        );
      } else {
        renderedElements.push(
          <ul key={`${keyPrefix}-ul`} className="ai-markdown-ul">
            {currentList.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  const formatInline = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      );
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(`flush-${idx}`);
      return;
    }

    // Heading 2 (##)
    if (trimmed.startsWith("## ")) {
      flushList(`h2-${idx}`);
      renderedElements.push(
        <h2 key={`h2-${idx}`} className="ai-markdown-h2">
          {trimmed.slice(3)}
        </h2>
      );
      return;
    }

    // Heading 3 (###)
    if (trimmed.startsWith("### ")) {
      flushList(`h3-${idx}`);
      renderedElements.push(
        <h3 key={`h3-${idx}`} className="ai-markdown-h3">
          {trimmed.slice(4)}
        </h3>
      );
      return;
    }

    // Numbered list item
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (listType !== "ol") flushList(`sw-ol-${idx}`);
      listType = "ol";
      currentList.push(formatInline(olMatch[2]));
      return;
    }

    // Bulleted list item
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (listType !== "ul") flushList(`sw-ul-${idx}`);
      listType = "ul";
      currentList.push(formatInline(trimmed.slice(2)));
      return;
    }

    // Normal paragraph
    flushList(`p-${idx}`);
    renderedElements.push(
      <p
        key={`p-${idx}`}
        dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
      />
    );
  });

  flushList("end");

  return <div className="ai-markdown-body">{renderedElements}</div>;
}

export default function AIAssistant() {
  const { user } = useAuth();

  // Languages & Selection
  const [languages, setLanguages] = useState(FALLBACK_LANGUAGES);
  const [language, setLanguage] = useState("en");

  // Farmer Profile Context
  const [farmerProfile, setFarmerProfile] = useState(null);

  // Conversations & Active Chat State
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Query & Messaging State
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  // Voice State (STT & TTS)
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  const recognitionManagerRef = useRef(null);
  const ttsManagerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const farmerDisplayName =
    farmerProfile?.full_name || user?.farm_name || user?.username || "Farmer";

  // 1. Initial Load: Languages, Profile, Conversations, and Voice Managers
  useEffect(() => {
    let isMounted = true;

    // Load supported languages
    aiService
      .getSupportedLanguages()
      .then((res) => {
        if (isMounted && res?.languages?.length) {
          setLanguages(res.languages);
        }
      })
      .catch(() => {});

    // Load Farmer Profile to preselect preferred regional language
    profileService
      .getProfile()
      .then((res) => {
        if (!isMounted) return;
        const prof = res?.data?.profile || res?.data?.data || null;
        if (prof) {
          setFarmerProfile(prof);
          if (prof.preferred_language) {
            const lower = prof.preferred_language.toLowerCase();
            const matchedCode = LANGUAGE_CODE_MAP[lower] || "en";
            setLanguage(matchedCode);
          }
        }
      })
      .catch(() => {});

    // Load existing conversations list
    loadConversationsList();

    // Initialize Speech Recognition Manager
    const stt = new SpeechRecognitionManager(
      (transcript, isFinal) => {
        setQuery(transcript);
        if (isFinal) {
          setIsListening(false);
        }
      },
      (errorMessage) => {
        setErrorBanner(errorMessage);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      },
      () => {
        setIsListening(true);
        setErrorBanner(null);
      }
    );
    recognitionManagerRef.current = stt;
    setVoiceSupported(stt.isSupported);

    // Initialize Text to Speech Manager
    const tts = new TextToSpeechManager(
      (msgId) => setSpeakingMessageId(msgId),
      () => setSpeakingMessageId(null),
      (err) => {
        console.warn("TTS Notice:", err);
        setSpeakingMessageId(null);
      }
    );
    ttsManagerRef.current = tts;

    return () => {
      isMounted = false;
      stt.stop();
      tts.stop();
    };
  }, []);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [query]);

  const loadConversationsList = async () => {
    try {
      const res = await aiService.getConversations();
      if (res?.success && Array.isArray(res.conversations)) {
        setConversations(res.conversations);
      }
    } catch (err) {
      console.warn("Failed to load conversations:", err);
    }
  };

  // Group conversations by time category (Today, Yesterday, Previous 7 Days, Older)
  const groupedConversations = useMemo(() => {
    const filtered = conversations.filter((c) =>
      c.title.toLowerCase().includes(searchFilter.toLowerCase())
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups = {
      today: [],
      yesterday: [],
      pastWeek: [],
      older: [],
    };

    filtered.forEach((conv) => {
      const convDate = new Date(conv.updated_at || conv.created_at);
      if (convDate >= today) {
        groups.today.push(conv);
      } else if (convDate >= yesterday) {
        groups.yesterday.push(conv);
      } else if (convDate >= weekAgo) {
        groups.pastWeek.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  }, [conversations, searchFilter]);

  // Switch Conversation
  const handleSelectConversation = async (convId) => {
    if (convId === activeConversationId) return;

    // Stop ongoing audio
    ttsManagerRef.current?.stop();
    setSpeakingMessageId(null);
    setErrorBanner(null);

    try {
      const res = await aiService.getConversation(convId);
      if (res?.success && res.conversation) {
        setActiveConversationId(convId);
        setMessages(res.conversation.messages || []);
        if (res.conversation.language) {
          setLanguage(res.conversation.language);
        }
        setMobileSidebarOpen(false);
      }
    } catch (err) {
      setErrorBanner("Failed to load conversation history.");
    }
  };

  // Start New Chat
  const handleStartNewChat = () => {
    ttsManagerRef.current?.stop();
    setSpeakingMessageId(null);
    setActiveConversationId(null);
    setMessages([]);
    setQuery("");
    setErrorBanner(null);
    setMobileSidebarOpen(false);
  };

  // Delete Conversation
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await aiService.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleStartNewChat();
      }
    } catch (err) {
      setErrorBanner("Could not delete conversation.");
    }
  };

  // Send Question
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || query).trim();
    if (!text || sending) return;

    setErrorBanner(null);
    ttsManagerRef.current?.stop();
    setSpeakingMessageId(null);

    // Optimistic user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: "user",
      message: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setQuery("");
    setSending(true);

    try {
      const response = await aiService.sendMessage(
        text,
        activeConversationId,
        language
      );

      if (response?.success) {
        const assistantMsg = {
          id: response.assistant_message_id || Date.now(),
          role: "assistant",
          message: response.message,
          language: response.language || language,
          created_at: response.created_at || new Date().toISOString(),
          context_summary: response.context_summary,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // If this was a new conversation, record ID and refresh list
        if (!activeConversationId && response.conversation_id) {
          setActiveConversationId(response.conversation_id);
        }
        loadConversationsList();
      }
    } catch (err) {
      console.error("AI Chat error:", err);
      const errData = err.response?.data;
      if (errData?.error_type === "MISSING_API_KEY") {
        setErrorBanner(
          errData.message ||
            "AI Assistant requires an API key in backend/.env (AI_API_KEY). Please configure it to enable regional AI assistance."
        );
      } else {
        setErrorBanner(
          errData?.message ||
            "Unable to generate AI agricultural guidance right now. Please check backend connection and retry."
        );
      }
    } finally {
      setSending(false);
    }
  };

  // Voice Toggle (Speech-to-Text)
  const handleToggleVoice = () => {
    if (!voiceSupported) {
      setErrorBanner(
        "Voice input is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }

    const stt = recognitionManagerRef.current;
    if (!stt) return;

    if (isListening) {
      stt.stop();
      setIsListening(false);
    } else {
      setErrorBanner(null);
      const started = stt.start(language);
      if (started) {
        setIsListening(true);
      }
    }
  };

  // Text-to-Speech Play / Stop
  const handleToggleSpeak = (msgId, text) => {
    const tts = ttsManagerRef.current;
    if (!tts) return;

    if (speakingMessageId === msgId) {
      tts.stop();
      setSpeakingMessageId(null);
    } else {
      tts.speak(text, language, msgId);
    }
  };

  // Copy Message to Clipboard
  const handleCopyMessage = async (msgId, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.warn("Clipboard copy failed:", err);
    }
  };

  // Active language info
  const activeLanguageInfo =
    languages.find((l) => l.code === language) || languages[0];

  return (
    <div className="page ai-page-root">
      <div className="ai-assistant-wrapper">
        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="ai-sidebar-overlay"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* 1. Left Sidebar - Conversation Management */}
        <aside
          className={`ai-sidebar ${sidebarCollapsed ? "collapsed" : ""} ${
            mobileSidebarOpen ? "mobile-open" : "mobile-closed"
          }`}
        >
          {/* Sidebar Header */}
          <div className="ai-sidebar-header">
            <div className="ai-brand-group">
              <div className="ai-brand-icon-badge">
                <Bot size={20} />
              </div>
              <span className="ai-brand-title">FarmVoice AI</span>
            </div>
            <button
              className="ai-sidebar-collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title="Collapse history"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="ai-sidebar-actions">
            <button
              className="ai-new-chat-btn"
              onClick={handleStartNewChat}
              title="Start a new conversation"
            >
              <Plus size={18} />
              <span>New Farming Advisory</span>
            </button>
          </div>

          {/* Search Conversations */}
          <div className="ai-search-container">
            <div className="ai-search-input-wrapper">
              <Search size={15} className="ai-search-icon" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="ai-search-input"
              />
            </div>
          </div>

          {/* Conversation History Groupings */}
          <div className="ai-conv-list">
            {conversations.length === 0 ? (
              <div className="ai-conv-empty">
                <MessageSquare
                  size={28}
                  style={{ opacity: 0.4, margin: "0 auto 8px" }}
                />
                <p>No previous conversations.</p>
                <p style={{ fontSize: "0.74rem", opacity: 0.7 }}>
                  Ask a question to begin.
                </p>
              </div>
            ) : (
              <>
                {groupedConversations.today.length > 0 && (
                  <div className="ai-conv-group">
                    <div className="ai-conv-group-title">Today</div>
                    {groupedConversations.today.map((conv) => (
                      <div
                        key={conv.id}
                        className={`ai-conv-item ${
                          activeConversationId === conv.id ? "active" : ""
                        }`}
                        onClick={() => handleSelectConversation(conv.id)}
                      >
                        <div className="ai-conv-item-left">
                          <MessageSquare size={15} className="ai-conv-icon" />
                          <span className="ai-conv-title">{conv.title}</span>
                        </div>
                        <button
                          className="ai-conv-delete-btn"
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          title="Delete conversation"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {groupedConversations.yesterday.length > 0 && (
                  <div className="ai-conv-group">
                    <div className="ai-conv-group-title">Yesterday</div>
                    {groupedConversations.yesterday.map((conv) => (
                      <div
                        key={conv.id}
                        className={`ai-conv-item ${
                          activeConversationId === conv.id ? "active" : ""
                        }`}
                        onClick={() => handleSelectConversation(conv.id)}
                      >
                        <div className="ai-conv-item-left">
                          <MessageSquare size={15} className="ai-conv-icon" />
                          <span className="ai-conv-title">{conv.title}</span>
                        </div>
                        <button
                          className="ai-conv-delete-btn"
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          title="Delete conversation"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {groupedConversations.pastWeek.length > 0 && (
                  <div className="ai-conv-group">
                    <div className="ai-conv-group-title">Previous 7 Days</div>
                    {groupedConversations.pastWeek.map((conv) => (
                      <div
                        key={conv.id}
                        className={`ai-conv-item ${
                          activeConversationId === conv.id ? "active" : ""
                        }`}
                        onClick={() => handleSelectConversation(conv.id)}
                      >
                        <div className="ai-conv-item-left">
                          <MessageSquare size={15} className="ai-conv-icon" />
                          <span className="ai-conv-title">{conv.title}</span>
                        </div>
                        <button
                          className="ai-conv-delete-btn"
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          title="Delete conversation"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {groupedConversations.older.length > 0 && (
                  <div className="ai-conv-group">
                    <div className="ai-conv-group-title">Older</div>
                    {groupedConversations.older.map((conv) => (
                      <div
                        key={conv.id}
                        className={`ai-conv-item ${
                          activeConversationId === conv.id ? "active" : ""
                        }`}
                        onClick={() => handleSelectConversation(conv.id)}
                      >
                        <div className="ai-conv-item-left">
                          <MessageSquare size={15} className="ai-conv-icon" />
                          <span className="ai-conv-title">{conv.title}</span>
                        </div>
                        <button
                          className="ai-conv-delete-btn"
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          title="Delete conversation"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* 2. Main Chat Area */}
        <section className="ai-chat-main">
          {/* Top Bar */}
          <div className="ai-topbar">
            <div className="ai-topbar-left">
              {sidebarCollapsed && (
                <button
                  className="ai-sidebar-toggle-btn"
                  onClick={() => setSidebarCollapsed(false)}
                  title="Expand history"
                >
                  <ChevronRight size={18} />
                </button>
              )}
              <button
                className="ai-sidebar-toggle-btn mobile-menu-btn"
                onClick={() => setMobileSidebarOpen(true)}
                title="Open menu"
                style={{ display: "none" }}
              >
                <Menu size={18} />
              </button>

              <div className="ai-chat-header-title">
                <span>AI Farming Assistant</span>
                <span className="ai-status-badge">
                  <span className="ai-status-dot" />
                  Context Connected
                </span>
              </div>
            </div>

            <div className="ai-topbar-right">
              {/* Language Selector Dropdown */}
              <div className="ai-lang-dropdown-wrapper">
                <span className="ai-lang-label-tag">Language:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="ai-lang-dropdown"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.native_name} ({l.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Messages Scroll Container */}
          <div className="ai-messages-scroll">
            {/* Error Banner */}
            {errorBanner && (
              <div className="ai-error-banner">
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>{errorBanner}</div>
                <button
                  onClick={() => setErrorBanner(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Welcome Screen (Rendered when no messages in active conversation) */}
            {messages.length === 0 && (
              <div className="ai-welcome-screen">
                <div className="ai-welcome-avatar-wrap">
                  <div className="ai-welcome-avatar">
                    <Sprout size={36} />
                  </div>
                  <div className="ai-welcome-sparkle-pill">
                    <Sparkles size={14} />
                  </div>
                </div>

                <div className="ai-welcome-greeting">
                  Namaste, {farmerDisplayName}!
                </div>
                <h1 className="ai-welcome-title">Your Smart Farming Assistant</h1>
                <p className="ai-welcome-desc">
                  Ask anything about farming. Get intelligent guidance based on
                  your crops, location, weather, and farming history in your
                  regional language.
                </p>

                {/* Connected Farmer Profile Context Chips */}
                {farmerProfile && (
                  <div className="ai-connected-context">
                    {farmerProfile.district && (
                      <span className="ai-context-chip">
                        <MapPin size={14} className="ai-context-chip-icon" />
                        {farmerProfile.district}, {farmerProfile.state}
                      </span>
                    )}
                    {farmerProfile.soil_type && (
                      <span className="ai-context-chip">
                        <Layers size={14} className="ai-context-chip-icon" />
                        Soil: {farmerProfile.soil_type}
                      </span>
                    )}
                    {farmerProfile.main_crops?.length > 0 && (
                      <span className="ai-context-chip">
                        <Sprout size={14} className="ai-context-chip-icon" />
                        Crops: {farmerProfile.main_crops.join(", ")}
                      </span>
                    )}
                    {farmerProfile.total_land_size && (
                      <span className="ai-context-chip">
                        Land: {farmerProfile.total_land_size}{" "}
                        {farmerProfile.land_unit || "Acres"}
                      </span>
                    )}
                  </div>
                )}

                {/* 6 Interactive Prompt Cards */}
                <div className="ai-prompt-grid">
                  {PROMPT_CARDS.map((card) => {
                    const CardIcon = card.icon;
                    const questionText =
                      card.questions[language] || card.questions.en;
                    return (
                      <div
                        key={card.id}
                        className="ai-prompt-card"
                        onClick={() => handleSendMessage(questionText)}
                      >
                        <div className="ai-prompt-card-top">
                          <div className="ai-prompt-icon-badge">
                            <CardIcon size={16} />
                          </div>
                          <span className="ai-prompt-card-title">
                            {card.title}
                          </span>
                        </div>
                        <p className="ai-prompt-card-question">
                          {questionText}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const isSpeaking = speakingMessageId === msg.id;

              return (
                <div
                  key={msg.id || idx}
                  className={`ai-message-row ${
                    isUser ? "user-row" : "assistant-row"
                  }`}
                >
                  <div
                    className={`ai-msg-avatar ${
                      isUser ? "user-avatar" : "ai-avatar"
                    }`}
                  >
                    {isUser ? (
                      farmerDisplayName.charAt(0).toUpperCase()
                    ) : (
                      <Bot size={18} />
                    )}
                  </div>

                  <div className="ai-bubble-container">
                    <div
                      className={`ai-bubble ${
                        isUser ? "user-bubble" : "assistant-bubble"
                      }`}
                    >
                      {/* Context indicator tag for AI responses */}
                      {!isUser && msg.context_summary?.soil_type && (
                        <div className="ai-msg-context-tag">
                          <CheckCircle size={12} />
                          Grounded on your {msg.context_summary.soil_type} &amp;
                          weather
                        </div>
                      )}

                      {/* Message Content */}
                      {isUser ? (
                        <div style={{ whiteSpace: "pre-wrap" }}>
                          {msg.message}
                        </div>
                      ) : (
                        <MarkdownRenderer text={msg.message} />
                      )}
                    </div>

                    {/* Toolbar for AI Responses */}
                    {!isUser && (
                      <div className="ai-msg-toolbar">
                        <span className="ai-msg-time">
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>

                        <button
                          className={`ai-tool-btn ${isSpeaking ? "active" : ""}`}
                          onClick={() => handleToggleSpeak(msg.id, msg.message)}
                          title={isSpeaking ? "Stop voice" : "Read aloud"}
                        >
                          {isSpeaking ? (
                            <>
                              <Square size={13} />
                              <div className="ai-audio-wave">
                                <span className="ai-wave-bar" />
                                <span className="ai-wave-bar" />
                                <span className="ai-wave-bar" />
                              </div>
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 size={13} />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        <button
                          className="ai-tool-btn"
                          onClick={() => handleCopyMessage(msg.id, msg.message)}
                          title="Copy response"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <Check size={13} style={{ color: "#2E7D32" }} />
                              <span style={{ color: "#2E7D32" }}>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing / Processing Indicator */}
            {sending && (
              <div className="ai-message-row assistant-row">
                <div className="ai-msg-avatar ai-avatar">
                  <Bot size={18} />
                </div>
                <div className="ai-typing-indicator">
                  <div className="ai-typing-dots">
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                  </div>
                  <span className="ai-typing-text">
                    FarmVoice AI is analyzing your crops, weather and field
                    records...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 3. Bottom Input Composer */}
          <div className="ai-composer-wrapper">
            {/* Active Voice Listening Pill */}
            {isListening && (
              <div className="ai-voice-active-indicator">
                <div style={{ display: "flex", alignitems: "center", gap: "8px" }}>
                  <span className="ai-dot" style={{ background: "#D32F2F" }} />
                  <span>
                    Listening in {activeLanguageInfo.native_name} (
                    {activeLanguageInfo.name})... Speak your question clearly.
                  </span>
                </div>
                <button
                  onClick={handleToggleVoice}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "inherit",
                    fontWeight: 700,
                  }}
                >
                  Done
                </button>
              </div>
            )}

            <div className="ai-composer-box">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Ask in ${activeLanguageInfo.native_name} or English (e.g. crop care, disease, weather, schemes)...`}
                rows={1}
                className="ai-composer-textarea"
                disabled={sending}
              />

              <div className="ai-composer-actions">
                {/* Microphone Button */}
                <button
                  type="button"
                  className={`ai-mic-btn ${isListening ? "recording" : ""}`}
                  onClick={handleToggleVoice}
                  title={
                    isListening
                      ? "Stop listening"
                      : `Speak in ${activeLanguageInfo.name}`
                  }
                  disabled={sending}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  className="ai-send-btn"
                  onClick={() => handleSendMessage()}
                  disabled={sending || !query.trim()}
                  title="Send question"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>

            {/* Composer Footer Info */}
            <div className="ai-composer-footer">
              <span>
                Active Language:{" "}
                <strong>{activeLanguageInfo.native_name}</strong> (
                {activeLanguageInfo.name})
              </span>
              <span>
                AI guidance is advisory. Consult local extension officers for
                field applications.
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
