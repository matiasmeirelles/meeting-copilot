/**
 * Badge - Inline label with filled or outline variant.
 * @param {string} text - Label text
 * @param {string} color - CSS color value
 * @param {"filled"|"outline"} [variant="filled"] - Visual variant
 */
export function Badge({ text, color, variant = "filled" }) {
  const base = {
    display: "inline-flex", alignItems: "center",
    padding: "2px 8px", borderRadius: 4,
    fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color,
  };
  if (variant === "outline") {
    return (
      <span style={{ ...base, border: `1px solid ${color}40`, background: "transparent" }}>
        {text}
      </span>
    );
  }
  return (
    <span style={{ ...base, background: color + "14", border: `1px solid ${color}25` }}>
      {text}
    </span>
  );
}
