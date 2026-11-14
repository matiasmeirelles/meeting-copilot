/**
 * J.18.4: Multi-project switcher dropdown for the Web Publishing Platform.
 *
 * Features:
 * - Loads project list from /project-manifest.json (J.18.4.1)
 * - Persists selection to localStorage + URL query param ?project= (J.18.4.2)
 * - On switch: calls onProjectChange with new project config (J.18.4.3)
 * - Shows project badge when multiple projects registered (J.18.4.4)
 * - Hides completely in single-project mode (J.18.4.5)
 * - "All Projects" option to view documents from all projects
 * - Per-project publish.json loading via publishJsonFile field
 */
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Layers } from "lucide-react";

export const ALL_PROJECTS_ID = "__all__";

export default function ProjectSwitcher({ manifest, activeProjectId, onProjectChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click (must be before any early returns — React Rules of Hooks)
  useEffect(function() {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return function() { document.removeEventListener("mousedown", handleClick); };
  }, [open]);

  // J.18.4.5: Hide in single-project mode
  if (!manifest || !manifest.projects || manifest.projects.length <= 1) {
    return null;
  }

  const activeProject = activeProjectId === ALL_PROJECTS_ID
    ? { id: ALL_PROJECTS_ID, name: "All Projects", description: "All projects combined" }
    : manifest.projects.find(function(p) { return p.id === activeProjectId; });

  function handleSelect(project) {
    setOpen(false);
    if (project.id === activeProjectId) return;

    // J.18.4.2: Persist to localStorage
    try { localStorage.setItem("mc-active-project", project.id); } catch(e) {}

    // J.18.4.2: Update URL query param
    var url = new URL(window.location);
    url.searchParams.set("project", project.id);
    window.history.replaceState({}, "", url);

    // J.18.4.3: Notify parent
    if (onProjectChange) onProjectChange(project);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* J.18.4.4: Project badge + dropdown trigger */}
      <button
        onClick={function() { setOpen(!open); }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-dim hover:bg-surface-inset transition-colors text-sm"
        title="Switch project"
      >
        <Layers size={14} className="text-sky-fg" />
        <span className="font-medium text-heading max-w-[120px] truncate">
          {activeProject ? activeProject.name : activeProjectId}
        </span>
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 rounded-lg border border-line bg-surface shadow-xl z-50 py-1">
          {/* All Projects option */}
          <button
            onClick={function() { handleSelect({ id: ALL_PROJECTS_ID, name: "All Projects", description: "All projects combined" }); }}
            className={`w-full text-left px-4 py-2.5 transition-colors border-b border-line ${
              activeProjectId === ALL_PROJECTS_ID
                ? "bg-sky-tint text-sky-fg"
                : "hover:bg-surface-dim text-label"
            }`}
          >
            <div className="text-sm font-medium">All Projects</div>
            <div className="text-[11px] text-muted mt-0.5">{manifest.projects.length} projects</div>
          </button>
          {manifest.projects.map(function(project) {
            var isActive = project.id === activeProjectId;
            return (
              <button
                key={project.id}
                onClick={function() { handleSelect(project); }}
                className={`w-full text-left px-4 py-2.5 transition-colors ${
                  isActive
                    ? "bg-sky-tint text-sky-fg"
                    : "hover:bg-surface-dim text-label"
                }`}
              >
                <div className="text-sm font-medium">{project.name}</div>
                {project.description && (
                  <div className="text-[11px] text-muted mt-0.5 truncate">{project.description}</div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Resolve initial project from URL query param, localStorage, or manifest default.
 * Returns the project ID string.
 */
export function resolveInitialProject(manifest) {
  if (!manifest || !manifest.projects || manifest.projects.length === 0) return null;

  // 1. URL query param takes precedence
  var url = new URL(window.location);
  var fromUrl = url.searchParams.get("project");
  if (fromUrl === ALL_PROJECTS_ID) return ALL_PROJECTS_ID;
  if (fromUrl && manifest.projects.some(function(p) { return p.id === fromUrl; })) {
    return fromUrl;
  }

  // 2. localStorage
  try {
    var fromStorage = localStorage.getItem("mc-active-project");
    if (fromStorage === ALL_PROJECTS_ID) return ALL_PROJECTS_ID;
    if (fromStorage && manifest.projects.some(function(p) { return p.id === fromStorage; })) {
      return fromStorage;
    }
  } catch(e) {}

  // 3. Manifest default
  if (manifest.defaultProject) return manifest.defaultProject;

  // 4. First project
  return manifest.projects[0].id;
}
