"""FarmVoice AI - Language Detection Service.

Detects the regional language and script used in farmer queries
via Unicode block frequency analysis and vocabulary heuristics.
Supports Kannada, Hindi, Telugu, Tamil, Malayalam, Marathi,
Bengali, Punjabi, and English (including transliterated mixed phrases).
"""

import re
import unicodedata
from app.services.language_service import LanguageService

# Unicode script ranges for supported regional Indian languages
UNICODE_RANGES = {
    "kn": (0x0C80, 0x0CFF, "Kannada"),
    "te": (0x0C00, 0x0C7F, "Telugu"),
    "ta": (0x0B80, 0x0BFF, "Tamil"),
    "ml": (0x0D00, 0x0D7F, "Malayalam"),
    "bn": (0x0980, 0x09FF, "Bengali"),
    "pa": (0x0A00, 0x0A7F, "Gurmukhi"),
}

# Devanagari block covers both Hindi and Marathi
DEVANAGARI_RANGE = (0x0900, 0x097F)

# Distinct Marathi markers & words
MARATHI_MARKERS = {
    "आहे", "नाही", "शेतकरी", "पिकाला", "पिक", "कसे", "काय", "झाले",
    "करावे", "पाणी", "जमीन", "औषध", "कीड", "रोग", "हवामान", "खत", "ळ"
}

# Distinct Hindi markers & words
HINDI_MARKERS = {
    "है", "नहीं", "किसान", "फसल", "कैसे", "क्या", "करना", "पानी",
    "जमीन", "दवा", "कीट", "रोग", "मौसम", "खाद", "खेत", "उपाय"
}

# Transliterated conversational keywords (Kanglish / Hinglish / etc.)
TRANSLITERATED_PATTERNS = {
    "kn": [
        r"\b(namaskara|namaskaram|bele|jameen|bhoomi|neeru|gobbara|rogo|kitta|enu|yava|hege|madodu|madbeku|kodbeku|aagide|adike|tumbu|marada|hullu)\b",
    ],
    "hi": [
        r"\b(namaste|kisan|fasal|kheti|paani|beej|keeda|dawai|khad|kya|kaise|karein|karna|hoga|batao|khet|mitti|upay)\b",
    ],
    "te": [
        r"\b(namaskaram|pantalu|panta|bhumi|neellu|eruvulu|purugu|tegulu|ela|cheyali|emi|cheppandi)\b",
    ],
    "ta": [
        r"\b(vanakkam|payir|nilam|thanneer|uram|poochi|nooi|eppadi|seivathu|enna|sollunga)\b",
    ],
    "ml": [
        r"\b(namaskaram|krishi|vila|mannu|vellam|valam|keeda|engane|cheyyanam|enthu)\b",
    ],
    "mr": [
        r"\b(namaskar|shetkari|peek|sheti|paani|khat|keed|kasa|kay|karaycha|sangaa)\b",
    ],
    "bn": [
        r"\b(nomoshkar|krishok|foshol|mati|jol|saar|poka|rog|kivabe|korbo|ki)\b",
    ],
    "pa": [
        r"\b(sat sri akal|fasal|kheti|pani|khaad|keede|kivein|kariye|dasso|zameen)\b",
    ],
}


class LanguageDetectionService:
    """Detects query language and script."""

    @staticmethod
    def detect_language(text, default_lang="en"):
        """Identify language from input text.

        Returns a dictionary:
            {
                "detected_language": "kn",
                "confidence": 0.95,
                "script": "Kannada",
                "is_transliterated": False,
                "matched_by": "unicode_range"
            }
        """
        if not text or not text.strip():
            fallback = LanguageService.normalize_language_code(default_lang)
            return {
                "detected_language": fallback,
                "confidence": 0.5,
                "script": "Unknown",
                "is_transliterated": False,
                "matched_by": "default_fallback",
            }

        cleaned = text.strip()

        # 1. Unicode script count
        counts = {lang: 0 for lang in UNICODE_RANGES}
        devanagari_count = 0
        total_letters = 0

        for ch in cleaned:
            if not ch.isalnum():
                continue
            code = ord(ch)
            total_letters += 1

            # Check dedicated Indian scripts
            matched = False
            for lang, (start, end, _) in UNICODE_RANGES.items():
                if start <= code <= end:
                    counts[lang] += 1
                    matched = True
                    break

            if not matched and (DEVANAGARI_RANGE[0] <= code <= DEVANAGARI_RANGE[1]):
                devanagari_count += 1

        # Check dedicated scripts
        if total_letters > 0:
            for lang, count in counts.items():
                if count / total_letters > 0.25:
                    return {
                        "detected_language": lang,
                        "confidence": round(count / total_letters, 2),
                        "script": UNICODE_RANGES[lang][2],
                        "is_transliterated": False,
                        "matched_by": "unicode_script",
                    }

            # Check Devanagari (distinguish Hindi vs Marathi)
            if devanagari_count / total_letters > 0.25:
                # Check Marathi specific character 'ळ'
                if "ळ" in cleaned:
                    return {
                        "detected_language": "mr",
                        "confidence": 0.95,
                        "script": "Devanagari (Marathi)",
                        "is_transliterated": False,
                        "matched_by": "marathi_specific_char",
                    }

                words = set(re.findall(r"[\u0900-\u097F]+", cleaned))
                marathi_hits = len(words.intersection(MARATHI_MARKERS))
                hindi_hits = len(words.intersection(HINDI_MARKERS))

                if marathi_hits > hindi_hits:
                    lang = "mr"
                    script_name = "Devanagari (Marathi)"
                else:
                    lang = "hi"
                    script_name = "Devanagari (Hindi)"

                return {
                    "detected_language": lang,
                    "confidence": 0.9,
                    "script": script_name,
                    "is_transliterated": False,
                    "matched_by": "devanagari_lexicon",
                }

        # 2. Transliteration / Romanized Latin Detection (e.g. "namaskara nanage bele bagge helri")
        lower_text = cleaned.lower()
        best_translit = None
        best_hits = 0

        for lang, patterns in TRANSLITERATED_PATTERNS.items():
            hits = 0
            for pattern in patterns:
                matches = re.findall(pattern, lower_text, re.IGNORECASE)
                hits += len(matches)

            if hits > best_hits:
                best_hits = hits
                best_translit = lang

        if best_hits >= 1 and best_translit:
            return {
                "detected_language": best_translit,
                "confidence": 0.85,
                "script": "Latin (Transliterated)",
                "is_transliterated": True,
                "matched_by": "transliterated_lexicon",
            }

        # 3. Pure English detection if mostly ASCII words
        ascii_words = re.findall(r"[a-zA-Z]+", cleaned)
        if len(ascii_words) >= 2:
            return {
                "detected_language": "en",
                "confidence": 0.8,
                "script": "Latin",
                "is_transliterated": False,
                "matched_by": "english_text",
            }

        # 4. Fallback to farmer preference
        fallback_code = LanguageService.normalize_language_code(default_lang)
        return {
            "detected_language": fallback_code,
            "confidence": 0.5,
            "script": "Unknown",
            "is_transliterated": False,
            "matched_by": "default_fallback",
        }
