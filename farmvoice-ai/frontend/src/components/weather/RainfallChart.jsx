import { useState } from "react";
import { Droplets, TrendingUp, Calendar, AlertCircle } from "lucide-react";

export default function RainfallChart({ rainfall, t }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!rainfall) return null;

  const trend = Array.isArray(rainfall.trend) ? rainfall.trend : [];
  const maxRain = Math.max(10, ...trend.map((d) => d.rainfall_amount || 0));

  // Chart dimensions
  const svgWidth = 640;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 40;
  const paddingTop = 25;
  const paddingBottom = 45;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const stepX = trend.length > 1 ? chartWidth / (trend.length - 1) : chartWidth;

  // Build probability line points
  const points = trend.map((d, i) => {
    const x = paddingLeft + i * stepX;
    const y = paddingTop + chartHeight - ((d.probability || 0) / 100) * chartHeight;
    return `${x},${y}`;
  });
  const linePath = points.join(" ");

  return (
    <div className="weather-section-container">
      <div className="section-title-bar">
        <div className="section-title-left">
          <Droplets size={20} className="section-header-icon text-blue" />
          <h3 className="section-heading">{t.rainfallMonitoring}</h3>
        </div>
        <span className="section-count-pill">7-Day Trend</span>
      </div>

      {/* 3 Metric Cards */}
      <div className="rainfall-stats-grid">
        <div className="rainfall-stat-card">
          <span className="rs-label">{t.expectedToday}</span>
          <div className="rs-val-row">
            <span className="rs-number">{rainfall.expected_rainfall_today}</span>
            <span className="rs-unit">mm</span>
          </div>
          <span className="rs-subtext">Calculated from 24h precipitation models</span>
        </div>

        <div className="rainfall-stat-card">
          <span className="rs-label">{t.rainProbability}</span>
          <div className="rs-val-row">
            <span className="rs-number">{rainfall.rainfall_probability_today}</span>
            <span className="rs-unit">%</span>
          </div>
          <span className="rs-subtext">Peak probability during daytime</span>
        </div>

        <div className="rainfall-stat-card">
          <span className="rs-label">{t.weeklyTotal}</span>
          <div className="rs-val-row">
            <span className="rs-number">{rainfall.weekly_total}</span>
            <span className="rs-unit">mm</span>
          </div>
          <span className="rs-subtext">Cumulative 7-day expected precipitation</span>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="rainfall-chart-card">
        <div className="chart-header-legend">
          <span className="chart-title">Daily Precipitation Forecast &amp; Likelihood</span>
          <div className="chart-legend-items">
            <span className="legend-item">
              <span className="legend-box bar-color" /> Rainfall (mm)
            </span>
            <span className="legend-item">
              <span className="legend-box line-color" /> Probability (%)
            </span>
          </div>
        </div>

        <div className="svg-responsive-wrapper">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="rainfall-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Gridlines */}
            {[0, 25, 50, 75, 100].map((pct) => {
              const y = paddingTop + chartHeight - (pct / 100) * chartHeight;
              return (
                <g key={pct}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94A3B8"
                  >
                    {Math.round((pct / 100) * maxRain)}m
                  </text>
                  <text
                    x={svgWidth - paddingRight + 6}
                    y={y + 3}
                    textAnchor="start"
                    fontSize="10"
                    fill="#94A3B8"
                  >
                    {pct}%
                  </text>
                </g>
              );
            })}

            {/* Bars for Rainfall (mm) */}
            {trend.map((d, i) => {
              const xCenter = paddingLeft + i * stepX;
              const barWidth = 32;
              const barHeight = Math.max(3, (d.rainfall_amount / maxRain) * chartHeight);
              const y = paddingTop + chartHeight - barHeight;
              const isHovered = hoveredIdx === i;

              return (
                <g
                  key={d.date || i}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    x={xCenter - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="4"
                    fill={isHovered ? "#2563EB" : "#3B82F6"}
                    opacity={isHovered ? 1 : 0.85}
                    className="rainfall-bar-rect"
                  />
                  {d.rainfall_amount > 0 && (
                    <text
                      x={xCenter}
                      y={y - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#1E40AF"
                    >
                      {d.rainfall_amount}
                    </text>
                  )}
                  {/* Day Label */}
                  <text
                    x={xCenter}
                    y={svgHeight - 20}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="#475569"
                  >
                    {d.day}
                  </text>
                  {/* Date Label */}
                  <text
                    x={xCenter}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#94A3B8"
                  >
                    {d.date ? d.date.slice(5) : ""}
                  </text>
                </g>
              );
            })}

            {/* Probability Line Curve */}
            {points.length > 1 && (
              <polyline
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                points={linePath}
              />
            )}

            {/* Probability Dots */}
            {trend.map((d, i) => {
              const x = paddingLeft + i * stepX;
              const y = paddingTop + chartHeight - ((d.probability || 0) / 100) * chartHeight;
              const isHovered = hoveredIdx === i;

              return (
                <circle
                  key={`dot-${i}`}
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill="#F59E0B"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: "pointer" }}
                />
              );
            })}
          </svg>
        </div>

        {/* Hovered details card */}
        {hoveredIdx !== null && trend[hoveredIdx] && (
          <div className="chart-hover-banner">
            <span className="chb-day">
              <Calendar size={13} /> {trend[hoveredIdx].day} ({trend[hoveredIdx].date})
            </span>
            <span className="chb-val">
              Expected Rainfall: <strong>{trend[hoveredIdx].rainfall_amount} mm</strong>
            </span>
            <span className="chb-prob">
              Precipitation Probability: <strong>{trend[hoveredIdx].probability}%</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
