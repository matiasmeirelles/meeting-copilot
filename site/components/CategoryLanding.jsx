/**
 * A.2.5: Dynamic category landing page.
 * Renders a content-type-aware listing of all documents in a category,
 * with audience badges, type icons, and subcategory grouping.
 */
import React from "react";
import { FileText, BarChart3, Users, Shield, Cpu, BookOpen } from "lucide-react";

/** Audience badge colors (matches MarkdownRenderer) */
const AUDIENCE_COLORS = {
  user: "bg-blue-tint text-blue-fg border border-blue-line",
  executive: "bg-purple-tint text-purple-fg border border-purple-line",
  technical: "bg-emerald-tint text-emerald-fg border border-emerald-line",
  contributor: "bg-amber-tint text-amber-fg border border-amber-line",
  compliance: "bg-red-tint text-red-fg border border-red-line",
};

/** Category description hints based on category name */
const CATEGORY_DESCRIPTIONS = {
  Executive: "Strategic briefings and decision-support materials for leadership.",
  Market: "Market analysis, competitive landscape, and opportunity assessments.",
  Architecture: "System architecture, design decisions, and technical specifications.",
  Compliance: "Regulatory compliance frameworks, audit readiness, and quality controls.",
  Operations: "Operational procedures, workflows, and process documentation.",
  System: "Interactive system dashboards, data models, and technical visualizers.",
  Business: "Business cases, revenue models, and investment analysis tools.",
  Planning: "Implementation planning, roadmaps, and project coordination.",
  Product: "Product specifications, feature definitions, and requirements.",
  Reference: "Technical reference materials, standards, and configuration guides.",
  Research: "Research findings, literature reviews, and exploratory analysis.",
  Agents: "AI agent definitions, orchestration patterns, and automation.",
  "State Machine": "Work order lifecycle states, transitions, and validation rules.",
  "Project Tracking": "Sprint tracks, task breakdowns, and implementation progress.",
  "Analysis": "Gap analyses, completeness audits, and coverage assessments.",
  "Prompts": "AI prompt templates for research, analysis, and document generation.",
  "Configuration": "System prompts, configuration schemas, and platform settings.",
};

/** Pick an icon for the category */
function CategoryIcon({ category }) {
  const iconMap = {
    Executive: Users,
    Compliance: Shield,
    System: Cpu,
    Architecture: Cpu,
    Research: BookOpen,
  };
  const Icon = iconMap[category] || FileText;
  return <Icon size={24} className="text-sky-fg" />;
}

export default function CategoryLanding({ category, documents, onSelectDoc }) {
  if (!category || !documents.length) return null;

  const markdownDocs = documents.filter((d) => d.type === "markdown");
  const dashboards = documents.filter((d) => d.type === "dashboard");
  const description = CATEGORY_DESCRIPTIONS[category] || "";
  const audiences = [...new Set(documents.map((d) => d.audience || "technical"))];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Category header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-tint border border-sky-line">
          <CategoryIcon category={category} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-heading">{category}</h2>
          {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 mb-6 rounded-lg bg-surface-dim border border-line text-xs">
        <span className="text-label font-medium">
          {documents.length} artifact{documents.length !== 1 ? "s" : ""}
        </span>
        {markdownDocs.length > 0 && (
          <span className="text-muted">{markdownDocs.length} document{markdownDocs.length !== 1 ? "s" : ""}</span>
        )}
        {dashboards.length > 0 && (
          <span className="text-muted">{dashboards.length} dashboard{dashboards.length !== 1 ? "s" : ""}</span>
        )}
        <span className="ml-auto flex gap-1.5">
          {audiences.map((a) => (
            <span key={a} className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${AUDIENCE_COLORS[a] || AUDIENCE_COLORS.technical}`}>
              {a}
            </span>
          ))}
        </span>
      </div>

      {/* Documents section */}
      {markdownDocs.length > 0 && (
        <div className="mb-8">
          {dashboards.length > 0 && (
            <h3 className="text-sm font-semibold text-label uppercase tracking-wider mb-3">Documents</h3>
          )}
          <div className="space-y-2">
            {markdownDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                className="flex items-start gap-3 px-4 py-3 rounded-lg border border-line bg-surface hover:bg-surface-dim cursor-pointer transition-colors group"
              >
                <FileText size={16} className="mt-0.5 text-muted group-hover:text-sky-fg shrink-0 transition-colors" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-heading group-hover:text-sky-fg transition-colors truncate">
                      {doc.title}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${AUDIENCE_COLORS[doc.audience] || AUDIENCE_COLORS.technical}`}>
                      {doc.audience || "technical"}
                    </span>
                  </div>
                  {doc.summary && (
                    <p className="text-xs text-muted mt-0.5 line-clamp-2">{doc.summary}</p>
                  )}
                </div>
                {doc.status && doc.status !== "active" && (
                  <span className="text-[10px] text-dim shrink-0">{doc.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboards section */}
      {dashboards.length > 0 && (
        <div className="mb-8">
          {markdownDocs.length > 0 && (
            <h3 className="text-sm font-semibold text-label uppercase tracking-wider mb-3">Interactive Dashboards</h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dashboards.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-line bg-surface hover:bg-surface-dim cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-tint border border-emerald-line shrink-0">
                  <BarChart3 size={16} className="text-emerald-fg" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-heading group-hover:text-sky-fg transition-colors truncate block">
                    {doc.title}
                  </span>
                  <span className="text-[11px] text-muted">Interactive</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
