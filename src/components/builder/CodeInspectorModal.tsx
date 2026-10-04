import React, { useState } from "react";
import { X, Code2, Copy, Check, Terminal, FileCode2, Download, Layers } from "lucide-react";
import {
  toHTML,
  toReactTailwind,
  toNextJsPage,
  toWordPressGutenberg,
  toVueSfc,
  toAstroComponent,
  type BNode,
} from "./types";

interface CodeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: BNode | null;
  pageRoot: BNode;
  customCss: string;
  onUpdateCustomCss: (css: string) => void;
  pageTitle?: string;
  pageDescription?: string;
}

export function CodeInspectorModal({
  isOpen,
  onClose,
  selectedNode,
  pageRoot,
  customCss,
  onUpdateCustomCss,
  pageTitle = "Canvas Website",
  pageDescription = "Built with Canvas Visual Website Builder",
}: CodeInspectorModalProps) {
  const [activeTab, setActiveTab] = useState<
    "element" | "full" | "react" | "nextjs" | "vue" | "astro" | "wordpress" | "customCss"
  >(selectedNode ? "element" : "react");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const elementHtml = selectedNode ? toHTML(selectedNode) : "";
  const fullHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDescription}">
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; }
    ${customCss}
  </style>
</head>
<body>
${toHTML(pageRoot)}
</body>
</html>`;

  const reactCode = toReactTailwind(selectedNode && activeTab === "element" ? selectedNode : pageRoot, "CanvasPage");
  const nextJsCode = toNextJsPage(pageRoot, pageTitle, pageDescription);
  const vueCode = toVueSfc(pageRoot, customCss);
  const astroCode = toAstroComponent(pageRoot, pageTitle);
  const wpCode = toWordPressGutenberg(pageRoot);

  const getActiveCode = () => {
    switch (activeTab) {
      case "element":
        return elementHtml;
      case "full":
        return fullHtml;
      case "react":
        return reactCode;
      case "nextjs":
        return nextJsCode;
      case "vue":
        return vueCode;
      case "astro":
        return astroCode;
      case "wordpress":
        return wpCode;
      default:
        return customCss;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadActiveFile = () => {
    const content = getActiveCode();
    const filename =
      activeTab === "react"
        ? "CanvasPage.tsx"
        : activeTab === "nextjs"
        ? "page.tsx"
        : activeTab === "vue"
        ? "CanvasPage.vue"
        : activeTab === "astro"
        ? "index.astro"
        : activeTab === "wordpress"
        ? "wordpress-gutenberg-block.html"
        : activeTab === "customCss"
        ? "styles.css"
        : "index.html";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-[#1c1917] border border-[#3c3836] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3836] bg-[#221f1d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Code2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                Code Export: HTML, React + Tailwind (.tsx) & Next.js
                <span className="text-[11px] font-normal text-orange-400">
                  Developer Mode
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Export production-ready React (.tsx), Next.js App Router, standalone HTML, or inject live CSS.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center justify-between border-b border-[#3c3836] bg-[#191716] px-6 overflow-x-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab("react")}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                activeTab === "react"
                  ? "border-orange-500 text-orange-400 bg-orange-500/5"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              <Layers size={14} />
              React + Tailwind (.tsx)
            </button>
            <button
              onClick={() => setActiveTab("nextjs")}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                activeTab === "nextjs"
                  ? "border-orange-500 text-orange-400 bg-orange-500/5"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              <FileCode2 size={14} />
              Next.js (app/page.tsx)
            </button>
            <button
              onClick={() => setActiveTab("vue")}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                activeTab === "vue"
                  ? "border-orange-500 text-orange-400 bg-orange-500/5"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              <FileCode2 size={14} />
              Vue 3 (.vue)
            </button>
            <button
              onClick={() => setActiveTab("astro")}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                activeTab === "astro"
                  ? "border-orange-500 text-orange-400 bg-orange-500/5"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              <FileCode2 size={14} />
              Astro (.astro)
            </button>
            <button
              onClick={() => setActiveTab("wordpress")}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                activeTab === "wordpress"
                  ? "border-orange-500 text-orange-400 bg-orange-500/5"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              <FileCode2 size={14} />
              WordPress Gutenberg
            </button>
            <button
              onClick={() => setActiveTab("full")}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                activeTab === "full"
                  ? "border-orange-500 text-orange-400 bg-orange-500/5"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              <FileCode2 size={14} />
              Full HTML5
            </button>
            <button
              onClick={() => setActiveTab("element")}
              disabled={!selectedNode}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                activeTab === "element"
                  ? "border-orange-500 text-orange-400 bg-orange-500/5"
                  : selectedNode
                  ? "border-transparent text-stone-400 hover:text-stone-200"
                  : "border-transparent text-stone-600 cursor-not-allowed"
              }`}
            >
              <Terminal size={14} />
              Selected Element
            </button>
            <button
              onClick={() => setActiveTab("customCss")}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                activeTab === "customCss"
                  ? "border-orange-500 text-orange-400 bg-orange-500/5"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              <Code2 size={14} />
              Custom CSS Injector
            </button>
          </div>

          <div className="flex items-center gap-2 py-1.5">
            {activeTab !== "customCss" && (
              <button
                type="button"
                onClick={() => copyToClipboard(getActiveCode())}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={downloadActiveFile}
              className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download size={13} />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#121110]">
          {activeTab === "react" && (
            <div>
              <div className="mb-2 text-[11px] font-mono text-stone-400 flex items-center justify-between">
                <span>File: CanvasPage.tsx (React 19 + Tailwind CSS)</span>
                <span className="text-orange-400">Ready for Vite / CRA</span>
              </div>
              <pre className="p-4 bg-[#0a0a0c] border border-stone-800 rounded-xl text-xs font-mono text-sky-300 overflow-x-auto leading-relaxed max-h-[50vh] select-all">
                {reactCode}
              </pre>
            </div>
          )}

          {activeTab === "nextjs" && (
            <div>
              <div className="mb-2 text-[11px] font-mono text-stone-400 flex items-center justify-between">
                <span>File: app/page.tsx (Next.js App Router + SEO Metadata)</span>
                <span className="text-emerald-400">Server Component Ready</span>
              </div>
              <pre className="p-4 bg-[#0a0a0c] border border-stone-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-[50vh] select-all">
                {nextJsCode}
              </pre>
            </div>
          )}

          {activeTab === "vue" && (
            <div>
              <div className="mb-2 text-[11px] font-mono text-stone-400 flex items-center justify-between">
                <span>File: CanvasPage.vue (Vue 3 Single File Component)</span>
                <span className="text-emerald-400">Vue 3 + Nuxt Ready</span>
              </div>
              <pre className="p-4 bg-[#0a0a0c] border border-stone-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-[50vh] select-all">
                {vueCode}
              </pre>
            </div>
          )}

          {activeTab === "astro" && (
            <div>
              <div className="mb-2 text-[11px] font-mono text-stone-400 flex items-center justify-between">
                <span>File: src/pages/index.astro (Astro Static/SSR Component)</span>
                <span className="text-orange-400">Zero-JS Astro Ready</span>
              </div>
              <pre className="p-4 bg-[#0a0a0c] border border-stone-800 rounded-xl text-xs font-mono text-amber-300 overflow-x-auto leading-relaxed max-h-[50vh] select-all">
                {astroCode}
              </pre>
            </div>
          )}

          {activeTab === "wordpress" && (
            <div>
              <div className="mb-2 text-[11px] font-mono text-stone-400 flex items-center justify-between">
                <span>Format: WordPress Gutenberg Block & Elementor HTML</span>
                <span className="text-sky-400">Paste directly in WP Block Editor</span>
              </div>
              <pre className="p-4 bg-[#0a0a0c] border border-stone-800 rounded-xl text-xs font-mono text-sky-300 overflow-x-auto leading-relaxed max-h-[50vh] select-all">
                {wpCode}
              </pre>
            </div>
          )}

          {activeTab === "element" && (
            <div>
              <div className="mb-2 text-[11px] font-mono text-stone-400 flex items-center justify-between">
                <span>Tag: &lt;{selectedNode?.type}&gt; | ID: #{selectedNode?.id}</span>
                <span className="text-stone-500">Live generated HTML</span>
              </div>
              <pre className="p-4 bg-[#0a0a0c] border border-stone-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed select-all">
                {elementHtml}
              </pre>
            </div>
          )}

          {activeTab === "full" && (
            <div>
              <div className="mb-2 text-[11px] font-mono text-stone-400">
                Full standalone HTML document (ready for deployment):
              </div>
              <pre className="p-4 bg-[#0a0a0c] border border-stone-800 rounded-xl text-xs font-mono text-stone-300 overflow-x-auto leading-relaxed max-h-[50vh] select-all">
                {fullHtml}
              </pre>
            </div>
          )}

          {activeTab === "customCss" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-300">
                <span className="font-semibold">Write Custom CSS Styles (Live Injected):</span>
                <span className="text-[11px] text-stone-500">e.g. .bnode:hover {`{ transform: scale(1.02); }`}</span>
              </div>
              <textarea
                rows={12}
                value={customCss}
                onChange={(e) => onUpdateCustomCss(e.target.value)}
                placeholder="/* Add custom CSS rules here */"
                className="w-full bg-[#0a0a0c] border border-stone-800 focus:border-orange-500 rounded-xl p-4 font-mono text-xs text-amber-300 placeholder:text-stone-600 focus:outline-none leading-relaxed"
              />
              <p className="text-[11px] text-stone-400">
                Any styles written here are immediately applied to the live canvas preview and exported into your production HTML & ZIP!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
