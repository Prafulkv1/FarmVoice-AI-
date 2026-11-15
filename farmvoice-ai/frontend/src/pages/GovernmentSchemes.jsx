import { useState } from "react";
import {
  ShieldCheck,
  Search,
  ExternalLink,
  CheckCircle,
  FileText,
  DollarSign,
  Info,
  Calendar,
  Sparkles,
  Award,
} from "lucide-react";
import "../styles/dashboard.css";

const SCHEMES_DATA = [
  {
    id: "pm-kisan",
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    category: "Direct Benefit",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    benefit: "₹6,000 per year in 3 equal installments",
    eligibility: "All small and marginal landholding farmer families with cultivable land.",
    documents: "Aadhaar Card, Land ownership documents (RoR/7-12), Active Bank Account.",
    status: "Active & Ongoing",
    link: "https://pmkisan.gov.in",
  },
  {
    id: "pmfby",
    name: "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
    category: "Crop Insurance",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    benefit: "Comprehensive insurance against non-preventable natural risks from pre-sowing to post-harvest.",
    eligibility: "Farmers growing notified crops in notified areas (both loanee and non-loanee farmers).",
    documents: "Crop sowing certificate, Land records, Bank passbook, Aadhaar card.",
    status: "Active - Kharif & Rabi",
    link: "https://pmfby.gov.in",
  },
  {
    id: "kcc",
    name: "KCC (Kisan Credit Card Scheme)",
    category: "Credit & Loans",
    ministry: "Department of Financial Services / NABARD",
    benefit: "Timely credit up to ₹3,00,000 at a subsidized interest rate of 4% per annum.",
    eligibility: "Individual / joint agricultural borrowers, tenant farmers, oral lessees & sharecroppers.",
    documents: "Application form, Identity & address proof, Land holding proof, Crop pattern details.",
    status: "Open at all Banks",
    link: "https://myscheme.gov.in/schemes/kcc",
  },
  {
    id: "soil-health",
    name: "Soil Health Card Scheme",
    category: "Soil & Nutrients",
    ministry: "Department of Agriculture and Cooperation",
    benefit: "Free testing of 12 soil parameters every 2 years with crop-wise nutrient advisories.",
    eligibility: "All farmers across India possessing agricultural land.",
    documents: "Farmer ID, Land parcel details, Soil sample form.",
    status: "Active Across Districts",
    link: "https://soilhealth.dac.gov.in",
  },
  {
    id: "pkvy",
    name: "PKVY (Paramparagat Krishi Vikas Yojana)",
    category: "Organic Farming",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    benefit: "Financial assistance of ₹50,000 per hectare over 3 years for organic conversion.",
    eligibility: "Farmers willing to form clusters of 20 or more farmers taking up organic farming.",
    documents: "Cluster formation agreement, Farmer KYC, Land document.",
    status: "Cluster Enrollment Open",
    link: "https://pgsindia-ncof.gov.in",
  },
  {
    id: "pmksy",
    name: "PMKSY (Per Drop More Crop - PM Krishi Sinchayee)",
    category: "Irrigation Subsidies",
    ministry: "Department of Water Resources & Agriculture",
    benefit: "Up to 55% subsidy for small/marginal farmers for installing drip and sprinkler systems.",
    eligibility: "Farmers having cultivable land with an assured water source.",
    documents: "Land patta / lease deed, Water source certificate, Bank account, Aadhaar.",
    status: "District Quota Active",
    link: "https://pmksy.gov.in",
  },
];

const CATEGORIES = ["All Schemes", "Direct Benefit", "Crop Insurance", "Credit & Loans", "Soil & Nutrients", "Organic Farming", "Irrigation Subsidies"];

export default function GovernmentSchemes() {
  const [activeCategory, setActiveCategory] = useState("All Schemes");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSchemes = SCHEMES_DATA.filter((scheme) => {
    const matchesCategory =
      activeCategory === "All Schemes" || scheme.category === activeCategory;
    const matchesSearch =
      scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.benefit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.eligibility.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="page schemes-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Government Agricultural Schemes</h1>
          <p className="page-sub">
            Verified central and state agricultural support, subsidies, and credit programs.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="schemes-filter-bar">
        <div className="schemes-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="schemes-search-input"
            placeholder="Search schemes by name, keyword, or subsidy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="schemes-category-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scheme Cards Grid */}
      <div className="schemes-cards-grid">
        {filteredSchemes.map((scheme) => (
          <div key={scheme.id} className="scheme-card">
            <div className="scheme-card-header">
              <div className="scheme-header-left">
                <div className="scheme-badge-category">{scheme.category}</div>
                <h3 className="scheme-title">{scheme.name}</h3>
                <span className="scheme-ministry">{scheme.ministry}</span>
              </div>
              <span className="scheme-status-pill">
                <CheckCircle size={14} />
                <span>{scheme.status}</span>
              </span>
            </div>

            <div className="scheme-benefit-box">
              <div className="benefit-icon-wrap">
                <Award size={20} />
              </div>
              <div>
                <div className="benefit-lbl">Key Benefit / Subsidy</div>
                <div className="benefit-text">{scheme.benefit}</div>
              </div>
            </div>

            <div className="scheme-details-grid">
              <div className="scheme-detail-block">
                <div className="detail-title">
                  <Info size={14} />
                  <span>Eligibility</span>
                </div>
                <p className="detail-desc">{scheme.eligibility}</p>
              </div>

              <div className="scheme-detail-block">
                <div className="detail-title">
                  <FileText size={14} />
                  <span>Required Documents</span>
                </div>
                <p className="detail-desc">{scheme.documents}</p>
              </div>
            </div>

            <div className="scheme-card-actions">
              <a
                href={scheme.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-scheme-link"
              >
                <span>Visit Official Portal</span>
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {filteredSchemes.length === 0 && (
        <div className="empty-state">
          <p>No agricultural schemes match your search criteria. Try a different keyword or category.</p>
        </div>
      )}
    </div>
  );
}
