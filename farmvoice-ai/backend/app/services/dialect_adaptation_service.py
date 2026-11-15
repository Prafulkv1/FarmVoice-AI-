"""FarmVoice AI - Regional Dialect & Slang Adaptation Service.

Provides linguistic rules, conversational expressions, respectful honorifics,
and tailored system prompt guidelines for Indian regional dialects.
Supports Kannada (North, South, Coastal), Hindi (Standard, Eastern, Western),
Telugu (Standard, Telangana, Rayalaseema), Tamil, Malayalam, Marathi,
Bengali, Punjabi, and Indian Agricultural English.
"""

DIALECT_REGISTRY = {
    "kn": {
        "standard": {
            "name": "Standard Kannada",
            "native_name": "ಶಿಷ್ಟ ಕನ್ನಡ",
            "region": "Karnataka Statewide",
            "greeting": "ನಮಸ್ಕಾರ",
            "instructions": "Use polite, clear, standard literary Kannada (ಶಿಷ್ಟ ಕನ್ನಡ). Keep language simple and respectful.",
            "sample_words": ["ಬೆಳೆ", "ಜಮೀನು", "ನೀರು", "ಗೊಬ್ಬರ", "ಚೆನ್ನಾಗಿದೆ", "ಮಾಡಿ"],
        },
        "north_karnataka": {
            "name": "North Karnataka (Uttara Karnataka)",
            "native_name": "ಉತ್ತರ ಕರ್ನಾಟಕ ಕನ್ನಡ",
            "region": "Bagalkote, Belagavi, Vijayapura, Dharwad, Kalaburagi, Gadag",
            "greeting": "ನಮಸ್ಕಾರ್ರೀ",
            "instructions": (
                "Adopt authentic North Karnataka (ಉತ್ತರ ಕರ್ನಾಟಕ) farmer conversational tone. "
                "Use respectful markers like 'ರೀ', 'ಏನ್ರಿ', 'ಹೌದ್ರಿ'. "
                "Use familiar regional vocabulary naturally: 'ಬೆಳಿ' for ಬೆಳೆ, 'ಜಮೀನ್ನ್ಯಾಗ' / 'ಹೊಲದಾಗ' for ಹೊಲದಲ್ಲಿ, "
                "'ಚಲೋ ಐತಿ' for ಚೆನ್ನಾಗಿದೆ, 'ಹ್ಯಾಗ ಮಾಡ್ಬೇಕ್ರಿ' for ಹೇಗೆ ಮಾಡಬೇಕು, 'ಆಗತೈತಿ' for ಆಗುತ್ತದೆ, 'ಬಹಳ ಚಲೋ'. "
                "Keep the tone warm, grounded, and like a trusted local farmer elder."
            ),
            "sample_words": ["ರೀ", "ಏನ್ರಿ", "ಚಲೋ ಐತಿ", "ಹೌದ್ರಿ", "ಜಮೀನ್ನ್ಯಾಗ", "ಹೊಲದಾಗ", "ಬೆಳಿ"],
        },
        "south_karnataka": {
            "name": "South Karnataka (Hale Mysuru)",
            "native_name": "ದಕ್ಷಿಣ ಕರ್ನಾಟಕ ಕನ್ನಡ",
            "region": "Mandya, Mysuru, Hassan, Chamarajanagar, Bengaluru Rural",
            "greeting": "ನಮಸ್ಕಾರ ಸ್ವಾಮಿ",
            "instructions": (
                "Adopt South Karnataka / Old Mysuru regional conversational tone. "
                "Use warm friendly expressions like 'ಕಣ್ರೀ', 'ಮಾಡ್ರಪ್ಪಾ', 'ಆಯ್ತಾ', 'ತೋಟದಲ್ಲಿ', 'ನೋಡಿ ಸ್ವಾಮಿ'. "
                "Keep sentences clear and rhythmic."
            ),
            "sample_words": ["ಕಣ್ರೀ", "ಮಾಡ್ರಪ್ಪಾ", "ಸ್ವಾಮಿ", "ಚೆನ್ನಾಗಿದೆ", "ತೋಟದಲ್ಲಿ"],
        },
        "coastal_karnataka": {
            "name": "Coastal Karnataka (Karavali)",
            "native_name": "ಕರಾವಳಿ ಕನ್ನಡ",
            "region": "Dakshina Kannada, Udupi, Uttara Kannada",
            "greeting": "ನಮಸ್ಕಾರ ಮಾರೆರೆ",
            "instructions": (
                "Adopt Coastal Karnataka (ಕರಾವಳಿ) conversational warmth with mild regional inflections. "
                "Use terms familiar to coastal plantation and paddy farmers."
            ),
            "sample_words": ["ಮಾರೆರೆ", "ತೋಟೊಡು", "ಬೆಳೆ", "ಸರಿಯಾಗಿ"],
        },
    },
    "hi": {
        "standard": {
            "name": "Standard Hindi",
            "native_name": "खड़ी बोली / मानक हिन्दी",
            "region": "North India",
            "greeting": "नमस्ते किसान भाई",
            "instructions": "Use polite, simple standard Hindi (मानक हिन्दी). Avoid overly formal Sanskritized or Persianized words.",
            "sample_words": ["फसल", "खेत", "सिंचाई", "खाद", "दवा", "उपाय"],
        },
        "eastern_hindi": {
            "name": "Eastern Hindi / Awadhi-Bhojpuri Touch",
            "native_name": "पूर्वी हिन्दी / अवधी टच",
            "region": "Eastern UP, Bihar, Jharkhand",
            "greeting": "राम राम भैया",
            "instructions": (
                "Use friendly Eastern Hindi tone. Address the farmer respectfully with 'किसान भैया' or 'भाई जी'. "
                "Use colloquial agrarian phrasing like 'खेतवा में', 'बढ़िया पैदावार', 'ध्यान रखीं'."
            ),
            "sample_words": ["भैया", "खेतवा", "बढ़िया", "खाद-पानी"],
        },
        "western_hindi": {
            "name": "Western Hindi / Dehati",
            "native_name": "पश्चिमी हिन्दी / देहाती",
            "region": "Western UP, Haryana borders",
            "greeting": "राम राम जी",
            "instructions": "Use Western Hindi / rustic conversational tone with respectful 'जी', direct practical tips and clear instructions.",
            "sample_words": ["भाई जी", "खेत", "बढ़िया", "पानी"],
        },
    },
    "te": {
        "standard": {
            "name": "Standard Telugu",
            "native_name": "ప్రామాణిక తెలుగు",
            "region": "Andhra Pradesh & Telangana",
            "greeting": "నమస్కారం రైతు సోదరా",
            "instructions": "Use respectful, natural standard Telugu suitable for all regions.",
            "sample_words": ["పంట", "భూమి", "ఎరువులు", "నీటిపారుదల", "దిగుబడి"],
        },
        "telangana": {
            "name": "Telangana Dialect",
            "native_name": "తెలంగాణ మాండలికం",
            "region": "Telangana (Warangal, Karimnagar, Nalgonda, etc.)",
            "greeting": "నమస్తే రైతన్నా",
            "instructions": (
                "Adopt genuine Telangana farmer conversational expressions. "
                "Use respectful and warm words like 'రైతన్నా', 'మస్తుగుంది', 'చేయాలె', 'చేన్ల', 'ఎట్లంటే'."
            ),
            "sample_words": ["రైతన్నా", "మస్తు", "చేయాలె", "చేను", "ఎట్లంటే"],
        },
        "rayalaseema": {
            "name": "Rayalaseema / Coastal Andhra",
            "native_name": "రాయలసీమ / కోస్తా ఆంధ్ర",
            "region": "Kurnool, Anantapur, Kadapa, Chittoor, Krishna",
            "greeting": "నమస్కారమండీ",
            "instructions": "Use Rayalaseema & Coastal Andhra polite phrasing with respectful 'అండీ', 'పొలంలో', 'బాగుంటుంది'.",
            "sample_words": ["అండీ", "పొలం", "బాగుంటుంది", "రైతు"],
        },
    },
    "ta": {
        "standard": {
            "name": "Standard Tamil",
            "native_name": "பொதுத் தமிழ்",
            "region": "Tamil Nadu Statewide",
            "greeting": "வணக்கம் விவசாய தோழரே",
            "instructions": "Use clear, respectful everyday spoken Tamil (எளிமையான தமிழ்).",
            "sample_words": ["பயிர்", "நிலம்", "உரம்", "பாசனம்", "விளைச்சல்"],
        },
        "kongu": {
            "name": "Kongu Tamil",
            "native_name": "கொங்குத் தமிழ்",
            "region": "Coimbatore, Erode, Salem, Tiruppur",
            "greeting": "வணக்கமுங்க",
            "instructions": "Use Kongu regional respectful markers like 'ஏனுங்க', 'பண்ணுங்க', 'பாத்துக்கங்க'.",
            "sample_words": ["ஏனுங்க", "பண்ணுங்க", "தோட்டம்", "பயிர்"],
        },
        "madurai": {
            "name": "Southern / Madurai Tamil",
            "native_name": "தென் மாவட்டத் தமிழ்",
            "region": "Madurai, Dindigul, Theni, Tirunelveli",
            "greeting": "வணக்கம் தம்பி",
            "instructions": "Use warm Southern Tamil farmer tone with direct, friendly, and practical phrasing.",
            "sample_words": ["தம்பி", "வயல்ல", "நல்லா", "விவசாயம்"],
        },
    },
    "ml": {
        "standard": {
            "name": "Standard Malayalam",
            "native_name": "സാധാരണ മലയാളം",
            "region": "Kerala Statewide",
            "greeting": "നമസ്കാരം",
            "instructions": "Use natural, conversational Malayalam tailored to Kerala agricultural conditions.",
            "sample_words": ["വിള", "മണ്ണ്", "വളം", "നന", "വിളവ്"],
        },
        "malabar": {
            "name": "Malabar Regional Malayalam",
            "native_name": "മലബാർ മലയാളം",
            "region": "Kozhikode, Kannur, Wayanad, Malappuram",
            "greeting": "നമസ്കാരം ചങ്ങാതി",
            "instructions": "Use warm Northern Kerala / Malabar regional phrasing and friendly agricultural terms.",
            "sample_words": ["ചങ്ങാതി", "തോട്ടം", "നല്ല വിളവ്"],
        },
    },
    "mr": {
        "standard": {
            "name": "Standard Marathi",
            "native_name": "प्रमाण मराठी",
            "region": "Maharashtra Statewide",
            "greeting": "नमस्कार शेतकरी मित्र",
            "instructions": "Use polite, simple, and encouraging standard Marathi.",
            "sample_words": ["पीक", "जमीन", "खत", "पाणी", "उत्पादन"],
        },
        "marathwada_vidarbha": {
            "name": "Marathwada / Varhadi Marathi",
            "native_name": "मराठवाडा व वऱ्हाडी बोली",
            "region": "Nanded, Latur, Akola, Amravati, Yavatmal",
            "greeting": "राम राम शेतकरी दादा",
            "instructions": "Adopt Varhadi / Marathwada rustic expressions with 'शेतकरी दादा', 'लय भारी', 'शेतात'.",
            "sample_words": ["शेतकरी दादा", "लय भारी", "वावरात", "पाणी"],
        },
    },
    "bn": {
        "standard": {
            "name": "Standard Bengali",
            "native_name": "মান্য বাংলা",
            "region": "West Bengal Statewide",
            "greeting": "নমস্কার কৃষক ভাই",
            "instructions": "Use polite, clear Bengali suitable for agricultural advisory.",
            "sample_words": ["ফসল", "জমি", "সার", "সেচ", "ফলন"],
        },
        "colloquial": {
            "name": "Rural Colloquial Bengali",
            "native_name": "পল্লী বাংলা",
            "region": "Rural Bengal districts",
            "greeting": "নমস্কার দাদা",
            "instructions": "Use warm, conversational Bengali addressing the farmer respectfully with 'কৃষক ভাই' or 'দাদা'.",
            "sample_words": ["দাদা", "জমিতে", "ভালো ফলন", "কীটনাশক"],
        },
    },
    "pa": {
        "standard": {
            "name": "Majhi / Standard Punjabi",
            "native_name": "ਮਾਝੀ / ਮਿਆਰੀ ਪੰਜਾਬੀ",
            "region": "Punjab Statewide",
            "greeting": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰ ਜੀ",
            "instructions": "Use warm, respectful Punjabi with terms like 'ਕਿਸਾਨ ਵੀਰ ਜੀ', 'ਵਧੀਆ ਝਾੜ'.",
            "sample_words": ["ਕਿਸਾਨ ਵੀਰ", "ਫਸਲ", "ਜ਼ਮੀਨ", "ਖਾਦ", "ਝਾੜ"],
        },
        "malwai": {
            "name": "Malwai Punjabi",
            "native_name": "ਮਲਵਈ ਪੰਜਾਬੀ",
            "region": "Bathinda, Sangrur, Mansa, Patiala",
            "greeting": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਬਾਈ ਜੀ",
            "instructions": "Use Malwai Punjabi conversational inflections with 'ਬਾਈ ਜੀ', 'ਖੇਤਾਂ ਵਿੱਚ'.",
            "sample_words": ["ਬਾਈ ਜੀ", "ਖੇਤ", "ਵਧੀਆ", "ਪਾਣੀ"],
        },
    },
    "en": {
        "standard": {
            "name": "Indian Agricultural English",
            "native_name": "Indian Agri-English",
            "region": "All India",
            "greeting": "Namaste Farmer",
            "instructions": (
                "Use plain, clear English with familiar Indian agricultural terminology "
                "(e.g., kharif/rabi seasons, panchagavya, neem cake, farmyard manure, bunding, drip fertigation). "
                "Keep sentences concise and easy to understand when read aloud."
            ),
            "sample_words": ["crop", "soil", "kharif", "rabi", "manure", "yield"],
        },
    },
}


REGIONAL_DIALECT_REGISTRY = DIALECT_REGISTRY

DIALECT_ALIASES = {
    "uttara_karnataka": "north_karnataka",
    "dakshina_karnataka": "south_karnataka",
    "karavali": "coastal_karnataka",
    "rural_bengali": "colloquial",
    "marathwada_varhadi": "marathwada_vidarbha",
    "rayalaseema_coastal": "rayalaseema",
    "madurai": "southern",
}


class DialectAdaptationService:
    """Provides regional dialect metadata and prompt enhancement rules."""

    @staticmethod
    def get_supported_dialects_for_language(lang_code):
        """Return list of supported dialect options for given language."""
        lang = lang_code.lower().strip() if lang_code else "en"
        dialects = DIALECT_REGISTRY.get(lang, DIALECT_REGISTRY["en"])
        return [
            {
                "code": code,
                "dialect_code": code,
                "name": info["name"],
                "native_name": info["native_name"],
                "region": info["region"],
                "greeting": info["greeting"],
                "sample_words": info["sample_words"],
            }
            for code, info in dialects.items()
        ]

    @staticmethod
    def get_all_dialects_grouped():
        """Return all supported dialects grouped by language code."""
        result = {}
        for lang_code, dialects in DIALECT_REGISTRY.items():
            result[lang_code] = [
                {
                    "code": code,
                    "dialect_code": code,
                    "name": info["name"],
                    "native_name": info["native_name"],
                    "region": info["region"],
                    "greeting": info["greeting"],
                }
                for code, info in dialects.items()
            ]
        return result

    @staticmethod
    def get_grouped_dialects():
        """Alias for get_all_dialects_grouped."""
        return DialectAdaptationService.get_all_dialects_grouped()

    @staticmethod
    def normalize_dialect(lang_code, dialect_code):
        """Verify and return valid dialect code for language, default to 'standard'."""
        lang = lang_code.lower().strip() if lang_code else "en"
        dialects = DIALECT_REGISTRY.get(lang, DIALECT_REGISTRY["en"])
        if not dialect_code:
            return "standard"
        cleaned = str(dialect_code).strip().lower()
        if cleaned in dialects:
            return cleaned
        # Check alias map
        aliased = DIALECT_ALIASES.get(cleaned)
        if aliased and aliased in dialects:
            return aliased
        return "standard"

    @staticmethod
    def get_dialect_config(lang_code, dialect_code="standard"):
        """Return dictionary info for dialect or standard fallback."""
        lang = lang_code.lower().strip() if lang_code else "en"
        valid_dialect = DialectAdaptationService.normalize_dialect(lang, dialect_code)
        info = DIALECT_REGISTRY.get(lang, DIALECT_REGISTRY["en"]).get(valid_dialect)
        if not info:
            info = DIALECT_REGISTRY.get(lang, DIALECT_REGISTRY["en"])["standard"]
            valid_dialect = "standard"
        config = dict(info)
        config["dialect_code"] = valid_dialect
        return config

    @staticmethod
    def get_dialect_instructions(lang_code, dialect_code="standard"):
        """Get prompt adaptation directives for given language and dialect."""
        lang = lang_code.lower().strip() if lang_code else "en"
        valid_dialect = DialectAdaptationService.normalize_dialect(lang, dialect_code)
        info = DIALECT_REGISTRY.get(lang, DIALECT_REGISTRY["en"]).get(valid_dialect)
        if not info:
            info = DIALECT_REGISTRY.get(lang, DIALECT_REGISTRY["en"])["standard"]
        return info["instructions"]
