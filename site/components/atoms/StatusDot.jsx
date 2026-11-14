import { T } from "../tokens.js";

/**
 * StatusDot - Colored status indicator dot.
 * @param {string} status - One of: green, amber, red, mitigated, open, gray
 * @param {number} [size=8] - Dot diameter in pixels
 */
export function StatusDot({ status, size = 8 }) {
  const colors = {
    green: T.green, amber: T.amber, red: T.red,
    mitigated: T.green, open: T.amber, gray: T.slate400,
  };
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      backgroundColor: colors[status] || T.slate400, flexShrink: 0,
    }} />
  );
}
