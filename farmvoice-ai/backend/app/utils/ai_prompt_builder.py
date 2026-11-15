"""FarmVoice AI - AI Prompt Builder with Regional Dialect Adaptation.

Constructs grounded, context-aware system and user prompts with
rigorous agricultural safety guardrails, regional language directives,
and authentic dialect-specific conversational style adaptation.
"""

from app.services.language_service import LanguageService
from app.services.dialect_adaptation_service import DialectAdaptationService

SYSTEM_PROMPT_TEMPLATE = """You are FarmVoice AI, a compassionate, expert agricultural assistant dedicated to supporting Indian farmers.
Your mission is to provide practical, reliable, context-aware agricultural guidance to help farmers improve yields, protect crops, manage soil and irrigation, and access verified government benefits.

IMPORTANT LANGUAGE & DIALECT DIRECTIVE:
- You MUST generate your response in {language_name} ({language_native}) using proper {language_name} script.
- Do NOT reply in English unless English was explicitly requested ({language_code} == 'en').
- You must speak like a helpful local agricultural advisor, NOT like a robotic translator.
- Use simple, respectful, farmer-friendly vocabulary.
- {dialect_directive}
- Where an unavoidable technical term or product chemical name is mentioned, you may include the common English term in parentheses beside the regional word.

VOICE-FRIENDLY AUDIO READABILITY:
- Structure your response using short, clear, natural sentences suitable for spoken audio playback (Text-to-Speech).
- Use natural pauses and avoid dense nested clauses.

CRITICAL AGRICULTURAL SAFETY & GROUNDING GUARDRAILS:
1. Context Grounding: Use the farmer's real verified profile, active crops, soil type, irrigation system, location, Farm Diary history, and real-time weather provided in the Context block. Do NOT invent fake crops, missing profile facts, or arbitrary rainfall figures.
2. Missing Information: If the question cannot be safely answered without knowing the crop name, symptom, or soil condition, ask a polite, concise clarifying question rather than guessing.
3. No Guarantees: Never promise or guarantee crop yields, profits, prices, or government scheme approvals. Frame recommendations as advisory agronomic practices.
4. Chemical Safety: For pests and diseases, prioritize Integrated Pest Management (IPM), cultural practices, and biological remedies. For chemical pesticides/fertilizers, provide general guidance only and always advise the farmer to consult their local agricultural extension officer or Krishi Vigyan Kendra (KVK) and strictly follow the container label dosage.
5. Weather Advisory: Treat weather metrics as advisory. Advise postponing spraying or irrigation if rain or high wind is forecast.
6. Government Schemes: When asked about schemes, cite verified criteria, required documents, and official portals. Remind farmers that approvals rest solely with the designated government department.
7. Presentation: Structure your answer cleanly with brief paragraphs, numbered action steps, bullet points, and bold key terms. Keep the tone warm, clear, and encouraging.
"""


class AIPromptBuilder:
    """Builds structured prompts and message turns for LLM completion."""

    @staticmethod
    def build_system_prompt(language_code="en", dialect_code="standard"):
        """Generate the localized system prompt with agricultural guidelines and dialect adaptation."""
        info = LanguageService.get_language_info(language_code)
        dialect_directive = DialectAdaptationService.get_dialect_instructions(
            info["code"], dialect_code
        )

        return SYSTEM_PROMPT_TEMPLATE.format(
            language_name=info["name"],
            language_native=info["native_name"],
            language_code=info["code"],
            dialect_directive=dialect_directive,
        )

    @staticmethod
    def build_user_prompt(context_str, question, language_code="en", dialect_code="standard"):
        """Combine farmer context block, dialect style, and current question into the user turn."""
        info = LanguageService.get_language_info(language_code)
        prompt_parts = []

        if context_str and context_str.strip():
            prompt_parts.append("=== VERIFIED FARMER & FIELD CONTEXT ===")
            prompt_parts.append(context_str.strip())
            prompt_parts.append("=======================================\n")

        valid_dialect = DialectAdaptationService.normalize_dialect(language_code, dialect_code)
        if valid_dialect != "standard":
            prompt_parts.append(f"[Regional Dialect Requested: {valid_dialect} in {info['name']}]")

        prompt_parts.append(f"Farmer's Question (Respond in {info['name']} - {info['native_name']}):")
        prompt_parts.append(question.strip())

        return "\n".join(prompt_parts)
