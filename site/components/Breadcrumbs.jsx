/**
 * A.2.4: Breadcrumb navigation with active category links.
 */
import React from "react";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs({ doc, category, onNavigateHome, onNavigateCategory }) {
  if (!doc && !category) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted mb-4">
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-1 hover:text-heading transition-colors"
      >
        <Home size={13} />
        <span>Home</span>
      </button>

      {(doc || category) && (
        <>
          <ChevronRight size={12} className="text-dim" />
          {doc ? (
            <button
              onClick={() => onNavigateCategory(doc.category)}
              className="text-label hover:text-heading transition-colors"
            >
              {doc.category}
            </button>
          ) : (
            <span className="text-heading font-medium">{category}</span>
          )}
        </>
      )}

      {doc && (
        <>
          <ChevronRight size={12} className="text-dim" />
          <span className="text-heading font-medium truncate max-w-xs">{doc.title}</span>
        </>
      )}
    </div>
  );
}
