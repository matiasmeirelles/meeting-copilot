import { T } from "../tokens.js";

/**
 * SectionTitle - Section heading with optional subtitle.
 * @param {React.ReactNode} children - Heading text
 * @param {string} [sub] - Subtitle text
 */
export function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: T.slate900, margin: 0, lineHeight: 1.3 }}>
        {children}
      </h2>
      {sub && (
        <p style={{ fontSize: 13, color: T.slate500, margin: "4px 0 0 0", lineHeight: 1.5 }}>
          {sub}
        </p>
      )}
    </div>
  );
}
