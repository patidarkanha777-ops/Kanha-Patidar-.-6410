import React, { useState, useRef } from "react";
import {
  Upload,
  FileArchive,
  FileCode,
  CheckCircle2,
  AlertCircle,
  X,
  Code2,
  FolderArchive,
  Download,
  Sparkles,
  ArrowRight,
  Layers,
  Loader2,
  Server,
  RefreshCw,
} from "lucide-react";
import JSZip from "jszip";
import { type BNode, toHTML } from "./types";
import {
  parseUploadedFile,
  htmlToBNode,
  countNodes,
  extractStylesFromHtml,
  downloadZipArchive,
  type ParseResult,
  type PreservedZipEntry,
  type ZipExtractionProgress,
} from "./importer";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (importedPage: BNode, mode: "replace" | "append", meta?: ParseResult) => void;
  currentPage: BNode;
  customCss?: string;
  preservedEntries?: PreservedZipEntry[];
  onUpdatePreservedEntries?: (entries: PreservedZipEntry[]) => void;
  mainHtmlPath?: string;
  mainCssPath?: string;
}

export function UploadModal({
  isOpen,
  onClose,
  onImport,
  currentPage,
  customCss = "",
  preservedEntries = [],
  onUpdatePreservedEntries,
  mainHtmlPath,
  mainCssPath,
}: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "paste" | "export">("file");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<ZipExtractionProgress | null>(null);
  const [syncingBackend, setSyncingBackend] = useState(false);
  const [syncSummary, setSyncSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null);
  const [pastedCode, setPastedCode] = useState("");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setError(null);
    setLoading(true);
    setParsedResult(null);
    setExtractionProgress({
      stage: "reading",
      percent: 5,
      message: `Opening "${file.name}"...`,
      processedFiles: 0,
      totalFiles: 0,
      imagesCount: 0,
      backendCount: 0,
    });

    try {
      const result = await parseUploadedFile(file, (p) => {
        setExtractionProgress(p);
      });
      setParsedResult(result);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to parse uploaded file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    setError(null);
    if (!pastedCode.trim()) {
      setError("Please paste some HTML code first.");
      return;
    }

    try {
      const page = htmlToBNode(pastedCode);
      const extractedCss = extractStylesFromHtml(pastedCode);
      const totalElements = countNodes(page);
      setParsedResult({
        page,
        filename: "Pasted Code Snippet",
        elementCount: totalElements,
        imagesCount: 0,
        filesList: ["code.html"],
        fileType: "html",
        extractedCss,
        fullPreviewHtml: pastedCode,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to parse the HTML code.");
    }
  };

  const [downloadingZip, setDownloadingZip] = useState(false);

  const handleDownloadAll = async () => {
    if (!parsedResult?.preservedEntries || parsedResult.preservedEntries.length === 0) return;
    setDownloadingZip(true);
    try {
      const zipName = (parsedResult.filename || "extracted-archive").replace(/\.zip$/i, "") + "-extracted.zip";
      await downloadZipArchive(parsedResult.preservedEntries, zipName);
    } catch (e) {
      console.error(e);
      setError("Failed to download extracted archive.");
    } finally {
      setDownloadingZip(false);
    }
  };

  const applyImport = (mode: "replace" | "append") => {
    if (!parsedResult) return;
    onImport(parsedResult.page, mode, parsedResult);
    onClose();
  };

  const backendEntries = preservedEntries.filter((e) => e.category === "backend" && !e.isBase64);

  const handleAiSyncBackend = async () => {
    if (backendEntries.length === 0) return;
    setSyncingBackend(true);
    setError(null);
    setSyncSummary(null);

    try {
      const targetBackend =
        backendEntries.find((e) => e.path.includes("server.")) ||
        backendEntries.find((e) => e.path.includes("app.")) ||
        backendEntries[0];

      const res = await fetch("/api/ai/sync-backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: toHTML(currentPage),
          css: customCss,
          backendPath: targetBackend.path,
          backendCode: targetBackend.content,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync backend");

      if (data.updatedBackendCode && onUpdatePreservedEntries) {
        const updated = preservedEntries.map((entry) =>
          entry.path === targetBackend.path
            ? { ...entry, content: data.updatedBackendCode }
            : entry
        );
        onUpdatePreservedEntries(updated);
      }
      setSyncSummary(data.summary || `Updated ${targetBackend.path} to match HTML/CSS changes.`);
    } catch (err: any) {
      setError(err?.message || "Failed to sync backend with AI.");
    } finally {
      setSyncingBackend(false);
    }
  };

  const handleExportZip = async () => {
    setLoading(true);
    try {
      const zip = new JSZip();
      const targetHtmlPath = mainHtmlPath || "index.html";
      const cssLinkTag = mainCssPath ? `\n  <link rel="stylesheet" href="${mainCssPath}">` : "";

      const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Canvas Exported Website</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">${cssLinkTag}
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    ${!mainCssPath && customCss ? customCss : ""}
  </style>
</head>
<body>
  ${toHTML(currentPage)}
</body>
</html>`;

      // 1. Restore all original ZIP files (backend, configs, assets, scripts)
      for (const entry of preservedEntries) {
        if (entry.path === targetHtmlPath) continue;
        if (mainCssPath && entry.path === mainCssPath) continue;
        if (entry.isBase64) {
          zip.file(entry.path, entry.content, { base64: true });
        } else {
          zip.file(entry.path, entry.content);
        }
      }

      // 2. Write updated HTML and CSS
      zip.file(targetHtmlPath, html);
      if (mainCssPath && customCss) {
        zip.file(mainCssPath, customCss);
      } else if (customCss) {
        zip.file("styles.css", customCss);
      }

      zip.file("canvas-project.json", JSON.stringify(currentPage, null, 2));
      if (!preservedEntries.some((e) => e.path.toLowerCase() === "readme.md")) {
        zip.file(
          "README.md",
          `# Exported from Canvas Website Builder\n\n- Open \`${targetHtmlPath}\` in any web browser.\n- All original backend and asset files from your uploaded ZIP are preserved.\n- You can re-upload \`canvas-project.json\` or this ZIP file back to Canvas at any time!`
        );
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "canvas-fullstack-website.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Failed to create ZIP export.");
    } finally {
      setLoading(false);
    }
  };

  const insertSampleSnippet = (type: "hero" | "features" | "pricing") => {
    if (type === "hero") {
      setPastedCode(`<section style="padding: 80px 24px; background: linear-gradient(135deg, #1e1e24 0%, #2b2d42 100%); color: #ffffff; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px;">
  <h1 style="font-size: 52px; font-weight: 800; margin: 0; color: #ffffff;">Create Fast, Publish Faster</h1>
  <p style="font-size: 20px; color: #cbd5e1; max-width: 650px; line-height: 1.6; margin: 0;">Build gorgeous responsive landing pages with zero configuration. Upload your code or drag components.</p>
  <div style="display: flex; gap: 12px; margin-top: 10px;">
    <a href="#demo" style="background: #f97316; color: #ffffff; padding: 14px 32px; border-radius: 999px; font-weight: 700; text-decoration: none;">Get Started Free</a>
    <a href="#learn" style="background: transparent; border: 1px solid #cbd5e1; color: #ffffff; padding: 14px 28px; border-radius: 999px; font-weight: 600; text-decoration: none;">Learn More</a>
  </div>
</section>`);
    } else if (type === "features") {
      setPastedCode(`<section style="padding: 60px 20px; background: #f8fafc; display: flex; flex-direction: column; align-items: center; gap: 30px;">
  <h2 style="font-size: 36px; font-weight: 700; color: #0f172a; margin: 0;">Key Capabilities</h2>
  <div style="display: flex; flex-direction: row; gap: 24px; flex-wrap: wrap; justify-content: center; width: 100%; max-width: 1000px;">
    <div style="flex: 1; min-width: 250px; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 10px;">
      <h3 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">ZIP Archive Import</h3>
      <p style="font-size: 15px; color: #64748b; line-height: 1.5; margin: 0;">Directly unpack zip archives with HTML, CSS, and backend files preserved.</p>
    </div>
    <div style="flex: 1; min-width: 250px; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 10px;">
      <h3 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">Visual Inspector</h3>
      <p style="font-size: 15px; color: #64748b; line-height: 1.5; margin: 0;">Point-and-click editing for fonts, spacing, alignment, and modern palettes.</p>
    </div>
    <div style="flex: 1; min-width: 250px; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 10px;">
      <h3 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">Full-Stack Export</h3>
      <p style="font-size: 15px; color: #64748b; line-height: 1.5; margin: 0;">Download updated HTML/CSS bundled with your original backend files.</p>
    </div>
  </div>
</section>`);
    } else {
      setPastedCode(`<section style="padding: 70px 24px; background: #ffffff; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px;">
  <h2 style="font-size: 40px; font-weight: 800; color: #18181b; margin: 0;">Simple Transparent Pricing</h2>
  <p style="font-size: 18px; color: #71717a; margin: 0;">Choose the plan that fits your business.</p>
  <div style="display: flex; gap: 24px; width: 100%; max-width: 700px; justify-content: center; flex-wrap: wrap; margin-top: 10px;">
    <div style="flex: 1; min-width: 280px; padding: 32px; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 16px; display: flex; flex-direction: column; gap: 16px; align-items: center;">
      <h3 style="font-size: 24px; font-weight: 700; margin: 0;">Starter</h3>
      <p style="font-size: 38px; font-weight: 800; color: #f97316; margin: 0;">$0</p>
      <p style="color: #71717a; font-size: 14px;">Free forever for personal sites</p>
      <a href="#" style="background: #27272a; color: #ffffff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600; width: 100%; text-align: center;">Get Started</a>
    </div>
    <div style="flex: 1; min-width: 280px; padding: 32px; background: #18181b; color: #ffffff; border-radius: 16px; display: flex; flex-direction: column; gap: 16px; align-items: center;">
      <h3 style="font-size: 24px; font-weight: 700; margin: 0; color: #ffffff;">Pro</h3>
      <p style="font-size: 38px; font-weight: 800; color: #f97316; margin: 0;">$29</p>
      <p style="color: #a1a1aa; font-size: 14px;">Unlimited exports and domains</p>
      <a href="#" style="background: #f97316; color: #ffffff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600; width: 100%; text-align: center;">Go Pro</a>
    </div>
  </div>
</section>`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-[#1c1917] border border-[#3c3836] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3836] bg-[#221f1d]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Upload size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                Upload Code or Full-Stack ZIP
                <span className="text-[11px] font-normal text-orange-400">
                  .zip · .html · .json
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Import HTML, CSS, images, and backend files — edit visually & export everything intact.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#3c3836] bg-[#1a1715] px-6">
          <button
            onClick={() => { setActiveTab("file"); setParsedResult(null); setError(null); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === "file"
                ? "border-orange-500 text-orange-400 bg-orange-500/5"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <FolderArchive size={14} />
            Upload File (.zip / .html)
          </button>
          <button
            onClick={() => { setActiveTab("paste"); setParsedResult(null); setError(null); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === "paste"
                ? "border-orange-500 text-orange-400 bg-orange-500/5"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Code2 size={14} />
            Paste Code (HTML)
          </button>
          <button
            onClick={() => { setActiveTab("export"); setParsedResult(null); setError(null); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === "export"
                ? "border-orange-500 text-orange-400 bg-orange-500/5"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Download size={14} />
            Export & Backend Sync ({preservedEntries.length || 3} files)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Upload / Import Error</p>
                <p className="mt-0.5 text-stone-300">{error}</p>
              </div>
            </div>
          )}

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === "file" && (
            <div className="space-y-4">
              {!parsedResult ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                    dragActive
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-stone-700 bg-stone-900/50 hover:border-orange-500/60 hover:bg-stone-900"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip,.html,.htm,.json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileProcess(e.target.files[0]);
                      }
                    }}
                  />

                  {loading ? (
                    <div className="py-8 px-4 w-full max-w-lg mx-auto flex flex-col items-center gap-4">
                      {/* Animated icon & badge */}
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-xl shadow-orange-950/40">
                          <FolderArchive size={28} className="animate-pulse" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-stone-900 rounded-full p-1 border border-stone-700 shadow-md">
                          <Loader2 size={16} className="text-orange-400 animate-spin" />
                        </div>
                      </div>

                      {/* Header status & percent */}
                      <div className="text-center space-y-1.5 w-full">
                        <div className="flex items-center justify-between text-xs font-semibold px-1">
                          <span className="text-stone-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping inline-block" />
                            {extractionProgress?.stage === "reading"
                              ? "Reading Archive Structure"
                              : extractionProgress?.stage === "extracting"
                              ? "Extracting & Decompressing Files"
                              : extractionProgress?.stage === "styling"
                              ? "Linking Styles & Assets"
                              : extractionProgress?.stage === "converting"
                              ? "Building Visual Blocks"
                              : "Finalizing Live Preview"}
                          </span>
                          <span className="font-mono text-orange-400 font-bold text-sm">
                            {extractionProgress?.percent ?? 10}%
                          </span>
                        </div>

                        {/* Progress Bar Track & Fill */}
                        <div className="w-full bg-stone-800/90 rounded-full h-3.5 p-0.5 overflow-hidden border border-stone-700/80 shadow-inner">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400 transition-all duration-300 relative overflow-hidden"
                            style={{ width: `${Math.max(6, extractionProgress?.percent ?? 10)}%` }}
                          >
                            {/* Animated light shimmer */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1.4s_infinite]" />
                          </div>
                        </div>

                        {/* Current File / Status message */}
                        <p className="text-xs text-stone-400 truncate max-w-full font-mono mt-1 text-center">
                          {extractionProgress?.message || "Extracting files and images..."}
                        </p>
                      </div>

                      {/* Live metrics counters */}
                      <div className="grid grid-cols-3 gap-2.5 w-full pt-1">
                        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 text-center shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Processed</p>
                          <p className="text-xs font-mono font-bold text-stone-100 mt-0.5">
                            {extractionProgress?.processedFiles || 0}
                            <span className="text-stone-500 font-normal">
                              {extractionProgress?.totalFiles ? ` / ${extractionProgress.totalFiles}` : ""}
                            </span>
                          </p>
                        </div>
                        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 text-center shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Images</p>
                          <p className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                            {extractionProgress?.imagesCount || 0}
                          </p>
                        </div>
                        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 text-center shadow-sm">
                          <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Code Files</p>
                          <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                            {extractionProgress?.backendCount || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20 shadow-inner">
                        <Upload size={26} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-200">
                          Click to upload or drag & drop file here
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                          Supports full <span className="text-orange-400 font-medium">.zip</span> archives (HTML + CSS + Backend files + Images), standalone <span className="text-orange-400 font-medium">.html</span>, or <span className="text-orange-400 font-medium">.json</span>.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] font-mono text-stone-400">
                        <span className="flex items-center gap-1.5">
                          <FileArchive size={12} className="text-orange-400" /> .zip full-stack bundle
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1.5">
                          <FileCode size={12} className="text-amber-400" /> .html + .css
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1.5">
                          <Server size={12} className="text-emerald-400" /> Backend preserved
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Parsed Result Preview */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-stone-900 border border-stone-700/80 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                            {parsedResult.filename}
                            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                              Preview Ready
                            </span>
                          </h4>
                          <p className="text-xs text-stone-400">
                            {parsedResult.mainHtmlPath || "index.html"} · {parsedResult.elementCount} blocks · {parsedResult.filesList.length} files preserved
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {parsedResult.preservedEntries && parsedResult.preservedEntries.length > 0 && (
                          <button
                            type="button"
                            onClick={handleDownloadAll}
                            disabled={downloadingZip}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 text-xs font-semibold transition"
                            title="Download extracted contents as ZIP archive"
                          >
                            {downloadingZip ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                            Download All ({parsedResult.preservedEntries.length})
                          </button>
                        )}
                        <button
                          onClick={() => setParsedResult(null)}
                          className="text-xs text-stone-400 hover:text-stone-200 underline"
                        >
                          Choose another file
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-stone-800/60 border border-stone-700/50">
                        <p className="text-[10px] text-stone-400 uppercase font-bold">Format</p>
                        <p className="text-xs font-bold text-orange-400 uppercase mt-0.5">{parsedResult.fileType}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-800/60 border border-stone-700/50">
                        <p className="text-[10px] text-stone-400 uppercase font-bold">Blocks</p>
                        <p className="text-xs font-bold text-stone-200 mt-0.5">{parsedResult.elementCount}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-800/60 border border-stone-700/50">
                        <p className="text-[10px] text-stone-400 uppercase font-bold">Backend</p>
                        <p className="text-xs font-bold text-emerald-400 mt-0.5">
                          {parsedResult.backendFiles?.length || 0} files
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-800/60 border border-stone-700/50">
                        <p className="text-[10px] text-stone-400 uppercase font-bold">Assets</p>
                        <p className="text-xs font-bold text-stone-200 mt-0.5">{parsedResult.imagesCount} assets</p>
                      </div>
                    </div>
                  </div>

                  {/* Live Interactive Iframe Preview of Uploaded Website */}
                  {parsedResult.fullPreviewHtml && (
                    <div className="rounded-xl border border-stone-700/90 bg-stone-950 overflow-hidden shadow-2xl flex flex-col">
                      <div className="px-4 py-2.5 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                          <span className="text-xs font-bold text-stone-200">
                            Website Live Preview:
                          </span>
                          <span className="text-xs font-mono text-orange-400">
                            {parsedResult.mainHtmlPath || "index.html"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-lg border border-stone-800">
                          <button
                            type="button"
                            onClick={() => setPreviewDevice("desktop")}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                              previewDevice === "desktop"
                                ? "bg-orange-500 text-white font-bold"
                                : "text-stone-400 hover:text-stone-200"
                            }`}
                          >
                            Desktop
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewDevice("tablet")}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                              previewDevice === "tablet"
                                ? "bg-orange-500 text-white font-bold"
                                : "text-stone-400 hover:text-stone-200"
                            }`}
                          >
                            Tablet (768px)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewDevice("mobile")}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                              previewDevice === "mobile"
                                ? "bg-orange-500 text-white font-bold"
                                : "text-stone-400 hover:text-stone-200"
                            }`}
                          >
                            Mobile (390px)
                          </button>
                        </div>
                      </div>
                      <div className="bg-stone-950/70 p-3 flex justify-center items-center overflow-auto max-h-[360px]">
                        <div
                          className="bg-white rounded-lg shadow-xl transition-all duration-300 overflow-hidden"
                          style={{
                            width: previewDevice === "desktop" ? "100%" : previewDevice === "tablet" ? "768px" : "390px",
                            height: "320px",
                          }}
                        >
                          <iframe
                            srcDoc={parsedResult.fullPreviewHtml}
                            title="Uploaded Website Live Preview"
                            className="w-full h-full border-0"
                            sandbox="allow-forms"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => applyImport("replace")}
                      className="flex-1 py-3 px-5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-orange-900/30"
                    >
                      <ArrowRight size={15} />
                      Open & Edit in Visual Builder
                    </button>
                    <button
                      onClick={() => applyImport("append")}
                      className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-semibold text-xs transition flex items-center justify-center gap-2"
                    >
                      <Layers size={14} />
                      Append to Bottom
                    </button>
                    {parsedResult.preservedEntries && parsedResult.preservedEntries.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDownloadAll}
                        disabled={downloadingZip}
                        className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-orange-400 border border-orange-500/40 font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md"
                        title="Download all extracted archive contents as ZIP"
                      >
                        {downloadingZip ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                        Download All ({parsedResult.preservedEntries.length})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PASTE CODE */}
          {activeTab === "paste" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-stone-300">
                    Paste HTML or Web Code
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-stone-400">Quick templates:</span>
                    <button
                      type="button"
                      onClick={() => insertSampleSnippet("hero")}
                      className="px-2 py-0.5 rounded bg-stone-800 text-orange-400 hover:bg-stone-700 transition"
                    >
                      Hero
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSampleSnippet("features")}
                      className="px-2 py-0.5 rounded bg-stone-800 text-orange-400 hover:bg-stone-700 transition"
                    >
                      Features
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSampleSnippet("pricing")}
                      className="px-2 py-0.5 rounded bg-stone-800 text-orange-400 hover:bg-stone-700 transition"
                    >
                      Pricing
                    </button>
                  </div>
                </div>
                <textarea
                  value={pastedCode}
                  onChange={(e) => setPastedCode(e.target.value)}
                  placeholder="<section style='padding: 40px; background: #fff;'>&#10;  <h1>Welcome to my website</h1>&#10;  <p>Edit this visually in Canvas!</p>&#10;</section>"
                  rows={9}
                  className="w-full bg-[#141210] border border-stone-700 rounded-xl p-3.5 text-xs font-mono text-stone-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              {!parsedResult ? (
                <button
                  type="button"
                  onClick={handlePasteSubmit}
                  className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} />
                  Convert & Review Blocks
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-700 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={15} /> Code converted ({parsedResult.elementCount} blocks)
                    </span>
                    <button
                      onClick={() => setParsedResult(null)}
                      className="text-stone-400 hover:text-stone-200 underline"
                    >
                      Edit code
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => applyImport("replace")}
                      className="flex-1 py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition"
                    >
                      Replace Canvas
                    </button>
                    <button
                      onClick={() => applyImport("append")}
                      className="flex-1 py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-semibold text-xs transition"
                    >
                      Append as Section
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPORT ZIP & BACKEND SYNC */}
          {activeTab === "export" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-stone-900/80 border border-stone-700/70 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0 flex items-center justify-center">
                    <FolderArchive size={22} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-stone-100">
                      Full-Stack ZIP Export (Frontend + Preserved Backend)
                    </h4>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                      {preservedEntries.length > 0
                        ? `Your uploaded ZIP contains ${preservedEntries.length} files (${backendEntries.length} backend/code files). Exporting will update ${mainHtmlPath || "index.html"} and ${mainCssPath || "styles.css"} with your visual edits while keeping all backend & project files intact.`
                        : "Downloads a complete ZIP archive containing your updated HTML, custom CSS, and Canvas project JSON."}
                    </p>
                  </div>
                </div>

                {backendEntries.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <Server size={14} />
                        Backend Files in ZIP ({backendEntries.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAiSyncBackend}
                        disabled={syncingBackend}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition flex items-center gap-1.5"
                      >
                        {syncingBackend ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <RefreshCw size={12} />
                        )}
                        AI Sync Backend with HTML/CSS Edits
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-400 font-mono truncate">
                      {backendEntries.map((b) => b.path).join(" · ")}
                    </p>
                    {syncSummary && (
                      <p className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-3 py-2">
                        ✓ {syncSummary}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap justify-center gap-2 text-xs text-stone-300 font-mono pt-1">
                  <span className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700">
                    📄 {mainHtmlPath || "index.html"} (Updated)
                  </span>
                  <span className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700">
                    🎨 {mainCssPath || "styles.css"} (Updated)
                  </span>
                  {preservedEntries.length > 0 && (
                    <span className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 text-emerald-400">
                      ⚙️ +{preservedEntries.length} Original ZIP Files Preserved
                    </span>
                  )}
                </div>

                <div className="pt-2 text-center">
                  <button
                    onClick={handleExportZip}
                    disabled={loading}
                    className="py-3 px-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition inline-flex items-center gap-2 shadow-lg shadow-orange-900/30"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Download Complete Full-Stack ZIP
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-[#3c3836] bg-[#1a1715] flex items-center justify-between text-[11px] text-stone-400">
          <span>Preserves HTML, CSS, Images & Backend files inside ZIP archives</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md text-stone-300 hover:bg-stone-800 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
