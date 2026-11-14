/**
 * A.2.1/A.2.5: Search panel with MiniSearch, keyboard shortcuts, and categorized results.
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, X, FileText, BarChart3 } from "lucide-react";
import MiniSearch from "minisearch";

let searchIndex = null;

/** Initialize MiniSearch from publish.json documents */
export function initSearch(documents) {
  searchIndex = new MiniSearch({
    fields: ["title", "keywords_text", "summary", "category", "body_text"],
    storeFields: ["title", "path", "type", "category", "audience", "summary", "body_text"],
    searchOptions: {
      boost: { title: 3, keywords_text: 2, summary: 1.5, category: 1, body_text: 0.5 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  const indexed = documents.map((doc) => ({
    ...doc,
    keywords_text: (doc.keywords || []).join(" "),
  }));
  searchIndex.addAll(indexed);
}

/** Extract a short snippet around the first query match in body text */
function getSnippet(text, query, maxLen = 120) {
  if (!text || !query) return "";
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const lower = text.toLowerCase();
  let bestIdx = -1;
  for (const term of terms) {
    const idx = lower.indexOf(term);
    if (idx !== -1) { bestIdx = idx; break; }
  }
  if (bestIdx === -1) return "";
  const start = Math.max(0, bestIdx - 40);
  const end = Math.min(text.length, bestIdx + maxLen - 40);
  let snippet = text.slice(start, end).replace(/\s+/g, " ");
  if (start > 0) snippet = "\u2026" + snippet;
  if (end < text.length) snippet = snippet + "\u2026";
  return snippet;
}

/** Highlight matching terms in a snippet by wrapping in <mark> */
function highlightSnippet(snippet, query) {
  if (!snippet || !query) return snippet;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return snippet;
  // Escape special regex chars in terms
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  return snippet.replace(re, '<mark class="search-highlight">$1</mark>');
}

/** Get unique categories from documents */
function getCategories(documents) {
  const cats = new Set(documents.map((d) => d.category));
  return [...cats].sort();
}

export default function SearchPanel({ documents, onSelect, isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [filterCategory, setFilterCategory] = useState(null);
  const inputRef = useRef(null);

  const categories = useMemo(() => getCategories(documents), [documents]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setResults([]);
      setSelectedIdx(0);
      setFilterCategory(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || !searchIndex) {
      setResults([]);
      return;
    }
    let hits = searchIndex.search(query, { limit: 30 }).map((hit) => ({
      ...hit,
      snippet: getSnippet(hit.body_text, query),
    }));
    if (filterCategory) {
      hits = hits.filter((h) => h.category === filterCategory);
    }
    setResults(hits.slice(0, 15));
    setSelectedIdx(0);
  }, [query, filterCategory]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIdx]) {
        onSelect(results[selectedIdx]);
        onClose();
      }
    },
    [results, selectedIdx, onSelect, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-surface rounded-xl shadow-2xl border border-line overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <Search size={18} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documents..."
            className="flex-1 bg-transparent text-heading outline-none placeholder:text-dim"
          />
          <kbd className="hidden sm:inline px-1.5 py-0.5 rounded border border-line text-[10px] text-dim font-mono">
            ESC
          </kbd>
        </div>

        {/* Category filter pills */}
        {query.trim() && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-line overflow-x-auto">
            <button
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                !filterCategory ? "bg-sky-tint text-sky-fg border border-sky-line" : "bg-surface-dim text-muted hover:text-label"
              }`}
              onClick={() => setFilterCategory(null)}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  filterCategory === cat ? "bg-sky-tint text-sky-fg border border-sky-line" : "bg-surface-dim text-muted hover:text-label"
                }`}
                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 && query.trim() && (
            <div className="px-4 py-8 text-center text-muted text-sm">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {results.map((hit, i) => (
            <div
              key={hit.id}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                i === selectedIdx ? "bg-sky-tint" : "hover:bg-surface-alt"
              }`}
              onClick={() => {
                onSelect(hit);
                onClose();
              }}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              {hit.type === "dashboard" ? (
                <BarChart3 size={16} className="text-purple-fg shrink-0" />
              ) : (
                <FileText size={16} className="text-sky-fg shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-heading truncate">{hit.title}</div>
                <div className="text-xs text-muted truncate">{hit.category} &middot; {hit.audience}</div>
                {hit.snippet && (
                  <div
                    className="text-xs text-dim truncate mt-0.5"
                    dangerouslySetInnerHTML={{ __html: highlightSnippet(hit.snippet, query) }}
                  />
                )}
              </div>
              <span className="text-[10px] text-dim uppercase tracking-wider">{hit.type}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-line text-[11px] text-dim flex items-center gap-4">
            <span>{results.length} result{results.length !== 1 ? "s" : ""}</span>
            <span className="ml-auto">
              <kbd className="px-1 rounded border border-line font-mono">&uarr;</kbd>
              <kbd className="px-1 rounded border border-line font-mono ml-0.5">&darr;</kbd> navigate
              <kbd className="px-1 rounded border border-line font-mono ml-2">&crarr;</kbd> select
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
