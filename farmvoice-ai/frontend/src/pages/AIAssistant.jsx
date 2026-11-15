import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../components/AuthProvider";
import aiService from "../services/aiService";
import { profileService } from "../services/profileService";
import {
  SpeechRecognitionManager,
  AudioStreamRecorder,
  HybridAudioPlayer,
  LANGUAGE_SPEECH_MAP,
} from "../utils/voiceUtils";
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
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
  Radio,
  Sliders,
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
 */
function MarkdownRenderer({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  const renderedElements = [];
  let currentList = [];
  let listType = null;

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

    if (trimmed.startsWith("## ")) {
      flushList(`h2-${idx}`);
      renderedElements.push(
        <h2 key={`h2-${idx}`} className="ai-markdown-h2">
          {trimmed.slice(3)}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushList(`h3-${idx}`);
      renderedElements.push(
        <h3 key={`h3-${idx}`} className="ai-markdown-h3">
          {trimmed.slice(4)}
        </h3>
      );
      return;
    }

    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (listType !== "ol") flushList(`sw-ol-${idx}`);
      listType = "ol";
      currentList.push(formatInline(olMatch[2]));
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (listType !== "ul") flushList(`sw-ul-${idx}`);
      listType = "ul";
      currentList.push(formatInline(trimmed.slice(2)));
      return;
    }

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

  // Languages & Dialects Selection
  const [languages, setLanguages] = useState(FALLBACK_LANGUAGES);
  const [language, setLanguage] = useState("kn");
  const [allDialects, setAllDialects] = useState({});
  const [dialect, setDialect] = useState("standard");
  const [voiceMode, setVoiceMode] = useState(true); // Auto-voice response enabled

  // Farmer Profile & Context
  const [farmerProfile, setFarmerProfile] = useState(null);

  // Conversations & History
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

  // Voice Input (STT) State
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [audioProcessing, setAudioProcessing] = useState(false);

  // Audio Playback (TTS) State
  const [activeAudioMsgId, setActiveAudioMsgId] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioSpeed, setAudioSpeed] = useState(1.0);

  const recognitionManagerRef = useRef(null);
  const streamRecorderRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const farmerDisplayName =
    farmerProfile?.full_name || user?.farm_name || user?.username || "Farmer";

  // Available dialects for currently selected language
  const currentLanguageDialects = useMemo(() => {
    return allDialects[language] || [
      { code: "standard", name: "Standard", native_name: "ಶಿಷ್ಟ / मानक" },
    ];
  }, [allDialects, language]);

  // 1. Initial Load: Languages, Dialects, Profile & Preferences, Conversations, Audio Player
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

    // Load supported regional dialects
    aiService
      .getDialects()
      .then((res) => {
        if (isMounted && res?.dialects) {
          setAllDialects(res.dialects);
        }
      })
      .catch(() => {});

    // Load Farmer Profile & Stored AI Preferences
    aiService
      .getPreferences()
      .then((res) => {
        if (!isMounted) return;
        if (res?.preferences) {
          const pref = res.preferences;
          if (pref.preferred_language) {
            const code =
              LANGUAGE_CODE_MAP[pref.preferred_language.toLowerCase()] ||
              pref.preferred_language;
            setLanguage(code);
          }
          if (pref.preferred_dialect) {
            setDialect(pref.preferred_dialect);
          }
          if (typeof pref.voice_enabled === "boolean") {
            setVoiceMode(pref.voice_enabled);
          }
        }
      })
      .catch(() => {
        // Fallback to profileService
        profileService.getProfile().then((pRes) => {
          if (!isMounted) return;
          const prof = pRes?.data?.profile;
          if (prof) {
            setFarmerProfile(prof);
            if (prof.preferred_language) {
              const code =
                LANGUAGE_CODE_MAP[prof.preferred_language.toLowerCase()] || "en";
              setLanguage(code);
            }
          }
        });
      });

    // Load Profile details for context display
    profileService
      .getProfile()
      .then((pRes) => {
        if (isMounted && pRes?.data?.profile) {
          setFarmerProfile(pRes.data.profile);
        }
      })
      .catch(() => {});

    // Load conversation list
    loadConversationsList();

    // Initialize Hybrid Audio Player
    const player = new HybridAudioPlayer({
      onStart: (msgId) => {
        setActiveAudioMsgId(msgId);
        setIsAudioPlaying(true);
      },
      onEnd: () => {
        setActiveAudioMsgId(null);
        setIsAudioPlaying(false);
        setAudioProgress(0);
      },
      onPause: () => {
        setIsAudioPlaying(false);
      },
      onResume: () => {
        setIsAudioPlaying(true);
      },
      onProgress: (current, duration) => {
        if (duration > 0) {
          setAudioProgress((current / duration) * 100);
        }
      },
      onError: (err) => {
        console.warn("Audio playback notice:", err);
        setIsAudioPlaying(false);
      },
    });
    audioPlayerRef.current = player;

    // Initialize Speech Recognition Manager (instant live transcription preview)
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
    setVoiceSupported(stt.isSupported || Boolean(navigator.mediaDevices?.getUserMedia));

    // Initialize MediaRecorder for backend Sarvam STT
    const streamRecorder = new AudioStreamRecorder(
      null,
      async (audioBlob) => {
        // Send recorded audio to backend Sarvam STT endpoint
        if (audioBlob && audioBlob.size > 1000) {
          setAudioProcessing(true);
          try {
            const sttRes = await aiService.speechToText(audioBlob, language);
            if (sttRes?.success && sttRes.transcript) {
              setQuery(sttRes.transcript);
            }
          } catch (err) {
            console.warn("Backend STT fallback to browser recognition:", err);
          } finally {
            setAudioProcessing(false);
          }
        }
      },
      (errMessage) => {
        setErrorBanner(errMessage);
        setIsListening(false);
      }
    );
    streamRecorderRef.current = streamRecorder;

    return () => {
      isMounted = false;
      stt.stop();
      streamRecorder.stop();
      player.stop();
    };
  }, []);

  // Update dialect selection when language changes if current dialect is incompatible
  useEffect(() => {
    if (allDialects[language]) {
      const validCodes = allDialects[language].map((d) => d.code);
      if (!validCodes.includes(dialect)) {
        setDialect(validCodes[0] || "standard");
      }
    }
  }, [language, allDialects, dialect]);

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

    audioPlayerRef.current?.stop();
    setActiveAudioMsgId(null);
    setIsAudioPlaying(false);
    setErrorBanner(null);

    try {
      const res = await aiService.getConversation(convId);
      if (res?.success && res.conversation) {
        setActiveConversationId(convId);
        setMessages(res.conversation.messages || []);
        if (res.conversation.language) {
          setLanguage(res.conversation.language);
        }
        if (res.conversation.dialect) {
          setDialect(res.conversation.dialect);
        }
        setMobileSidebarOpen(false);
      }
    } catch (err) {
      setErrorBanner("Failed to load conversation history.");
    }
  };

  // Start New Chat
  const handleStartNewChat = () => {
    audioPlayerRef.current?.stop();
    setActiveAudioMsgId(null);
    setIsAudioPlaying(false);
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

  // Language & Dialect Change with Preference Persistence
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    aiService.updatePreferences({ preferred_language: newLang }).catch(() => {});
  };

  const handleDialectChange = (newDialect) => {
    setDialect(newDialect);
    aiService.updatePreferences({ preferred_dialect: newDialect }).catch(() => {});
  };

  const handleToggleVoiceMode = () => {
    const nextVal = !voiceMode;
    setVoiceMode(nextVal);
    if (!nextVal) {
      audioPlayerRef.current?.stop();
      setActiveAudioMsgId(null);
    }
    aiService.updatePreferences({ voice_enabled: nextVal }).catch(() => {});
  };

  // Send Question with Context & Dialect
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || query).trim();
    if (!text || sending) return;

    setErrorBanner(null);
    audioPlayerRef.current?.stop();
    setActiveAudioMsgId(null);

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
        language,
        dialect,
        voiceMode
      );

      if (response?.success) {
        const assistantMsg = {
          id: response.assistant_message_id || Date.now(),
          role: "assistant",
          message: response.message,
          language: response.language || language,
          dialect: response.dialect || dialect,
          audio: response.audio || null,
          created_at: response.created_at || new Date().toISOString(),
          context_summary: response.context_summary,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Auto-play voice if Voice Mode is active
        if (voiceMode) {
          audioPlayerRef.current?.play(
            assistantMsg.id,
            assistantMsg.message,
            assistantMsg.language,
            assistantMsg.audio
          );
        }

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
            "AI Assistant requires an API key in backend/.env (AI_API_KEY)."
        );
      } else {
        setErrorBanner(
          errData?.message ||
            "Unable to generate AI agricultural guidance right now. Please retry."
        );
      }
    } finally {
      setSending(false);
    }
  };

  // Voice Recording Toggle (Microphone Input)
  const handleToggleVoice = async () => {
    const stt = recognitionManagerRef.current;
    const recorder = streamRecorderRef.current;

    if (isListening) {
      stt?.stop();
      recorder?.stop();
      setIsListening(false);
    } else {
      setErrorBanner(null);
      // Start both audio stream recorder and live browser preview
      const recorderStarted = await recorder?.start();
      const sttStarted = stt?.start(language);
      if (recorderStarted || sttStarted) {
        setIsListening(true);
      }
    }
  };

  // Audio Playback Controls
  const handlePlayAudio = (msg) => {
    const player = audioPlayerRef.current;
    if (!player) return;

    if (activeAudioMsgId === msg.id && isAudioPlaying) {
      player.pause();
    } else if (activeAudioMsgId === msg.id && !isAudioPlaying) {
      player.resume();
    } else {
      player.play(msg.id, msg.message, msg.language || language, msg.audio);
    }
  };

  const handleReplayAudio = (msg) => {
    audioPlayerRef.current?.play(
      msg.id,
      msg.message,
      msg.language || language,
      msg.audio
    );
  };

  const handleCycleSpeed = () => {
    const speeds = [1.0, 1.2, 0.8];
    const nextIdx = (speeds.indexOf(audioSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setAudioSpeed(nextSpeed);
    audioPlayerRef.current?.setPlaybackRate(nextSpeed);
  };

  const handleCopyMessage = async (msgId, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.warn("Clipboard copy failed:", err);
    }
  };

  const activeLanguageInfo =
    languages.find((l) => l.code === language) || languages[0];

  const activeDialectInfo =
    currentLanguageDialects.find((d) => d.code === dialect) ||
    currentLanguageDialects[0];

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
                  Speak or ask a question to begin.
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
          {/* Top Bar with Language, Dialect, and Voice Mode */}
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
              {/* Language Selector */}
              <div className="ai-lang-dropdown-wrapper">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="ai-lang-dropdown"
                  title="Select regional language"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.native_name} ({l.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Regional Dialect Selector */}
              <div className="ai-dialect-dropdown-wrapper">
                <select
                  value={dialect}
                  onChange={(e) => handleDialectChange(e.target.value)}
                  className="ai-dialect-dropdown"
                  title="Select regional dialect style"
                >
                  {currentLanguageDialects.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.native_name || d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Voice Mode Toggle Button */}
              <button
                type="button"
                className={`ai-voice-mode-toggle ${voiceMode ? "active" : ""}`}
                onClick={handleToggleVoiceMode}
                title={
                  voiceMode
                    ? "Voice Mode ON (AI answers will speak aloud)"
                    : "Voice Mode OFF (Silent text mode)"
                }
              >
                {voiceMode ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>Voice {voiceMode ? "ON" : "OFF"}</span>
              </button>
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

            {/* Welcome Screen */}
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
                <h1 className="ai-welcome-title">Your Smart Farming Voice Assistant</h1>
                <p className="ai-welcome-desc">
                  Speak or type in your regional dialect ({activeLanguageInfo.native_name} - {activeDialectInfo.native_name || activeDialectInfo.name}).
                  Get personalized agronomic guidance grounded in your farm profile, weather, and soil.
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
              const isMsgPlaying = activeAudioMsgId === msg.id && isAudioPlaying;

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
                      {/* Dialect and Context Badges for AI Responses */}
                      {!isUser && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
                          {msg.dialect && msg.dialect !== "standard" && (
                            <div className="ai-msg-dialect-badge">
                              <Radio size={12} />
                              {allDialects[msg.language || language]?.find((d) => d.code === msg.dialect)?.name || msg.dialect}
                            </div>
                          )}
                          {msg.context_summary?.soil_type && (
                            <div className="ai-msg-context-tag">
                              <CheckCircle size={12} />
                              Grounded on {msg.context_summary.soil_type} &amp; Weather
                            </div>
                          )}
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

                      {/* Integrated Audio Player Bar for AI Responses */}
                      {!isUser && (
                        <div className="ai-audio-player-card">
                          <button
                            type="button"
                            className="ai-audio-play-btn"
                            onClick={() => handlePlayAudio(msg)}
                            title={isMsgPlaying ? "Pause Audio" : "Play Spoken Voice"}
                          >
                            {isMsgPlaying ? <Pause size={14} /> : <Play size={14} />}
                          </button>

                          <button
                            type="button"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "inherit",
                              display: "flex",
                              padding: "4px",
                            }}
                            onClick={() => handleReplayAudio(msg)}
                            title="Replay from start"
                          >
                            <RotateCcw size={14} />
                          </button>

                          <div className="ai-audio-progress-bar">
                            <div
                              className="ai-audio-progress-fill"
                              style={{
                                width: activeAudioMsgId === msg.id ? `${audioProgress}%` : "0%",
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            className="ai-audio-speed-btn"
                            onClick={handleCycleSpeed}
                            title="Adjust voice speed"
                          >
                            {audioSpeed}x
                          </button>

                          <span className="ai-audio-provider-tag">
                            <Volume2 size={11} />
                            {msg.audio ? "Sarvam Voice" : "Regional Voice"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Toolbar under message */}
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
                    FarmVoice AI is analyzing your crops, weather and preparing voice guidance in {activeDialectInfo.native_name || activeDialectInfo.name}...
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
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="ai-rec-dot" />
                  <span>
                    Listening in {activeLanguageInfo.native_name} ({activeDialectInfo.native_name || activeDialectInfo.name})... Speak now.
                  </span>
                </div>
                <button
                  type="button"
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

            {/* Audio Processing Pill */}
            {audioProcessing && (
              <div className="ai-voice-active-indicator" style={{ background: "#E3F2FD", borderColor: "#90CAF9", color: "#1565C0" }}>
                <span>Transcribing your spoken regional voice with AI...</span>
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
                placeholder={`Ask in ${activeLanguageInfo.native_name} or English (press mic to speak)...`}
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
                      : `Speak in ${activeLanguageInfo.name} (${activeDialectInfo.name})`
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
                Language: <strong>{activeLanguageInfo.native_name}</strong> | Dialect: <strong>{activeDialectInfo.native_name || activeDialectInfo.name}</strong>
              </span>
              <span>
                Voice Mode: <strong>{voiceMode ? "Enabled (Spoken Responses)" : "Disabled"}</strong>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
