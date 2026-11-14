import { T } from "../tokens.js";

/**
 * RadarChart - Multi-axis SVG radar with target/current overlays.
 * @param {Array<{axis: string, current: number, target: number}>} data - Axis data (0-1 scale)
 * @param {number} [size=260] - Chart size in pixels
 */
export function RadarChart({ data, size = 260 }) {
  const cx = size / 2, cy = size / 2, maxR = size * 0.38;
  const n = data.length;

  const getPoint = (i, val) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + Math.cos(angle) * maxR * val, y: cy + Math.sin(angle) * maxR * val };
  };

  const targetPts = data.map((d, i) => getPoint(i, d.target));
  const currentPts = data.map((d, i) => getPoint(i, d.current));
  const targetPath = targetPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  const currentPath = currentPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map(ring => (
        <polygon
          key={ring}
          points={data.map((_, i) => { const p = getPoint(i, ring); return `${p.x},${p.y}`; }).join(" ")}
          fill="none" stroke={T.slate200} strokeWidth={0.5}
        />
      ))}
      {/* Axis lines */}
      {data.map((_, i) => {
        const p = getPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={T.slate200} strokeWidth={0.5} />;
      })}
      {/* Target area */}
      <path d={targetPath} fill={T.tealGhost} stroke={T.teal} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />
      {/* Current area */}
      <path d={currentPath} fill="rgba(200,169,81,0.15)" stroke={T.gold} strokeWidth={2} />
      {/* Current data points */}
      {currentPts.map((p, i) => (
        <circle key={`c-${i}`} cx={p.x} cy={p.y} r={3.5} fill={T.gold} stroke={T.cardBg} strokeWidth={1.5} />
      ))}
      {/* Axis labels */}
      {data.map((d, i) => {
        const p = getPoint(i, 1.18);
        return (
          <text
            key={`l-${i}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 10, fontWeight: 600, fill: T.slate600 }}
          >
            {d.axis}
          </text>
        );
      })}
    </svg>
  );
}
