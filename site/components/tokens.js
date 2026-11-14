/**
 * Executive Briefing Tokens
 *
 * @deprecated REMOVAL TARGET: When all executive-briefing-new-component/ dashboards
 * migrate to CSS variables (styles.css --color-* tokens). No new consumers allowed.
 *
 * These JS tokens are hardcoded hex values that do NOT respond to dark/light mode toggle.
 * Only the executive-briefing-new-component/ dashboards use these.
 * New dashboards MUST use CSS variables: var(--color-surface), var(--color-body), etc.
 * See also: design-system.json (feeds generate-css-tokens.js → --eb-* prefix).
 *
 * Extracted from csuite-briefing.jsx inline constants (J.19.2 / ADR-085).
 */
export const T = {
  navy: "#0B1629", navyLight: "#2D3F5E", navyMid: "#3A5073",
  headerFrom: "#4B6DA0", headerTo: "#5B80B2", headerAccent: "#6E94C2",
  tabColors: { summary: "#0D9488", accomplishments: "#3B82F6", decisions: "#F59E0B", investment: "#10B981", methodology: "#6366F1", trends: "#8B5CF6" },
  teal: "#0D9488", tealLight: "#14B8A6", tealDark: "#0F766E", tealGhost: "rgba(13,148,136,0.08)",
  gold: "#C8A951", goldLight: "#E2C97A", goldGhost: "rgba(200,169,81,0.10)",
  red: "#DC2626", redGhost: "rgba(220,38,38,0.08)",
  amber: "#D97706", amberGhost: "rgba(217,119,6,0.08)",
  green: "#059669", greenGhost: "rgba(5,150,105,0.08)",
  slate50: "#F8FAFC", slate100: "#F1F5F9", slate200: "#E2E8F0", slate300: "#CBD5E1",
  slate400: "#94A3B8", slate500: "#64748B", slate600: "#475569", slate700: "#334155",
  slate800: "#1E293B", slate900: "#0F172A",
  bg: "#F6F7F9", cardBg: "#FFFFFF",
  font: "'Outfit', 'Source Sans 3', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', monospace",
};
