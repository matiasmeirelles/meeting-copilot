/**
 * A.2.3: Sidebar navigation tree from publish.json categories with collapse/expand.
 */
import React, { useState, useMemo, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { ChevronRight, ChevronDown, FileText, BarChart3, FolderOpen, Folder } from "lucide-react";

const Sidebar = forwardRef(function Sidebar({ documents, activeDocId, activeCategory, onSelect, onSelectCategory, onCollapseStateChange }, ref) {
  const [collapsed, setCollapsed] = useState({});
  const [initialized, setInitialized] = useState(false);
  const activeRef = useRef(null);

  // Group documents by category
  const categories = useMemo(() => {
    const cats = {};
    for (const doc of documents) {
      if (!cats[doc.category]) cats[doc.category] = [];
      cats[doc.category].push(doc);
    }
    return cats;
  }, [documents]);

  // Sort categories alphabetically, but pin "Glossary" at the very bottom
  const sortedCats = useMemo(() => {
    const keys = Object.keys(categories).sort();
    const glossaryIdx = keys.indexOf("Glossary");
    if (glossaryIdx >= 0) {
      keys.splice(glossaryIdx, 1);
      keys.push("Glossary");
    }
    return keys;
  }, [categories]);

  // Start with all folders collapsed on first load
  useEffect(() => {
    if (!initialized && sortedCats.length > 0) {
      const next = {};
      for (const cat of sortedCats) next[cat] = true;
      setCollapsed(next);
      setInitialized(true);
    }
  }, [sortedCats, initialized]);

  // Auto-expand the category containing the active document
  useEffect(() => {
    if (!activeDocId) return;
    for (const [cat, items] of Object.entries(categories)) {
      if (items.some((d) => d.id === activeDocId) && collapsed[cat]) {
        setCollapsed((prev) => ({ ...prev, [cat]: false }));
        break;
      }
    }
  }, [activeDocId, categories]);

  // Scroll active item into view after expand
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeDocId, collapsed]);

  const toggle = (cat) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const allCollapsed = sortedCats.length > 0 && sortedCats.every((c) => collapsed[c]);

  const collapseAll = () => {
    const next = {};
    for (const cat of sortedCats) next[cat] = true;
    setCollapsed(next);
  };

  const expandAll = () => setCollapsed({});

  // Notify parent when collapse state changes (for header button sync)
  useEffect(() => {
    if (onCollapseStateChange) onCollapseStateChange(allCollapsed);
  }, [allCollapsed, onCollapseStateChange]);

  // Expose toggleAll to parent via ref
  useImperativeHandle(ref, () => ({
    toggleAll() {
      if (allCollapsed) { expandAll(); return false; }
      else { collapseAll(); return true; }
    },
    get allCollapsed() { return allCollapsed; },
  }));

  return (
    <nav className="w-64 min-w-[256px] h-full bg-surface border-r border-line overflow-y-auto text-[13px] py-3 shrink-0">
      <div className="px-4 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-fg">Documents</span>
      </div>
      <div className="px-4 pb-3 text-[11px] text-dim">
        {documents.length} artifacts
      </div>

      {sortedCats.map((cat) => {
        const items = categories[cat];
        const isCollapsed = collapsed[cat];
        const hasActive = items.some((d) => d.id === activeDocId);
        const isCatActive = activeCategory === cat;

        return (
          <div key={cat}>
            <div
              className={`flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                hasActive || isCatActive ? "text-sky-fg" : "text-dim hover:text-label"
              }`}
            >
              <button onClick={() => toggle(cat)} className="shrink-0">
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
              {isCollapsed ? <Folder size={14} className="shrink-0" /> : <FolderOpen size={14} className="shrink-0" />}
              <span
                className={`cursor-pointer ${isCatActive ? "underline" : "hover:underline"}`}
                onClick={() => onSelectCategory && onSelectCategory(cat)}
              >
                {cat}
              </span>
              <span className="ml-auto text-[10px] font-normal text-dim">({items.length})</span>
            </div>

            {!isCollapsed &&
              items.map((doc) => {
                const isActive = doc.id === activeDocId;
                const Icon = doc.type === "dashboard" ? BarChart3 : FileText;

                return (
                  <div
                    key={doc.id}
                    ref={isActive ? activeRef : null}
                    onClick={() => onSelect(doc)}
                    className={`flex items-center gap-2 px-4 pl-10 py-1.5 cursor-pointer border-l-[3px] transition-colors text-[12px] ${
                      isActive
                        ? "border-sky-400 bg-sky-tint text-sky-fg font-medium"
                        : "border-transparent text-label hover:text-heading hover:bg-surface-alt"
                    }`}
                    title={doc.summary || doc.title}
                  >
                    <Icon size={13} className="shrink-0 opacity-60" />
                    <span className="truncate">{doc.title}</span>
                  </div>
                );
              })}
          </div>
        );
      })}
    </nav>
  );
});

export default Sidebar;
