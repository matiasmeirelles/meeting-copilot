/**
 * A.2.4: Auto-generated table of contents with scroll spy.
 */
import React, { useState, useEffect, useCallback } from "react";

export default function TableOfContents({ headings }) {
  const [activeId, setActiveId] = useState("");

  // Scroll spy: observe headings and highlight the active one
  useEffect(() => {
    if (!headings || headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (!headings || headings.length < 2) return null;

  return (
    <div className="hidden xl:block w-56 shrink-0 sticky top-0 max-h-screen overflow-y-auto py-4 pr-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-dim mb-3">
        On this page
      </div>
      <ul className="space-y-0.5">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block py-1 text-xs transition-colors border-l-2 ${
                h.level === 3 ? "pl-5" : "pl-3"
              } ${
                activeId === h.id
                  ? "border-sky-400 text-sky-fg font-medium"
                  : "border-transparent text-muted hover:text-heading hover:border-line-hard"
              }`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
