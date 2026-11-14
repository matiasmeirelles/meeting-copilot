import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { T } from "../tokens.js";
import { Card } from "./Card.jsx";

/**
 * ExpandableCard - Card with collapsible content section and chevron indicator.
 * Abstracts the repeated Card + ChevronDown + expanded state pattern.
 *
 * @param {React.ReactNode} header - Always-visible header content
 * @param {React.ReactNode} children - Collapsible body content
 * @param {boolean} [defaultOpen=false] - Initial expanded state
 * @param {object} [style] - Additional card styles
 * @param {string} [borderColor] - Optional left/top border accent color
 * @param {"left"|"top"} [borderSide="left"] - Which side gets the accent border
 */
export function ExpandableCard({
  header, children, defaultOpen = false,
  style, borderColor, borderSide = "left",
}) {
  const [open, setOpen] = useState(defaultOpen);

  const borderStyle = borderColor
    ? { [`border${borderSide === "top" ? "Top" : "Left"}`]: `4px solid ${borderColor}` }
    : {};

  return (
    <Card
      hoverable
      onClick={() => setOpen(prev => !prev)}
      style={{ overflow: "hidden", ...borderStyle, ...style }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>{header}</div>
        <ChevronDown
          size={14}
          color={T.slate300}
          style={{
            flexShrink: 0, marginTop: 4,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </div>
      {open && (
        <div onClick={(e) => e.stopPropagation()} style={{ cursor: "default" }}>
          {children}
        </div>
      )}
    </Card>
  );
}
