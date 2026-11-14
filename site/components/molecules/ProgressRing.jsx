import { T } from "../tokens.js";

/**
 * ProgressRing - SVG circular progress gauge with label.
 * @param {number} value - Current value
 * @param {number} max - Maximum value (100% reference)
 * @param {number} [size=80] - Ring diameter in pixels
 * @param {number} [stroke=6] - Stroke width in pixels
 * @param {string} [color=T.teal] - Ring fill color
 * @param {string} [label] - Label text below ring
 * @param {string} [sublabel] - Secondary label text
 */
export function ProgressRing({ value, max, size = 80, stroke = 6, color = T.teal, label, sublabel }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.slate100} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div style={{ textAlign: "center", marginTop: -size - 4, paddingTop: size * 0.28 }}>
        <div style={{ fontSize: size * 0.22, fontWeight: 800, color: T.slate900, lineHeight: 1 }}>
          {Math.round(pct * 100)}%
        </div>
      </div>
      <div style={{ marginTop: size * 0.22, textAlign: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.slate700 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: T.slate400 }}>{sublabel}</div>}
      </div>
    </div>
  );
}
