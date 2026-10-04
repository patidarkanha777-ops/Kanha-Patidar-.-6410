import React, { useState, useEffect } from "react";
import {
  FolderTree,
  FileCode,
  FileText,
  Server,
  Save,
  Plus,
  X,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Sparkles,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { toHTML, type BNode } from "./types";
import { htmlToBNode, downloadZipArchive, type PreservedZipEntry } from "./importer";

interface ZipExplorerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pageRoot: BNode;
  customCss: string;
  onUpdatePageRoot: (next: BNode) => void;
  onUpdateCustomCss: (css: string) => void;
  preservedEntries: PreservedZipEntry[];
  onUpdatePreservedEntries: (entries: PreservedZipEntry[]) => void;
  mainHtmlPath?: string;
  mainCssPath?: string;
}

export function ZipExplorerDrawer({
  isOpen,
  onClose,
  pageRoot,
  customCss,
  onUpdatePageRoot,
  onUpdateCustomCss,
  preservedEntries,
  onUpdatePreservedEntries,
  mainHtmlPath = "index.html",
  mainCssPath = "styles.css",
}: ZipExplorerDrawerProps) {
  // Build virtual file list combining live HTML/CSS and preserved ZIP entries
  const virtualFiles: PreservedZipEntry[] = React.useMemo(() => {
    const list: PreservedZipEntry[] = [
      {
        path: mainHtmlPath,
        content: `<!doctype html>\n<html>\n<head>\n  <meta charset="utf-8" />\n  <link rel="stylesheet" href="${mainCssPath}" />\n</head>\n<body>\n${toHTML(pageRoot)}\n</body>\n</html>`,
        isBase64: false,
        category: "html",
      },
      {
        path: mainCssPath,
        content: customCss || "/* Custom CSS rules synced with Canvas */\nbody {\n  margin: 0;\n}\n",
        isBase64: false,
        category: "css",
      },
    ];

    for (const entry of preservedEntries) {
      if (entry.path === mainHtmlPath || entry.path === mainCssPath) continue;
      list.push(entry);
    }

    // Provide a starter server.js if user hasn't uploaded a backend file yet
    if (!list.some((f) => f.category === "backend")) {
      list.push({
        path: "server.js",
        content: `import express from "express";\nconst app = express();\napp.use(express.json());\napp.use(express.static("."));\n\napp.post("/api/forms/submit", (req, res) => {\n  console.log("Form submission:", req.body);\n  res.json({ success: true });\n});\n\napp.listen(3000, () => console.log("Server running on port 3000"));\n`,
        isBase64: false,
        category: "backend",
      });
    }

    return list;
  }, [preservedEntries, pageRoot, customCss, mainHtmlPath, mainCssPath]);

  const [selectedPath, setSelectedPath] = useState<string>(mainHtmlPath);
  const [editorValue, setEditorValue] = useState<string>("");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [addingFile, setAddingFile] = useState(false);
  const [syncingAi, setSyncingAi] = useState(false);

  const activeFile = virtualFiles.find((f) => f.path === selectedPath) || virtualFiles[0];

  useEffect(() => {
    if (activeFile && !activeFile.isBase64) {
      setEditorValue(activeFile.content);
    }
  }, [selectedPath, activeFile?.content]);

  if (!isOpen) return null;

  const handleSaveFile = () => {
    if (!activeFile) return;

    if (activeFile.path === mainHtmlPath) {
      try {
        const updatedTree = htmlToBNode(editorValue);
        onUpdatePageRoot(updatedTree);
        setSavedNotice("Live Canvas HTML updated!");
      } catch {
        setSavedNotice("Saved HTML to project.");
      }
    } else if (activeFile.path === mainCssPath || activeFile.category === "css") {
      onUpdateCustomCss(editorValue);
      setSavedNotice("Live Custom CSS updated on Canvas!");
    } else {
      const exists = preservedEntries.some((e) => e.path === activeFile.path);
      if (exists) {
        onUpdatePreservedEntries(
          preservedEntries.map((e) =>
            e.path === activeFile.path ? { ...e, content: editorValue } : e
          )
        );
      } else {
        onUpdatePreservedEntries([
          ...preservedEntries,
          { ...activeFile, content: editorValue },
        ]);
      }
      setSavedNotice(`Saved ${activeFile.path} in ZIP archive!`);
    }

    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleAddNewFile = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFileName.trim();
    if (!clean) return;
    const ext = clean.split(".").pop()?.toLowerCase() || "";
    const category: PreservedZipEntry["category"] =
      ext === "html"
        ? "html"
        : ext === "css"
        ? "css"
        : ["js", "ts", "py", "php"].includes(ext)
        ? "backend"
        : "config";

    const newEntry: PreservedZipEntry = {
      path: clean,
      content: `// ${clean} — Created in Canvas ZIP Explorer\n`,
      isBase64: false,
      category,
    };

    onUpdatePreservedEntries([...preservedEntries, newEntry]);
    setSelectedPath(clean);
    setNewFileName("");
    setAddingFile(false);
  };

  const handleAiSyncBackendFile = async () => {
    const backendFile =
      virtualFiles.find((f) => f.path === selectedPath && f.category === "backend") ||
      virtualFiles.find((f) => f.category === "backend");
    if (!backendFile) return;

    setSyncingAi(true);
    try {
      const res = await fetch("/api/ai/sync-backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: toHTML(pageRoot),
          css: customCss,
          backendPath: backendFile.path,
          backendCode: backendFile.content,
        }),
      });
      const data = await res.json();
      if (data.updatedBackendCode) {
        setSelectedPath(backendFile.path);
        setEditorValue(data.updatedBackendCode);
        const exists = preservedEntries.some((e) => e.path === backendFile.path);
        if (exists) {
          onUpdatePreservedEntries(
            preservedEntries.map((e) =>
              e.path === backendFile.path ? { ...e, content: data.updatedBackendCode } : e
            )
          );
        } else {
          onUpdatePreservedEntries([
            ...preservedEntries,
            { ...backendFile, content: data.updatedBackendCode },
          ]);
        }
        setSavedNotice(data.summary || `AI synced ${backendFile.path}!`);
        setTimeout(() => setSavedNotice(null), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingAi(false);
    }
  };

  const [downloadingZip, setDownloadingZip] = useState(false);

  const handleDownloadAll = async () => {
    setDownloadingZip(true);
    try {
      await downloadZipArchive(virtualFiles, "project-extracted.zip");
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingZip(false);
    }
  };

  const getIcon = (cat: PreservedZipEntry["category"]) => {
    switch (cat) {
      case "html":
        return <FileCode size={13} className="text-orange-400 shrink-0" />;
      case "css":
        return <Sparkles size={13} className="text-sky-400 shrink-0" />;
      case "backend":
        return <Server size={13} className="text-emerald-400 shrink-0" />;
      case "asset":
        return <ImageIcon size={13} className="text-pink-400 shrink-0" />;
      default:
        return <FileText size={13} className="text-stone-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-[720px] max-w-[95vw] bg-[#161413] border-r border-[#3c3836] shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#3c3836] bg-[#1f1c1a] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
            <FolderTree size={17} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              Full-Stack ZIP File Explorer & Live Code IDE
              <span className="text-[11px] font-mono text-emerald-400">
                {virtualFiles.length} files
              </span>
            </h3>
            <p className="text-[11px] text-stone-400">
              Edit HTML, CSS, Backend (`server.ts`/`server.js`), or scripts directly — changes sync with Canvas & ZIP export.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadAll}
            disabled={downloadingZip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition shadow-sm"
            title="Download all extracted archive files as ZIP"
          >
            {downloadingZip ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            <span>Download All ({virtualFiles.length})</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex min-h-0">
        {/* Left File Tree */}
        <div className="w-56 border-r border-[#2e2a28] bg-[#141210] flex flex-col">
          <div className="p-3 border-b border-[#2e2a28] flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Project Files
            </span>
            <button
              type="button"
              onClick={() => setAddingFile(!addingFile)}
              title="Add new file to ZIP"
              className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-orange-400"
            >
              <Plus size={13} />
            </button>
          </div>

          {addingFile && (
            <form onSubmit={handleAddNewFile} className="p-2 border-b border-[#2e2a28] flex gap-1">
              <input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. api/routes.js"
                className="flex-1 px-2 py-1 rounded bg-black border border-stone-700 text-[11px] text-white"
              />
              <button
                type="submit"
                className="px-2 py-1 rounded bg-orange-600 text-white text-[10px] font-bold"
              >
                Add
              </button>
            </form>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {virtualFiles.map((file) => {
              const active = file.path === activeFile?.path;
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedPath(file.path)}
                  className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between transition ${
                    active
                      ? "bg-orange-600/20 text-orange-300 border border-orange-500/40 font-semibold"
                      : "text-stone-300 hover:bg-stone-800/70"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {getIcon(file.category)}
                    <span className="truncate font-mono text-[11px]">{file.path}</span>
                  </div>
                  <span className="text-[9px] uppercase text-stone-500 ml-1">{file.category}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-[#2e2a28]">
            <button
              type="button"
              onClick={handleAiSyncBackendFile}
              disabled={syncingAi}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
            >
              {syncingAi ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              <span>AI Sync Backend</span>
            </button>
          </div>
        </div>

        {/* Right Code Editor */}
        <div className="flex-1 flex flex-col bg-[#0c0b0a]">
          <div className="px-4 py-2.5 border-b border-[#2e2a28] bg-[#181615] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeFile && getIcon(activeFile.category)}
              <span className="text-xs font-mono font-bold text-stone-200">
                {activeFile?.path}
              </span>
              {savedNotice && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 ml-2">
                  <CheckCircle2 size={12} />
                  {savedNotice}
                </span>
              )}
            </div>

            {!activeFile?.isBase64 && (
              <button
                type="button"
                onClick={handleSaveFile}
                className="py-1.5 px-3.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Save size={13} />
                <span>Save & Sync Changes</span>
              </button>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {activeFile?.isBase64 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 space-y-3">
                <ImageIcon size={32} className="text-pink-400" />
                <p className="text-xs font-semibold text-stone-200">{activeFile.path}</p>
                <p className="text-xs text-stone-500">Binary / Image asset preserved inside the ZIP bundle.</p>
              </div>
            ) : (
              <textarea
                value={editorValue}
                onChange={(e) => setEditorValue(e.target.value)}
                spellCheck={false}
                className="w-full h-full min-h-[420px] bg-[#080707] border border-stone-800 focus:border-orange-500 rounded-xl p-4 font-mono text-xs text-stone-200 leading-relaxed focus:outline-none resize-none"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
