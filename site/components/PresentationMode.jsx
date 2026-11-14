/**
 * A.3.1-A.3.4: Fullscreen presentation mode with slide progression, keyboard nav, and timer.
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Clock, Grid3X3, Maximize2 } from "lucide-react";
import MarkdownRenderer, { extractSections } from "./MarkdownRenderer.jsx";

export default function PresentationMode({ content, title, onExit }) {
  const [sections, setSections] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showOverview, setShowOverview] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (content) {
      setSections(extractSections(content));
      setCurrentIdx(0);
      startTime.current = Date.now();
      setElapsed(0);
    }
  }, [content]);

  // Timer
  useEffect(() => {
    if (!showTimer) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [showTimer]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Keyboard navigation
  const handleKey = useCallback(
    (e) => {
      if (showOverview) {
        if (e.key === "Escape" || e.key === "o" || e.key === "O") setShowOverview(false);
        return;
      }
      switch (e.key) {
        case "Escape":
          onExit();
          break;
        case "ArrowRight":
        case " ":
          e.preventDefault();
          setCurrentIdx((i) => Math.min(i + 1, sections.length - 1));
          break;
        case "ArrowLeft":
          setCurrentIdx((i) => Math.max(i - 1, 0));
          break;
        case "Home":
          setCurrentIdx(0);
          break;
        case "End":
          setCurrentIdx(sections.length - 1);
          break;
        case "t":
        case "T":
          setShowTimer((v) => !v);
          break;
        case "o":
        case "O":
          setShowOverview(true);
          break;
      }
    },
    [sections, onExit, showOverview]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Request fullscreen on enter
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  if (!sections.length) return null;

  const section = sections[currentIdx];

  // Overview grid
  if (showOverview) {
    return (
      <div className="fixed inset-0 z-[100] bg-surface-alt p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-heading">{title} — Sections</h2>
          <button onClick={() => setShowOverview(false)} className="p-2 rounded-lg hover:bg-surface-dim">
            <X size={20} className="text-muted" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {sections.map((s, i) => (
            <div
              key={i}
              onClick={() => {
                setCurrentIdx(i);
                setShowOverview(false);
              }}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                i === currentIdx
                  ? "border-sky-400 bg-sky-tint"
                  : "border-line hover:border-sky-line hover:bg-surface"
              }`}
            >
              <div className="text-xs text-dim mb-1">Section {i + 1}</div>
              <div className="text-sm font-semibold text-heading truncate">{s.title}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-surface flex flex-col">
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0">
        <span className="text-sm text-muted">{title}</span>
        <div className="flex items-center gap-3">
          {showTimer && (
            <span className="text-xs font-mono text-dim flex items-center gap-1">
              <Clock size={13} /> {formatTime(elapsed)}
            </span>
          )}
          <span className="text-xs text-dim">
            {currentIdx + 1} / {sections.length}
          </span>
          <button onClick={() => setShowOverview(true)} className="p-1.5 rounded hover:bg-surface-dim" title="Overview (O)">
            <Grid3X3 size={16} className="text-muted" />
          </button>
          <button onClick={onExit} className="p-1.5 rounded hover:bg-surface-dim" title="Exit (Esc)">
            <X size={16} className="text-muted" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center px-8 py-6">
        <div className="w-full max-w-3xl">
          <h2 className="text-3xl font-bold text-heading mb-8">{section.title}</h2>
          <div className="presentation-content">
            <MarkdownRenderer content={`---\n---\n${section.content}`} />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-dim shrink-0">
        <div
          className="h-full bg-sky-fg transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / sections.length) * 100}%` }}
        />
      </div>

      {/* Navigation arrows (sides) */}
      {currentIdx > 0 && (
        <button
          onClick={() => setCurrentIdx((i) => i - 1)}
          className="fixed left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-surface-dim/80 hover:bg-surface-inset transition-colors"
        >
          <ChevronLeft size={24} className="text-muted" />
        </button>
      )}
      {currentIdx < sections.length - 1 && (
        <button
          onClick={() => setCurrentIdx((i) => i + 1)}
          className="fixed right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-surface-dim/80 hover:bg-surface-inset transition-colors"
        >
          <ChevronRight size={24} className="text-muted" />
        </button>
      )}
    </div>
  );
}
