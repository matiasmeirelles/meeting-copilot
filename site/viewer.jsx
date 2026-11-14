/**
 * Meeting Copilot — Research Viewer
 *
 * Modular viewer for rendering markdown docs and JSX dashboards with:
 * - Unified markdown rendering with frontmatter, syntax highlighting, GFM, math
 * - Full-text search (MiniSearch), sidebar navigation, breadcrumbs, TOC, keyboard shortcuts
 * - Presentation mode with slide progression, keyboard nav, timer
 */
import React, { useState, lazy, Suspense, useEffect, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Sun, Moon, Search, HelpCircle, PanelLeftClose, PanelLeft, ArrowUp, Printer, ChevronLeft, ChevronRight, X, ChevronsUpDown, FolderClosed } from "lucide-react";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";
import "./styles.css";

import MarkdownRenderer from "./components/MarkdownRenderer.jsx";
import Sidebar from "./components/Sidebar.jsx";
import SearchPanel, { initSearch } from "./components/SearchPanel.jsx";
import Breadcrumbs from "./components/Breadcrumbs.jsx";
import TableOfContents from "./components/TableOfContents.jsx";
import CategoryLanding from "./components/CategoryLanding.jsx";
import ProjectSwitcher, { resolveInitialProject, ALL_PROJECTS_ID } from "./components/ProjectSwitcher.jsx";
import PresentationMode from "./components/PresentationMode.jsx";

const logo = null;

const DEFAULT_BRANDING = {
  title: "AI Meeting Copilot",
  description: "Market Research & Business Strategy",
  footer: "AI Meeting Copilot | Startup Weekend Orlando 2026",
  homeName: "AI Meeting Copilot",
  homeDashboard: "dashboards-executive-decision-brief",
  jsonFile: null,
  briefingJsonFile: null,
};

const dashboardModules = {
  "dashboards-executive-decision-brief": lazy(() => import("./dashboards/executive-decision-brief.jsx")),
  "dashboards-competitive-intelligence-dashboard": lazy(() => import("./dashboards/competitive-intelligence-dashboard.jsx")),
};

/** Load markdown content from file path via fetch */
async function loadMarkdown(path) {
  // Encode path segments individually to handle spaces/special chars in filenames
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const resp = await fetch(`/${encoded}`);
  if (!resp.ok) throw new Error(`Failed to load ${path}`);
  const text = await resp.text();
  // Resolve relative image paths to absolute based on document directory.
  // Hash-based SPA resolves ./images/ against page root (/), not the doc's dir.
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return text;
  const baseDir = path.substring(0, lastSlash + 1);
  return text.replace(/(!\[[^\]]*\])\(\.\//g, `$1(/${baseDir}`);
}

/** Parse hash route → { type, doc, category, filename } */
function parseHash(documents) {
  const hash = window.location.hash.slice(2); // Remove #/
  if (!hash) return { type: "home" };
  // Category route: category/{name}
  if (hash.startsWith("category/")) {
    return { type: "category", category: decodeURIComponent(hash.slice(9)) };
  }
  // Session log route: session-logs-SESSION-LOG-YYYY-MM-DD
  if (hash.startsWith("session-logs-")) {
    return { type: "session-log", filename: hash.slice("session-logs-".length) };
  }
  // Document route
  const doc = documents.find((d) => d.id === hash);
  return doc ? { type: "doc", doc } : { type: "home" };
}

/** Keyboard shortcuts help modal */
function ShortcutsModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-surface rounded-xl shadow-2xl border border-line p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-heading mb-4">Keyboard Shortcuts</h3>
        <table className="w-full text-sm">
          <tbody>
            {[
              ["/  or  Ctrl+K", "Open search"],
              ["Ctrl+B  or  ⌘B", "Toggle sidebar"],
              ["j / k", "Next / previous document"],
              ["Ctrl+P  or  ⌘P", "Print document"],
              ["P", "Presentation mode (markdown docs)"],
              ["Escape", "Close search / zoom"],
              ["?", "Show this help"],
            ].map(([key, desc]) => (
              <tr key={key} className="border-t border-line-soft">
                <td className="py-2 pr-4">
                  <kbd className="px-1.5 py-0.5 rounded border border-line bg-surface-dim text-xs font-mono">{key}</kbd>
                </td>
                <td className="py-2 text-muted">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={onClose} className="mt-4 px-4 py-2 rounded-lg bg-sky-tint text-sky-fg text-sm font-medium hover:bg-sky-line transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

function Viewer() {
  const [documents, setDocuments] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]); // Full unfiltered set for "All Projects"
  const [activeDoc, setActiveDoc] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [markdownContent, setMarkdownContent] = useState("");
  const [headings, setHeadings] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [zoomContent, setZoomContent] = useState(null); // { type: 'diagram'|'image', html|src }
  const [recentDocs, setRecentDocs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mc-recent") || "[]"); } catch { return []; }
  });
  // J.18.2.2: Multi-project manifest and branding state
  const [projectManifest, setProjectManifest] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [presentationMode, setPresentationMode] = useState(false);
  const mainRef = useRef(null);
  const sidebarRef = useRef(null);
  const [allFoldersCollapsed, setAllFoldersCollapsed] = useState(false);

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // J.18.2.2: Load project manifest on startup
  useEffect(() => {
    fetch("/project-manifest.json")
      .then((r) => r.json())
      .then((manifest) => {
        setProjectManifest(manifest);
        const initialId = resolveInitialProject(manifest);
        setActiveProjectId(initialId);
        // Apply branding from manifest
        const project = manifest.projects.find((p) => p.id === initialId);
        if (project) {
          setBranding({
            title: project.title || DEFAULT_BRANDING.title,
            description: project.description || DEFAULT_BRANDING.description,
            footer: project.footer || DEFAULT_BRANDING.footer,
            homeName: project.name || DEFAULT_BRANDING.homeName,
            homeDashboard: project.homeDashboard || DEFAULT_BRANDING.homeDashboard,
            jsonFile: project.jsonFile || DEFAULT_BRANDING.jsonFile,
            briefingJsonFile: project.briefingJsonFile || DEFAULT_BRANDING.briefingJsonFile,
          });
        }
      })
      .catch(() => {
        // No manifest: single-project mode, use defaults
      });
  }, []);

  // J.18.2.3: Handle project switch — loads per-project documents when available
  const handleProjectChange = useCallback((project) => {
    setActiveProjectId(project.id);

    // "All Projects" mode: restore full document set, use default branding
    if (project.id === ALL_PROJECTS_ID) {
      setBranding(DEFAULT_BRANDING);
      setDocuments(allDocuments);
      initSearch(allDocuments);
      setActiveDoc(null);
      setActiveCategory(null);
      setMarkdownContent("");
      window.location.hash = "";
      return;
    }

    setBranding({
      title: project.title || DEFAULT_BRANDING.title,
      description: project.description || DEFAULT_BRANDING.description,
      footer: project.footer || DEFAULT_BRANDING.footer,
      homeName: project.name || DEFAULT_BRANDING.homeName,
      homeDashboard: project.homeDashboard || DEFAULT_BRANDING.homeDashboard,
      jsonFile: project.jsonFile || DEFAULT_BRANDING.jsonFile,
      briefingJsonFile: project.briefingJsonFile || DEFAULT_BRANDING.briefingJsonFile,
    });

    // Load per-project publish.json if available
    if (project.publishJsonFile) {
      fetch(`/${project.publishJsonFile}`)
        .then((r) => r.ok ? r.json() : null)
        .then((manifest) => {
          if (manifest && manifest.documents) {
            setDocuments(manifest.documents);
            initSearch(manifest.documents);
          }
          // If per-project file doesn't exist, keep current documents
        })
        .catch(() => {
          // Per-project file not found — keep current documents (graceful fallback)
        });
    }

    // Clear document state on project switch
    setActiveDoc(null);
    setActiveCategory(null);
    setMarkdownContent("");
    window.location.hash = "";
  }, [allDocuments]);

  // Scroll progress + back-to-top
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => {
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setScrollProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
      setShowBackToTop(scrollTop > 300);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeDoc]);

  // Load manifests — per-project docs for active project, combined for "All Projects" mode
  useEffect(() => {
    // Always load combined manifest into allDocuments (for "All Projects" switch)
    const combinedPromise = fetch("/publish.json")
      .then((r) => r.json())
      .then((m) => { setAllDocuments(m.documents); return m; })
      .catch(() => null);

    // Determine per-project manifest file from project-manifest.json
    // Use resolveInitialProject to respect URL param / localStorage / default
    fetch("/project-manifest.json")
      .then((r) => r.json())
      .then((pm) => {
        const initialId = resolveInitialProject(pm);
        const project = initialId !== ALL_PROJECTS_ID
          ? pm.projects.find((p) => p.id === initialId)
          : null;
        const publishFile = project && project.publishJsonFile;

        // Load per-project manifest if available, otherwise fall back to combined
        const docsPromise = publishFile
          ? fetch(`/${publishFile}`).then((r) => r.ok ? r.json() : null).catch(() => null)
          : combinedPromise;

        return docsPromise.then((manifest) => {
          if (manifest && manifest.documents) {
            setDocuments(manifest.documents);
            initSearch(manifest.documents);
          }
          setLoading(false);
          // Check for hash route
          const route = parseHash(manifest ? manifest.documents : []);
          if (route.type === "doc") navigateToDoc(route.doc);
          else if (route.type === "category") navigateToCategory(route.category);
          else if (route.type === "session-log") navigateToSessionLog(route.filename);
        });
      })
      .catch(() => {
        // Fallback: load combined manifest if project-manifest.json fails
        combinedPromise.then((manifest) => {
          if (manifest && manifest.documents) {
            setDocuments(manifest.documents);
            initSearch(manifest.documents);
          }
          setLoading(false);
        });
      });
  }, []);

  // Hash change listener
  useEffect(() => {
    const onHash = () => {
      const route = parseHash(documents);
      if (route.type === "doc") navigateToDoc(route.doc);
      else if (route.type === "category") navigateToCategory(route.category);
      else if (route.type === "session-log") navigateToSessionLog(route.filename);
      else {
        setActiveDoc(null);
        setActiveCategory(null);
        setMarkdownContent("");
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [documents]);

  // Navigate to document
  const navigateToDoc = useCallback(
    async (doc, anchor) => {
      setActiveDoc(doc);
      setActiveCategory(null);
      setSidebarOpen(true);
      setHeadings([]);
      window.location.hash = `/${doc.id}`;
      // Track recent docs
      setRecentDocs((prev) => {
        const filtered = prev.filter((d) => d.id !== doc.id);
        const next = [{ id: doc.id, title: doc.title, category: doc.category, type: doc.type }, ...filtered].slice(0, 5);
        try { localStorage.setItem("mc-recent", JSON.stringify(next)); } catch {}
        return next;
      });
      if (doc.type === "markdown") {
        setMarkdownContent("");
        try {
          const content = await loadMarkdown(doc.path);
          setMarkdownContent(content);
          // Scroll to anchor after render
          if (anchor) {
            requestAnimationFrame(() => {
              setTimeout(() => {
                const el = document.getElementById(anchor);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            });
          }
        } catch (e) {
          setMarkdownContent(`# Error\n\nFailed to load: ${doc.path}\n\n${e.message}`);
        }
      }
      // Scroll main to top
      if (mainRef.current && !anchor) mainRef.current.scrollTop = 0;
    },
    []
  );

  // Navigate to category landing page
  const navigateToCategory = useCallback((categoryName) => {
    setActiveDoc(null);
    setActiveCategory(categoryName);
    setSidebarOpen(true);
    setMarkdownContent("");
    setHeadings([]);
    window.location.hash = `/category/${encodeURIComponent(categoryName)}`;
  }, []);

  const navigateHome = useCallback(() => {
    setActiveDoc(null);
    setActiveCategory(null);
    setMarkdownContent("");
    window.location.hash = "";
  }, []);

  // Navigate to session log (from dashboard links)
  const navigateToSessionLog = useCallback(async (filename) => {
    const dateMatch = filename.match(/SESSION-LOG-(\d{4}-\d{2}-\d{2})/);
    const title = dateMatch ? `Session Log \u2014 ${dateMatch[1]}` : filename;
    const syntheticDoc = {
      id: `session-logs-${filename}`,
      title,
      category: "Session Logs",
      type: "markdown",
      path: `session-logs/${filename}.md`,
    };
    setActiveDoc(syntheticDoc);
    setActiveCategory(null);
    setHeadings([]);
    setMarkdownContent("");
    window.location.hash = `/session-logs-${filename}`;
    try {
      const content = await loadMarkdown(`session-logs/${filename}.md`);
      setMarkdownContent(content);
    } catch (e) {
      setMarkdownContent(`# Error\n\nFailed to load session log: ${filename}\n\n${e.message}`);
    }
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, []);

  // Stable sidebar select handler (prevents re-renders on every scroll)
  const handleSidebarSelect = useCallback((doc) => {
    navigateToDoc(doc);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [navigateToDoc]);

  // Click handler: inter-doc links, diagram zoom, image lightbox
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onClick = (e) => {
      // Diagram zoom
      const diagram = e.target.closest(".mermaid-diagram");
      if (diagram) {
        e.preventDefault();
        setZoomContent({ type: "diagram", html: diagram.innerHTML });
        return;
      }
      // Image lightbox
      if (e.target.tagName === "IMG" && e.target.closest(".markdown-body")) {
        e.preventDefault();
        setZoomContent({ type: "image", src: e.target.src, alt: e.target.alt || "" });
        return;
      }
      // Inter-doc links
      const link = e.target.closest("a[href]");
      if (link) {
        const href = link.getAttribute("href");
        // Skip empty, anchor-only, and external links (external handled by rehypeWppLinks target="_blank")
        if (!href || href.startsWith("#") || href.startsWith("http")) return;
        e.preventDefault();

        // Strip anchor from href for matching, preserve for later
        const hashIdx = href.indexOf("#");
        const hrefPath = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
        const hrefAnchor = hashIdx >= 0 ? href.slice(hashIdx) : "";

        // Normalize: strip leading ./ and .md extension for flexible matching
        const cleanHref = hrefPath.replace(/^\.\//, "").replace(/\.md$/i, "");

        // Build resolved path relative to current document's directory
        let resolvedPath = cleanHref;
        if (activeDoc && activeDoc.path && !cleanHref.startsWith("_docs")) {
          const dir = activeDoc.path.substring(0, activeDoc.path.lastIndexOf("/"));
          const parts = (dir + "/" + cleanHref).split("/");
          const resolved = [];
          for (const p of parts) {
            if (p === "..") resolved.pop();
            else if (p && p !== ".") resolved.push(p);
          }
          resolvedPath = resolved.join("/");
        }

        // Try matching: resolved path, filename-only, or partial path
        const filename = cleanHref.split("/").pop();
        const doc = documents.find((d) => {
          const dp = d.path.replace(/\.md$/i, "");
          return dp === resolvedPath || dp.endsWith("/" + cleanHref) || dp.endsWith("/" + filename);
        });
        if (doc) {
          navigateToDoc(doc);
          if (hrefAnchor) {
            setTimeout(() => {
              const target = document.getElementById(hrefAnchor.slice(1));
              if (target) target.scrollIntoView({ behavior: "smooth" });
            }, 200);
          }
        } else {
          // Visual feedback for unresolved internal links
          link.style.outline = "2px dashed #f87171";
          link.title = "Document not found: " + href;
          console.warn("[WPP] Unresolved internal link:", href, "from", activeDoc?.path);
        }
      }
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [documents, activeDoc, navigateToDoc]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      // Close zoom on Escape
      if (e.key === "Escape" && zoomContent) {
        setZoomContent(null);
        return;
      }
      // Don't capture if typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "b" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSidebarOpen((v) => !v);
        return;
      }
      if (e.key === "/" || (e.key === "k" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "?" && !e.shiftKey) {
        setShowHelp(true);
      } else if (e.key === "p" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        window.print();
      } else if (e.key === "P" && activeDoc?.type === "markdown" && markdownContent) {
        setPresentationMode(true);
      } else if ((e.key === "j" || e.key === "k") && activeDoc && !searchOpen) {
        // j = next doc, k = prev doc within same category
        const sameCat = documents.filter((d) => d.category === activeDoc.category);
        const idx = sameCat.findIndex((d) => d.id === activeDoc.id);
        if (idx === -1) return;
        const next = e.key === "j" ? sameCat[idx + 1] : sameCat[idx - 1];
        if (next) navigateToDoc(next);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeDoc, documents, searchOpen, zoomContent, markdownContent, navigateToDoc]);

  // Resolve dashboard component
  const DashboardComponent = activeDoc?.type === "dashboard" ? dashboardModules[activeDoc.id] : null;

  return (
    <div className="flex flex-col h-screen bg-surface text-body">
      {/* Reading progress bar */}
      {activeDoc && <div className="reading-progress" style={{ width: `${scrollProgress}%` }} />}

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-line bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg transition-colors bg-surface-dim hover:bg-surface-inset"
            title={sidebarOpen ? "Hide navigation (⌘B)" : "Show navigation (⌘B)"}
          >
            {sidebarOpen ? <PanelLeftClose size={18} className="text-label" /> : <PanelLeft size={18} className="text-label" />}
          </button>
          {sidebarOpen && (
            <button
              onClick={() => sidebarRef.current?.toggleAll()}
              className="p-2 rounded-lg transition-colors bg-surface-dim hover:bg-surface-inset"
              title={allFoldersCollapsed ? "Expand all folders" : "Collapse all folders"}
            >
              {allFoldersCollapsed ? <FolderClosed size={18} className="text-label" /> : <ChevronsUpDown size={18} className="text-label" />}
            </button>
          )}
          <div className="flex items-center gap-3 cursor-pointer" onClick={navigateHome}>
          {logo && <img src={logo} alt="Meeting Copilot" className="h-9 w-9 rounded-lg" />}
          <div>
            <h1 className="text-base font-bold tracking-tight leading-tight text-heading">
              {branding.title}
            </h1>
            <p className="text-xs text-muted">
              {branding.description}
            </p>
          </div>
          </div>
          {/* J.18.2.3: Project switcher dropdown */}
          <ProjectSwitcher manifest={projectManifest} activeProjectId={activeProjectId} onProjectChange={handleProjectChange} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-dim hover:bg-surface-inset transition-colors text-sm text-muted"
            title="Search (/ or Ctrl+K)"
          >
            <Search size={15} />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline ml-1 px-1 py-0.5 rounded border border-line text-[10px] font-mono">/</kbd>
          </button>
<button
            onClick={() => window.print()}
            className="p-2 rounded-lg transition-colors bg-surface-dim hover:bg-surface-inset"
            title="Print (⌘P)"
          >
            <Printer size={18} className="text-label" />
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-lg transition-colors bg-surface-dim hover:bg-surface-inset"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle size={18} className="text-label" />
          </button>
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg transition-colors bg-surface-dim hover:bg-surface-inset"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun size={18} className="text-amber-fg" /> : <Moon size={18} className="text-label" />}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — overlay on mobile, inline on desktop */}
        {sidebarOpen && (
          <>
            <div className="sidebar-overlay md:hidden" onClick={() => setSidebarOpen(false)} />
            <div className="sidebar-mobile">
              <Sidebar ref={sidebarRef} documents={documents} activeDocId={activeDoc?.id} activeCategory={activeCategory} onSelect={handleSidebarSelect} onSelectCategory={navigateToCategory} onCollapseStateChange={setAllFoldersCollapsed} />
            </div>
          </>
        )}

        {/* Main content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto bg-surface-alt">
          {activeDoc ? (
            <div className="flex">
              <div className="flex-1 min-w-0 p-6 max-w-4xl mx-auto">
                <Breadcrumbs doc={activeDoc} onNavigateHome={navigateHome} onNavigateCategory={navigateToCategory} />

                {activeDoc.type === "markdown" ? (
                  markdownContent ? (
                    <MarkdownRenderer content={markdownContent} onHeadings={setHeadings} />
                  ) : (
                    <div className="py-10 text-muted">Loading document...</div>
                  )
                ) : DashboardComponent ? (
                  <Suspense fallback={<div className="py-10 text-muted">Loading dashboard...</div>}>
                    <DashboardComponent projectJsonUrl={branding.jsonFile ? `/${branding.jsonFile}` : undefined} />
                  </Suspense>
                ) : (
                  <div className="py-10 text-muted">Dashboard not found: {activeDoc.id}</div>
                )}

                {/* Prev / Next navigation */}
                {(() => {
                  const sameCat = documents.filter((d) => d.category === activeDoc.category);
                  const idx = sameCat.findIndex((d) => d.id === activeDoc.id);
                  const prev = idx > 0 ? sameCat[idx - 1] : null;
                  const next = idx < sameCat.length - 1 ? sameCat[idx + 1] : null;
                  if (!prev && !next) return null;
                  return (
                    <div className="flex items-center justify-between mt-10 pt-6 border-t border-line">
                      {prev ? (
                        <button onClick={() => navigateToDoc(prev)} className="flex items-center gap-2 text-sm text-sky-fg hover:underline">
                          <ChevronLeft size={16} /> {prev.title}
                        </button>
                      ) : <span />}
                      {next ? (
                        <button onClick={() => navigateToDoc(next)} className="flex items-center gap-2 text-sm text-sky-fg hover:underline">
                          {next.title} <ChevronRight size={16} />
                        </button>
                      ) : <span />}
                    </div>
                  );
                })()}
              </div>

              {/* Table of Contents (right sidebar, wide screens only) */}
              {activeDoc.type === "markdown" && (
                <TableOfContents headings={headings} />
              )}
            </div>
          ) : activeCategory ? (
            /* Category landing page */
            <div className="p-6">
              <Breadcrumbs category={activeCategory} onNavigateHome={navigateHome} onNavigateCategory={navigateToCategory} />
              <CategoryLanding
                category={activeCategory}
                documents={documents.filter((d) => d.category === activeCategory)}
                onSelectDoc={navigateToDoc}
              />
            </div>
          ) : branding.homeDashboard && dashboardModules[branding.homeDashboard] ? (
            /* Home page: Project dashboard (configured via manifest homeDashboard) */
            <div className="p-6 max-w-7xl mx-auto">
              <Suspense fallback={<div className="py-10 text-muted">Loading dashboard...</div>}>
                {React.createElement(dashboardModules[branding.homeDashboard], {
                  projectJsonUrl: branding.jsonFile ? `/${branding.jsonFile}` : undefined,
                  briefingJsonUrl: branding.briefingJsonFile ? `/${branding.briefingJsonFile}` : undefined,
                })}
              </Suspense>
            </div>
          ) : (
            /* Home landing page: Category grid (default when no homeDashboard configured) */
            <div className="text-center mt-24 px-6">
              {logo && <img src={logo} alt="Meeting Copilot" className="h-20 w-20 mx-auto mb-6 rounded-2xl opacity-60" />}
              <h2 className="text-2xl font-bold mb-2 text-heading">{branding.homeName}</h2>
              <p className="text-muted mb-1">
                {documents.length} artifacts across{" "}
                {new Set(documents.map((d) => d.category)).size} categories
              </p>
              <p className="text-sm text-dim mb-8">
                {documents.filter((d) => d.type === "markdown").length} documents &middot;{" "}
                {documents.filter((d) => d.type === "dashboard").length} interactive dashboards
              </p>

              {/* Category grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
                {Object.entries(
                  documents.reduce((acc, d) => {
                    acc[d.category] = (acc[d.category] || 0) + 1;
                    return acc;
                  }, {})
                )
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([cat, count]) => (
                    <div
                      key={cat}
                      className="px-4 py-3 rounded-lg border border-line bg-surface hover:bg-surface-dim cursor-pointer transition-colors"
                      onClick={() => navigateToCategory(cat)}
                    >
                      <div className="text-sm font-semibold text-heading">{cat}</div>
                      <div className="text-xs text-muted">{count} artifact{count !== 1 ? "s" : ""}</div>
                    </div>
                  ))}
              </div>

              {/* Recent documents */}
              {recentDocs.length > 0 && (
                <div className="max-w-xl mx-auto mt-10 text-left">
                  <h3 className="text-sm font-semibold text-heading mb-3">Recently Viewed</h3>
                  <div className="space-y-1">
                    {recentDocs.map((rd) => {
                      const doc = documents.find((d) => d.id === rd.id);
                      return doc ? (
                        <button
                          key={rd.id}
                          onClick={() => navigateToDoc(doc)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-dim transition-colors text-left"
                        >
                          <span className="text-sm text-heading truncate">{rd.title}</span>
                          <span className="text-[11px] text-dim ml-auto whitespace-nowrap">{rd.category}</span>
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <p className="text-xs text-dim mt-8">
                Press <kbd className="px-1.5 py-0.5 rounded border border-line font-mono">/</kbd> to search
                &middot; <kbd className="px-1.5 py-0.5 rounded border border-line font-mono">?</kbd> for shortcuts
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between px-5 py-2.5 border-t border-line text-xs text-muted bg-surface shrink-0">
        <span>&copy; 2026 AI Meeting Copilot. All rights reserved.</span>
        <span>Startup Weekend Orlando 2026</span>
        <span>{branding.footer}</span>
      </footer>

      {/* Search overlay */}
      <SearchPanel
        documents={documents}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={navigateToDoc}
      />

      {/* Help modal */}
      {/* Presentation mode overlay */}
      {presentationMode && (
        <PresentationMode
          content={markdownContent}
          title={activeDoc?.title || "Presentation"}
          onExit={() => setPresentationMode(false)}
        />
      )}

      {showHelp && <ShortcutsModal onClose={() => setShowHelp(false)} />}

      {/* Back to top */}
      {showBackToTop && (
        <button
          className="back-to-top"
          onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          title="Back to top"
        >
          <ArrowUp size={18} />
        </button>
      )}

      {/* Zoom / Lightbox overlay */}
      {zoomContent && (
        <div className="zoom-overlay" onClick={() => setZoomContent(null)}>
          {zoomContent.type === "diagram" ? (
            <div
              onClick={(e) => e.stopPropagation()}
              dangerouslySetInnerHTML={{ __html: zoomContent.html }}
            />
          ) : (
            <img src={zoomContent.src} alt={zoomContent.alt} onClick={(e) => e.stopPropagation()} />
          )}
          <button
            className="fixed top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            onClick={() => setZoomContent(null)}
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Viewer />);
