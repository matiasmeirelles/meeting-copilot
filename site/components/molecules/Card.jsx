import { useState } from "react";
import { T } from "../tokens.js";

/**
 * Card - Hoverable container with border, shadow, and optional click handler.
 * @param {React.ReactNode} children
 * @param {object} [style] - Additional inline styles
 * @param {function} [onClick] - Click handler
 * @param {boolean} [hoverable] - Enable hover shadow effect
 */
export function Card({ children, style, onClick, hoverable }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.cardBg, borderRadius: 12, border: `1px solid ${T.slate200}`,
        transition: "all 0.2s ease",
        boxShadow: hov && hoverable ? "0 4px 20px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
