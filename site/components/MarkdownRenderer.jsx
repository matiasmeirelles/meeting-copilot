/**
 * A.1.2: MarkdownRenderer component with frontmatter extraction, syntax highlighting,
 * GFM tables, math equations, and responsive rendering.
 */
import React, { useState, useEffect, useMemo } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import mermaid from "mermaid";
/**
 * Browser-compatible frontmatter extraction.
 * Replaces gray-matter (Node.js only — uses Buffer which crashes in browsers).
 * Parses YAML frontmatter between --- delimiters into a plain object.
 */
function parseFrontmatter(src) {
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: src };
  const yaml = match[1];
  const content = match[2];
  const data = {};
  let currentKey = null;
  let currentList = null;
  for (const line of yaml.split("\n")) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kvMatch) {
      if (currentKey && currentList) data[currentKey] = currentList;
      currentList = null;
      const [, key, rawVal] = kvMatch;
      currentKey = key;
      const val = rawVal.replace(/^['"]|['"]$/g, "").trim();
      if (val === "" || val === "|" || val === ">") {
        data[key] = "";
      } else {
        data[key] = val;
      }
    } else if (line.match(/^\s+-\s+(.*)$/)) {
      const item = line.match(/^\s+-\s+(.*)$/)[1].replace(/^['"]|['"]$/g, "").trim();
      if (!currentList) currentList = [];
      currentList.push(item);
    }
  }
  if (currentKey && currentList) data[currentKey] = currentList;
  return { data, content };
}

/**
 * Custom rehype plugin: external links open in new tab, malformed anchors sanitized.
 * - External (http/https): adds target="_blank" rel="noopener noreferrer"
 * - Malformed anchors (#, # , #), etc.): removes href to prevent broken navigation
 */
function rehypeWppLinks() {
  function walk(node) {
    if (node.type === "element" && node.tagName === "a" && node.properties) {
      const href = String(node.properties.href || "");
      if (href.startsWith("http://") || href.startsWith("https://")) {
        node.properties.target = "_blank";
        node.properties.rel = "noopener noreferrer";
      } else if (href.startsWith("#") && /^#[\s().,;:]*$/.test(href)) {
        delete node.properties.href;
      }
    }
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  }
  return (tree) => walk(tree);
}

/** Build the unified processor (memoized) */
function createProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkGfm)
    .use(remarkMath, { singleDollarTextMath: false })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeHighlight, { ignoreMissing: true })
    .use(rehypeKatex)
    .use(rehypeWppLinks)
    .use(rehypeStringify);
}

const processor = createProcessor();

/** Audience badge colors */
const AUDIENCE_COLORS = {
  user: "bg-blue-tint text-blue-fg border border-blue-line",
  executive: "bg-indigo-tint text-indigo-fg border border-indigo-line",
  technical: "bg-emerald-tint text-emerald-fg border border-emerald-line",
  contributor: "bg-sky-tint text-sky-fg border border-sky-line",
  compliance: "bg-red-tint text-red-fg border border-red-line",
};

/** Metadata header bar */
function MetadataBar({ frontmatter, wordCount }) {
  if (!frontmatter) return null;
  const audience = frontmatter.audience || "technical";
  const badgeClass = AUDIENCE_COLORS[audience] || AUDIENCE_COLORS.technical;
  const readingTime = wordCount > 0 ? Math.ceil(wordCount / 200) : 0;

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 mb-6 rounded-lg bg-surface-dim border border-line text-xs">
      {frontmatter.title && (
        <span className="font-semibold text-heading text-sm">{frontmatter.title}</span>
      )}
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeClass}`}>
        {audience}
      </span>
      {frontmatter.category && (
        <span className="px-2 py-0.5 rounded-full bg-surface-inset text-label text-[11px]">
          {frontmatter.category}
        </span>
      )}
      {frontmatter.status && (
        <span className="text-muted">{frontmatter.status}</span>
      )}
      <span className="text-dim ml-auto flex items-center gap-3">
        {readingTime > 0 && <span>{readingTime} min read</span>}
        {wordCount > 0 && <span>{wordCount.toLocaleString()} words</span>}
      </span>
    </div>
  );
}

/** Copy button for code blocks (skip mermaid blocks) */
function addCopyButtons(container) {
  if (!container) return;
  container.querySelectorAll("pre > code").forEach((codeBlock) => {
    if (codeBlock.classList.contains("language-mermaid")) return;
    const pre = codeBlock.parentElement;
    if (pre.querySelector(".copy-btn")) return;
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.onclick = () => {
      navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = "Copy"; }, 2000);
      });
    };
    pre.style.position = "relative";
    pre.appendChild(btn);
  });
}

/** Mermaid theme variables for dark and light modes */
const mermaidDarkTheme = {
  background: "transparent",
  darkMode: true,
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "13px",
  primaryColor: "#1c3048", primaryTextColor: "#d8dee6", primaryBorderColor: "#5a8ab4",
  secondaryColor: "#1a2636", secondaryTextColor: "#d8dee6", secondaryBorderColor: "#6a8098",
  tertiaryColor: "#182e2e", tertiaryTextColor: "#d8dee6", tertiaryBorderColor: "#508888",
  lineColor: "#8a95a5", textColor: "#d8dee6",
  mainBkg: "#1c3048", nodeBorder: "#5a8ab4", nodeTextColor: "#d8dee6",
  clusterBkg: "#10151e80", clusterBorder: "#3a4454",
  titleColor: "#d8dee6", edgeLabelBackground: "#10151e", labelTextColor: "#d8dee6", labelBackground: "#10151e",
  actorBkg: "#182230", actorBorder: "#5a8ab4", actorTextColor: "#d8dee6", actorLineColor: "#8a95a5",
  signalColor: "#8a95a5", signalTextColor: "#d8dee6",
  labelBoxBkgColor: "#182230", labelBoxBorderColor: "#4a5568",
  loopTextColor: "#d8dee6", activationBorderColor: "#5a8ab4", activationBkgColor: "#1c3048",
  sequenceNumberColor: "#d8dee6", noteBkgColor: "#283848", noteBorderColor: "#4a5568", noteTextColor: "#d8dee6",
  classText: "#d8dee6",
  fillType0: "#1c3048", fillType1: "#1a2636", fillType2: "#182e2e", fillType3: "#24303a",
  fillType4: "#1c3048", fillType5: "#1a2636", fillType6: "#182e2e", fillType7: "#24303a",
  labelColor: "#d8dee6", altBackground: "#182230",
  compositeBackground: "#10151e80", compositeBorder: "#3a4454", compositeTitleBackground: "#182230",
  relationColor: "#8a95a5", relationLabelBackground: "#10151e", relationLabelColor: "#d8dee6",
};

const mermaidLightTheme = {
  background: "transparent",
  darkMode: false,
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: "13px",
  primaryColor: "#dbeafe", primaryTextColor: "#1a1f2b", primaryBorderColor: "#3b82f6",
  secondaryColor: "#e2e8f0", secondaryTextColor: "#1a1f2b", secondaryBorderColor: "#94a3b8",
  tertiaryColor: "#ccfbf1", tertiaryTextColor: "#1a1f2b", tertiaryBorderColor: "#0d9488",
  lineColor: "#6e7a8a", textColor: "#1a1f2b",
  mainBkg: "#dbeafe", nodeBorder: "#3b82f6", nodeTextColor: "#1a1f2b",
  clusterBkg: "#f1f5f980", clusterBorder: "#dfe3e8",
  titleColor: "#1a1f2b", edgeLabelBackground: "#ffffff", labelTextColor: "#1a1f2b", labelBackground: "#ffffff",
  actorBkg: "#f8f9fa", actorBorder: "#3b82f6", actorTextColor: "#1a1f2b", actorLineColor: "#6e7a8a",
  signalColor: "#6e7a8a", signalTextColor: "#1a1f2b",
  labelBoxBkgColor: "#f8f9fa", labelBoxBorderColor: "#dfe3e8",
  loopTextColor: "#1a1f2b", activationBorderColor: "#3b82f6", activationBkgColor: "#dbeafe",
  sequenceNumberColor: "#1a1f2b", noteBkgColor: "#fef9c3", noteBorderColor: "#facc15", noteTextColor: "#1a1f2b",
  classText: "#1a1f2b",
  fillType0: "#dbeafe", fillType1: "#e2e8f0", fillType2: "#ccfbf1", fillType3: "#f1f5f9",
  fillType4: "#dbeafe", fillType5: "#e2e8f0", fillType6: "#ccfbf1", fillType7: "#f1f5f9",
  labelColor: "#1a1f2b", altBackground: "#f8f9fa",
  compositeBackground: "#f1f5f980", compositeBorder: "#dfe3e8", compositeTitleBackground: "#f8f9fa",
  relationColor: "#6e7a8a", relationLabelBackground: "#ffffff", relationLabelColor: "#1a1f2b",
};

/** Initialize mermaid with theme matching the viewer's current mode */
let mermaidLastDark = null;
function initMermaid() {
  const isDark = document.documentElement.classList.contains("dark");
  if (mermaidLastDark === isDark) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: isDark ? mermaidDarkTheme : mermaidLightTheme,
    flowchart: { htmlLabels: true, curve: "basis" },
    sequence: { mirrorActors: false },
  });
  mermaidLastDark = isDark;
}


export default function MarkdownRenderer({ content, onHeadings }) {
  const [html, setHtml] = useState("");
  const [frontmatter, setFrontmatter] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const contentRef = React.useRef(null);

  useEffect(() => {
    if (!content) return;
    const { data, content: body } = parseFrontmatter(content);
    setFrontmatter(data);
    setWordCount(body.split(/\s+/).filter(Boolean).length);

    processor.process(body).then(async (result) => {
      let htmlStr = String(result);
      // Pre-render mermaid diagrams into the HTML string before React sees it.
      // DOM mutation after dangerouslySetInnerHTML gets overwritten by re-renders.
      initMermaid();
      const mermaidRegex = /<pre><code class="[^"]*language-mermaid[^"]*">([\s\S]*?)<\/code><\/pre>/g;
      const replacements = [];
      let match;
      while ((match = mermaidRegex.exec(htmlStr)) !== null) {
        // Strip highlight spans and decode ALL HTML entities via browser
        const raw = match[1].replace(/<[^>]*>/g, "");
        const decoder = document.createElement("textarea");
        decoder.innerHTML = raw;
        const source = decoder.textContent;
        try {
          const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
          let { svg } = await mermaid.render(id, source);
          // Strip mermaid's injected SVG background — keep diagram content untouched
          svg = svg.replace(/(<svg[^>]*?)style="([^"]*)"/, (m, pre, style) => {
            const cleaned = style.replace(/background[^;]*(;|$)/g, "background:transparent;");
            return `${pre}style="${cleaned}"`;
          });
          replacements.push({ original: match[0], replacement: `<div class="mermaid-diagram">${svg}</div>` });
        } catch (err) {
          replacements.push({
            original: match[0],
            replacement: `<div class="mermaid-error">Mermaid error: ${err.message}</div>${match[0]}`,
          });
        }
      }
      for (const { original, replacement } of replacements) {
        htmlStr = htmlStr.replace(original, replacement);
      }
      setHtml(htmlStr);
    });
  }, [content]);

  // Extract headings for TOC after render
  useEffect(() => {
    if (!contentRef.current || !onHeadings) return;
    const headings = [];
    contentRef.current.querySelectorAll("h2, h3").forEach((el) => {
      headings.push({
        id: el.id,
        text: el.textContent,
        level: parseInt(el.tagName[1]),
      });
    });
    onHeadings(headings);
  }, [html, onHeadings]);

  // Add copy buttons after HTML render
  useEffect(() => {
    addCopyButtons(contentRef.current);
  }, [html]);

  return (
    <div>
      <MetadataBar frontmatter={frontmatter} wordCount={wordCount} />
      <div
        ref={contentRef}
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

/** Extract H2 sections from markdown content for presentation mode */
export function extractSections(content) {
  if (!content) return [];
  const { content: body } = parseFrontmatter(content);
  const sections = [];
  let current = { title: "Introduction", content: "" };

  for (const line of body.split("\n")) {
    if (line.startsWith("## ")) {
      if (current.content.trim()) sections.push(current);
      current = { title: line.replace(/^## /, ""), content: "" };
    } else {
      current.content += line + "\n";
    }
  }
  if (current.content.trim()) sections.push(current);
  return sections;
}
