"""FarmVoice AI - Verified Government Schemes Service.

Maintains verified official central and state agricultural schemes,
eligibility rules, benefits, required documents, and official portal URLs.
"""

VERIFIED_SCHEMES = [
    {
        "id": "pm-kisan",
        "name": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
        "category": "Direct Benefit Transfer",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "benefit": "₹6,000 per year paid in 3 equal installments of ₹2,000 directly into bank accounts.",
        "eligibility": "All landholding farmer families having cultivable landholding in their names. Institutional landholders, income tax payees, and constitutional post holders are excluded.",
        "documents": "Aadhaar Card, Land ownership document (7/12, RTC, Patta), Active Bank Account linked with Aadhaar.",
        "how_to_apply": "Register online at pmkisan.gov.in (Farmer Corner) or visit the nearest Common Service Centre (CSC) or local agriculture office.",
        "link": "https://pmkisan.gov.in",
        "keywords": ["pm kisan", "kisan samman", "6000", "financial aid", "installment", "dbt", "subsidy", "ಯೋಜನೆ", "ಕಿಸಾನ್"],
    },
    {
        "id": "pmfby",
        "name": "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
        "category": "Crop Insurance",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "benefit": "Comprehensive financial support for crop loss/damage due to natural calamities, pests & diseases. Low premium: 2% for Kharif crops, 1.5% for Rabi food/oilseeds, 5% for commercial/horticultural crops.",
        "eligibility": "All farmers growing notified crops in notified areas, including sharecroppers and tenant farmers.",
        "documents": "Land record proof (RoR/Patta), Sowing certificate / declaration, Bank passbook copy, Aadhaar card.",
        "how_to_apply": "Apply through the National Crop Insurance Portal (pmfby.gov.in), authorized banks, or CSC centers before the seasonal cutoff deadline.",
        "link": "https://pmfby.gov.in",
        "keywords": ["pmfby", "crop insurance", "fasal bima", "loss", "flood", "drought", "compensation", "ವಿಮೆ", "ಬೆಳೆ ವಿಮೆ"],
    },
    {
        "id": "kcc",
        "name": "KCC (Kisan Credit Card Scheme)",
        "category": "Credit & Loans",
        "ministry": "Department of Financial Services / NABARD",
        "benefit": "Short-term credit for crop cultivation and post-harvest expenses up to ₹3,00,000 at an effective interest rate of 4% per annum (with prompt repayment incentive).",
        "eligibility": "All farmers - individuals, joint borrowers, tenant farmers, oral lessees, and Self Help Groups (SHGs).",
        "documents": "Duly filled application form, Identity & address proof (Aadhaar/Voter ID), Land holding documents, Crop pattern certificate.",
        "how_to_apply": "Apply at any commercial bank, regional rural bank (RRB), or cooperative bank branch, or online via myscheme.gov.in.",
        "link": "https://myscheme.gov.in/schemes/kcc",
        "keywords": ["kcc", "credit card", "loan", "interest subsidy", "bank loan", "credit", "ಸಾಲ", "ಕಾರ್ಡ್"],
    },
    {
        "id": "soil-health",
        "name": "Soil Health Card Scheme",
        "category": "Soil & Nutrients",
        "ministry": "Department of Agriculture and Cooperation",
        "benefit": "Free testing of 12 macro and micro nutrients (N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, OC) every 2 years with customized crop-wise fertilizer dosage recommendations.",
        "eligibility": "All agricultural landowners across all Indian states and Union Territories.",
        "documents": "Farmer Aadhaar, land parcel details (Survey number/RTC), soil sample collection receipt.",
        "how_to_apply": "Contact local agriculture extension officers, Krishi Vigyan Kendra (KVK), or register on soilhealth.dac.gov.in.",
        "link": "https://soilhealth.dac.gov.in",
        "keywords": ["soil health", "soil test", "fertilizer card", "micronutrients", "ಮಣ್ಣು", "ಮಣ್ಣಿನ ಆರೋಗ್ಯ"],
    },
    {
        "id": "pmksy",
        "name": "PMKSY (Per Drop More Crop - PM Krishi Sinchayee Yojana)",
        "category": "Irrigation Subsidies",
        "ministry": "Department of Water Resources & Agriculture",
        "benefit": "55% subsidy for small and marginal farmers (45% for other farmers) for installing drip and sprinkler micro-irrigation systems.",
        "eligibility": "Farmers having cultivable land with an assured irrigation water source (well, borewell, canal, or farm pond).",
        "documents": "Land record (Patta/RTC), Water source certificate/electricity bill, Bank account, Aadhaar card.",
        "how_to_apply": "Apply through the state horticulture or agriculture department portal or visit the district taluk agriculture office.",
        "link": "https://pmksy.gov.in",
        "keywords": ["pmksy", "drip irrigation", "sprinkler", "irrigation subsidy", "water", "ಹನಿ ನೀರಾವರಿ", "ನೀರಾವರಿ"],
    },
    {
        "id": "pkvy",
        "name": "PKVY (Paramparagat Krishi Vikas Yojana)",
        "category": "Organic Farming",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "benefit": "Financial assistance of ₹50,000 per hectare over 3 years, of which ₹31,000/ha is given directly to farmers for organic inputs (seeds, bio-fertilizers, composting).",
        "eligibility": "Farmers willing to form clusters of 20 or more farmers with a total of 50 acres to adopt organic practices.",
        "documents": "Cluster formation group agreement, Aadhaar, land ownership certificate.",
        "how_to_apply": "Join local farmer producer groups or contact the district agriculture department.",
        "link": "https://pgsindia-ncof.gov.in",
        "keywords": ["pkvy", "organic farming", "paramparagat", "bio fertilizer", "compost", "ಸಾವಯವ"],
    },
]


class SchemeService:
    """Service to search and match verified government schemes."""

    @staticmethod
    def get_all_schemes():
        """Return all verified schemes."""
        return VERIFIED_SCHEMES

    @staticmethod
    def search_schemes(query_text, max_results=3):
        """Match relevant schemes based on query keywords."""
        if not query_text:
            return []

        text = query_text.lower()
        scored = []

        for scheme in VERIFIED_SCHEMES:
            score = 0
            if scheme["id"] in text:
                score += 10
            if scheme["name"].lower() in text:
                score += 8
            if scheme["category"].lower() in text:
                score += 5
            for kw in scheme["keywords"]:
                if kw in text:
                    score += 3

            if score > 0:
                scored.append((score, scheme))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored[:max_results]]
