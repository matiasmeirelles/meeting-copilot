/**
 * Shared UI Primitives
 *
 * Barrel export for all atoms and molecules following ADR-085 Atomic Design.
 * Import from here instead of individual files for convenience.
 *
 * Usage:
 *   import { Badge, Card, ExpandableCard, StatusDot } from "../components/index.js";
 */

// Design tokens
export { T } from "./tokens.js";

// Atoms
export { StatusDot } from "./atoms/StatusDot.jsx";
export { Badge } from "./atoms/Badge.jsx";
export { SectionTitle } from "./atoms/SectionTitle.jsx";

// Molecules
export { Card } from "./molecules/Card.jsx";
export { ExpandableCard } from "./molecules/ExpandableCard.jsx";
export { ProgressRing } from "./molecules/ProgressRing.jsx";
export { RadarChart } from "./molecules/RadarChart.jsx";
