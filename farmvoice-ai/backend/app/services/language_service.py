"""FarmVoice AI - Language Service.

Manages the 9 supported regional Indian languages, language codes,
native script labels, and BCP-47 speech recognition/synthesis tags.
"""

SUPPORTED_LANGUAGES = [
    {
        "code": "kn",
        "name": "Kannada",
        "native_name": "ಕನ್ನಡ",
        "speech_code": "kn-IN",
        "welcome": "ನಮಸ್ಕಾರ {name}! ನಾನು ನಿಮ್ಮ ಫಾರ್ಮ್‌ವಾಯ್ಸ್ ಕೃಷಿ ಸಲಹೆಗಾರ. ಬೆಳೆ, ಹವಾಮಾನ, ಕೀಟ ಬಾಧೆ ಅಥವಾ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ನಿಮ್ಮ ಮಾತೃಭಾಷೆಯಲ್ಲಿ ಕೇಳಿ.",
    },
    {
        "code": "hi",
        "name": "Hindi",
        "native_name": "हिन्दी",
        "speech_code": "hi-IN",
        "welcome": "नमस्ते {name}! मैं आपका फार्मवॉयस एआई कृषि सहायक हूँ। फसल, मौसम, कीट प्रबंधन या सरकारी योजनाओं के बारे में अपनी भाषा में पूछें।",
    },
    {
        "code": "te",
        "name": "Telugu",
        "native_name": "తెలుగు",
        "speech_code": "te-IN",
        "welcome": "నమస్కారం {name}! నేను మీ ఫార్మ్‌వాయిస్ AI వ్యవసాయ సహాయకుడిని. పంటలు, వాతావరణం, తెగుళ్ల నివారణ లేదా ప్రభుత్వ పథకాల గురించి మీ భాషలో అడగండి.",
    },
    {
        "code": "ta",
        "name": "Tamil",
        "native_name": "தமிழ்",
        "speech_code": "ta-IN",
        "welcome": "வணக்கம் {name}! நான் உங்கள் பார்ம்வாய்ஸ் AI வேளாண் உதவியாளர். பயிர், வானிலை, பூச்சி மேலாண்மை அல்லது அரசு திட்டங்கள் குறித்து கேளுங்கள்.",
    },
    {
        "code": "ml",
        "name": "Malayalam",
        "native_name": "മലയാളം",
        "speech_code": "ml-IN",
        "welcome": "നമസ്കാരം {name}! ഞാൻ നിങ്ങളുടെ ഫാംവോയ്സ് AI കാർഷിക സഹായിയാണ്. വിളകൾ, കാലാവസ്ഥ, കീട നിയന്ത്രണം അല്ലെങ്കിൽ സർക്കാർ പദ്ധതികളെക്കുറിച്ച് ചോദിക്കാം.",
    },
    {
        "code": "mr",
        "name": "Marathi",
        "native_name": "मराठी",
        "speech_code": "mr-IN",
        "welcome": "नमस्कार {name}! मी तुमचा फार्मव्हॉईस AI शेती सल्लागार आहे. पिके, हवामान, कीड व्यवस्थापन किंवा सरकारी योजनांबद्दल विचारा.",
    },
    {
        "code": "bn",
        "name": "Bengali",
        "native_name": "বাংলা",
        "speech_code": "bn-IN",
        "welcome": "নমস্কার {name}! আমি আপনার ফার্মভয়েস এআই কৃষি সহায়ক। ফসল, আবহাওয়া, রোগ ও পোকা দমন বা সরকারি প্রকল্প সম্পর্কে আপনার ভাষায় প্রশ্ন করুন।",
    },
    {
        "code": "pa",
        "name": "Punjabi",
        "native_name": "ਪੰਜਾਬੀ",
        "speech_code": "pa-IN",
        "welcome": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ {name}! ਮੈਂ ਤੁਹਾਡਾ ਫਾਰਮਵੌਇਸ AI ਖੇਤੀ ਸਹਾਇਕ ਹਾਂ। ਫਸਲਾਂ, ਮੌਸਮ, ਕੀੜੇ-ਮਕੌੜੇ ਜਾਂ ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਬਾਰੇ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਪੁੱਛੋ।",
    },
    {
        "code": "en",
        "name": "English",
        "native_name": "English",
        "speech_code": "en-IN",
        "welcome": "Namaste {name}! I am your FarmVoice AI agricultural assistant. Ask me questions about crop selection, pest control, weather impact, or government schemes in your preferred language.",
    },
]

# Map lookup by lowercase code or name
_LANG_BY_CODE = {l["code"]: l for l in SUPPORTED_LANGUAGES}
_LANG_BY_NAME = {l["name"].lower(): l for l in SUPPORTED_LANGUAGES}


class LanguageService:
    """Helper utilities for multilingual routing and normalization."""

    @staticmethod
    def get_supported_languages():
        """Return list of all supported languages."""
        return SUPPORTED_LANGUAGES

    @staticmethod
    def normalize_language_code(lang_input):
        """Map language input (name or code) to valid 2-letter ISO code. Defaults to 'en'."""
        if not lang_input:
            return "en"
        cleaned = str(lang_input).strip().lower()
        if cleaned in _LANG_BY_CODE:
            return cleaned
        if cleaned in _LANG_BY_NAME:
            return _LANG_BY_NAME[cleaned]["code"]
        # Prefix match (e.g., 'kn-in' -> 'kn')
        if "-" in cleaned:
            prefix = cleaned.split("-")[0]
            if prefix in _LANG_BY_CODE:
                return prefix
        return "en"

    @staticmethod
    def get_language_info(lang_code):
        """Retrieve language metadata for given code."""
        code = LanguageService.normalize_language_code(lang_code)
        return _LANG_BY_CODE.get(code, _LANG_BY_CODE["en"])

    @staticmethod
    def get_welcome_message(lang_code, farmer_name="Farmer"):
        """Generate localized welcome message for new chats."""
        info = LanguageService.get_language_info(lang_code)
        template = info.get("welcome", _LANG_BY_CODE["en"]["welcome"])
        return template.format(name=farmer_name or "Farmer")
