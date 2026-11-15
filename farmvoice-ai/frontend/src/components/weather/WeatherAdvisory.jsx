import {
  Sprout,
  Droplets,
  Wind,
  Sun,
  ShieldCheck,
  Info,
  CheckCircle2,
} from "lucide-react";

function getAdvisoryIcon(icon) {
  switch (icon) {
    case "droplets":
      return <Droplets size={20} className="adv-icon adv-blue" />;
    case "wind":
      return <Wind size={20} className="adv-icon adv-teal" />;
    case "sun":
      return <Sun size={20} className="adv-icon adv-amber" />;
    case "sprout":
    default:
      return <Sprout size={20} className="adv-icon adv-green" />;
  }
}

export default function WeatherAdvisory({ advisories = [], farmerCrops = [], t }) {
  if (!advisories || advisories.length === 0) return null;

  return (
    <div className="weather-section-container">
      <div className="section-title-bar">
        <div className="section-title-left">
          <Sprout size={20} className="section-header-icon text-green" />
          <h3 className="section-heading">{t.farmingAdvisory}</h3>
        </div>
        {farmerCrops.length > 0 && (
          <div className="farmer-crops-chips">
            <span className="crops-label">Your Crops:</span>
            {farmerCrops.map((crop) => (
              <span key={crop} className="crop-pill-mini">
                {crop}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="advisories-grid">
        {advisories.map((adv, idx) => (
          <div key={idx} className={`advisory-card adv-type-${adv.type || "normal"}`}>
            <div className="advisory-card-header">
              <div className="advisory-category-title">
                {getAdvisoryIcon(adv.icon)}
                <h4>{adv.category}</h4>
              </div>
              <span className={`advisory-badge-pill pill-${adv.type || "normal"}`}>
                {adv.badge}
              </span>
            </div>

            <p className="advisory-message-text">{adv.message}</p>
          </div>
        ))}
      </div>

      <div className="advisory-disclaimer-box">
        <Info size={14} className="disclaimer-icon" />
        <span>{t.advisoryDisclaimer}</span>
      </div>
    </div>
  );
}
