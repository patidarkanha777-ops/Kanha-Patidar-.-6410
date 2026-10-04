import React, { useCallback, useEffect, useState } from "react";
import {
  Trash2, Copy, ArrowUp, ArrowDown, Undo2, Redo2, Eye, Pencil, Monitor, Tablet, Smartphone, Download, RotateCcw, Layers,
  Upload, Sparkles, LayoutGrid, Palette, Maximize2, FileText, ChevronDown, Plus, Code2, History, Megaphone, Inbox, FolderTree, Cloud,
  BarChart3, BookOpen, ShieldCheck, Webhook, Mic, Bot, Rocket, Kanban, Command,
} from "lucide-react";
import { RenderNode } from "./Canvas";
import { Inspector } from "./Inspector";
import { UploadModal } from "./UploadModal";
import { downloadZipArchive, type ParseResult, type PreservedZipEntry } from "./importer";
import { ZipExplorerDrawer } from "./ZipExplorerDrawer";
import { CloudPublishModal } from "./CloudPublishModal";
import { AnalyticsHeatmapModal } from "./AnalyticsHeatmapModal";
import { BlogCmsModal } from "./BlogCmsModal";
import { IconAssetStudioModal } from "./IconAssetStudioModal";
import { CollabPwaWebhookModal } from "./CollabPwaWebhookModal";
import { AiVoiceBrandChatModal } from "./AiVoiceBrandChatModal";
import { DeployMarketingWcagModal } from "./DeployMarketingWcagModal";
import { CrmKanbanPopupModal } from "./CrmKanbanPopupModal";
import { VisionChartCursorCommandModal } from "./VisionChartCursorCommandModal";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { FloatingToolbar } from "./FloatingToolbar";
import { DrawOverlay } from "./DrawOverlay";
import { LayersDrawer } from "./LayersDrawer";
import { AiModifierModal } from "./AiModifierModal";
import { TemplateLibraryModal } from "./TemplateLibraryModal";
import { ThemeDrawer } from "./ThemeDrawer";
import { PageManagerModal, type SitePage } from "./PageManagerModal";
import { FullscreenPreview } from "./FullscreenPreview";
import { CodeInspectorModal } from "./CodeInspectorModal";
import { VersionHistoryModal } from "./VersionHistoryModal";
import { FormLeadsModal } from "./FormLeadsModal";
import { AnnouncementBar } from "./AnnouncementBar";
import type { ThemePreset } from "./themes";
import {
  type BNode, type NodeType, type Snapshot, createNode, defaultPage, findNode, findParent, mapTree, insertChildAt, cloneWithIds, isContainer, toHTML, uid,
} from "./types";

const KEY = "builder-site-pages-v3";
const SNAPSHOT_KEY = "builder-site-snapshots-v1";
const CSS_KEY = "builder-custom-css-v1";
const DEVICES = { desktop: "100%", tablet: "768px", mobile: "390px" } as const;

const initialPages: SitePage[] = [
  {
    id: "p_home",
    name: "Home",
    slug: "/",
    title: "Canvas — Visual Website Builder",
    description: "Build beautiful websites with AI, visual drag and drop, and clean code export.",
    root: defaultPage,
  },
];

export function Builder() {
  const [pages, setPages] = useState<SitePage[]>(initialPages);
  const [activePageId, setActivePageId] = useState<string>("p_home");

  const currentPage = pages.find((p) => p.id === activePageId) || pages[0] || initialPages[0];
  const page = currentPage.root;

  const [past, setPast] = useState<BNode[]>([]);
  const [future, setFuture] = useState<BNode[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [textEditId, setTextEditId] = useState<string | null>(null);
  const [editing, setEditing] = useState(true);
  const [device, setDevice] = useState<keyof typeof DEVICES>("desktop");

  // Sticky Announcement Bar State
  const [announcementVisible, setAnnouncementVisible] = useState(false);

  // Custom CSS State
  const [customCss, setCustomCss] = useState(() => {
    return localStorage.getItem(CSS_KEY) || "";
  });

  // Preserved Full-Stack ZIP Files State
  const [preservedZipEntries, setPreservedZipEntries] = useState<PreservedZipEntry[]>([]);
  const [mainHtmlPath, setMainHtmlPath] = useState<string | undefined>(undefined);
  const [mainCssPath, setMainCssPath] = useState<string | undefined>(undefined);
  const [livePreviewHtml, setLivePreviewHtml] = useState<string | null>(null);
  const [canvasViewMode, setCanvasViewMode] = useState<"canvas" | "live">("canvas");

  // Snapshots State
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Modals & Panels State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [showLayersDrawer, setShowLayersDrawer] = useState(false);
  const [activeTool, setActiveTool] = useState<"select" | "text" | "pen" | "comment">("select");
  const [isPenActive, setIsPenActive] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);
  const [pageManagerOpen, setPageManagerOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [leadsModalOpen, setLeadsModalOpen] = useState(false);
  const [zipExplorerOpen, setZipExplorerOpen] = useState(false);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [blogCmsModalOpen, setBlogCmsModalOpen] = useState(false);
  const [iconStudioModalOpen, setIconStudioModalOpen] = useState(false);
  const [collabPwaModalOpen, setCollabPwaModalOpen] = useState(false);
  const [voiceBrandModalOpen, setVoiceBrandModalOpen] = useState(false);
  const [geminiModalTab, setGeminiModalTab] = useState<"chat" | "live" | "brandkit">("chat");
  const [deployMarketingModalOpen, setDeployMarketingModalOpen] = useState(false);
  const [crmKanbanModalOpen, setCrmKanbanModalOpen] = useState(false);
  const [commandVisionModalOpen, setCommandVisionModalOpen] = useState(false);
  const [cursorMode, setCursorMode] = useState<"none" | "neon" | "spotlight">("none");
  const [cursorCoords, setCursorCoords] = useState({ x: -100, y: -100 });
  const [isRtl, setIsRtl] = useState(false);

  // Global Ctrl+K / Cmd+K Command Palette Shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandVisionModalOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Global Styling state
  const [currentFont, setCurrentFont] = useState("'Inter', system-ui, sans-serif");
  const [currentPrimaryColor, setCurrentPrimaryColor] = useState("#f97316");

  const select = (id: string | null) => { setSelected(id); setTextEditId(null); };
  const selectParent = (id: string) => {
    const parent = findParent(page, id);
    if (parent && parent.id !== id) select(parent.id);
  };

  // Local storage persistence + Check for ?live=<projectId> shareable URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const liveId = params.get("live");
    if (liveId) {
      setEditing(false);
      (async () => {
        try {
          const res = await fetch(`/api/sites/${encodeURIComponent(liveId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.site?.root) {
              setPages([{ id: "p_live", name: data.site.name || "Live Site", slug: "/", title: data.site.name || "Live Site", description: "", root: data.site.root }]);
              setActivePageId("p_live");
              if (data.site.customCss) setCustomCss(data.site.customCss);
              return;
            }
          }
          // Fallback: check Firestore /projects/{liveId}
          const snap = await getDoc(doc(db, "projects", liveId));
          if (snap.exists()) {
            const dt = snap.data();
            if (dt.root) {
              setPages([{ id: "p_live", name: dt.name || "Live Site", slug: "/", title: dt.name || "Live Site", description: "", root: dt.root as BNode }]);
              setActivePageId("p_live");
              if (dt.customCss) setCustomCss(dt.customCss);
            }
          }
        } catch (err) {
          console.error("Failed to load live site:", err);
        }
      })();
      return;
    }

    localStorage.removeItem("builder-site-pages-v2");
    localStorage.removeItem("builder-site-pages-v1");

    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasOldDemo = parsed.some((pg: SitePage) =>
            pg.root?.children?.some((c: BNode) => c.id === "hero" || c.id === "feat")
          );
          if (!hasOldDemo) {
            setPages(parsed);
            setActivePageId(parsed[0].id);
          } else {
            localStorage.removeItem(KEY);
          }
        }
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(pages));
  }, [pages]);

  useEffect(() => {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
  }, [snapshots]);

  useEffect(() => {
    localStorage.setItem(CSS_KEY, customCss);
  }, [customCss]);

  const commit = useCallback((next: BNode) => {
    setPast((p) => [...p.slice(-50), page]);
    setFuture([]);
    setPages((prevPages) =>
      prevPages.map((pg) => (pg.id === activePageId ? { ...pg, root: next } : pg))
    );
  }, [page, activePageId]);

  const undo = () => {
    if (!past.length) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [page, ...f]);
    setPages((prevPages) =>
      prevPages.map((pg) => (pg.id === activePageId ? { ...pg, root: prev } : pg))
    );
    select(null);
  };

  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, page]);
    setPages((prevPages) =>
      prevPages.map((pg) => (pg.id === activePageId ? { ...pg, root: next } : pg))
    );
    select(null);
  };

  const update = (id: string, patch: Partial<BNode>) =>
    commit(mapTree(page, (n) => (n.id === id ? { ...n, ...patch } : n)));

  const setStyle = (id: string, k: string, v: string) =>
    commit(mapTree(page, (n) => {
      if (n.id !== id) return n;
      const style = { ...n.style };
      if (v === "") delete style[k]; else style[k] = v;
      return { ...n, style };
    }));

  const add = (type: NodeType) => {
    const node = createNode(type);
    const sel = selected ? findNode(page, selected) : null;
    let next: BNode;
    if (sel && isContainer(sel.type)) {
      next = mapTree(page, (n) => (n.id === sel.id ? { ...n, children: [...(n.children ?? []), node] } : n));
    } else if (sel) {
      const parent = findParent(page, sel.id)!;
      next = mapTree(page, (n) => {
        if (n.id !== parent.id) return n;
        const ch = [...n.children!]; ch.splice(ch.findIndex((c) => c.id === sel.id) + 1, 0, node);
        return { ...n, children: ch };
      });
    } else {
      next = { ...page, children: [...(page.children ?? []), node] };
    }
    commit(next);
    setSelected(node.id);
  };

  const addStickyNote = () => {
    const noteNode: BNode = {
      id: uid(),
      type: "container",
      style: {
        background: "#fef08a",
        color: "#854d0e",
        padding: "20px 24px",
        borderRadius: "16px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        border: "1px solid #fde047",
        maxWidth: "380px",
        margin: "16px auto",
      },
      children: [
        {
          id: uid(),
          type: "heading",
          level: 4,
          text: "💬 Note / Comment",
          style: { fontSize: "16px", fontWeight: "700", color: "#854d0e", margin: "0" },
        },
        {
          id: uid(),
          type: "text",
          text: "Double-click to write notes or feedback on this section.",
          style: { fontSize: "14px", color: "#713f12", margin: "0", lineHeight: "1.5" },
        },
      ],
    };
    commit({
      ...page,
      children: [...(page.children ?? []), noteNode],
    });
    select(noteNode.id);
  };

  const insert = (parentId: string, index: number, type: NodeType) => {
    const node = createNode(type);
    commit(insertChildAt(page, parentId, index, node));
    setSelected(node.id);
    setTextEditId(null);
  };

  const remove = () => {
    if (!selected || selected === "root") return;
    const parent = findParent(page, selected)!;
    commit(mapTree(page, (n) => (n.id === parent.id ? { ...n, children: n.children!.filter((c) => c.id !== selected) } : n)));
    select(null);
  };

  const duplicate = () => {
    if (!selected || selected === "root") return;
    const parent = findParent(page, selected)!;
    const copy = cloneWithIds(findNode(page, selected)!);
    commit(mapTree(page, (n) => {
      if (n.id !== parent.id) return n;
      const ch = [...n.children!]; ch.splice(ch.findIndex((c) => c.id === selected) + 1, 0, copy);
      return { ...n, children: ch };
    }));
    select(copy.id);
  };

  const move = (dir: -1 | 1) => {
    if (!selected || selected === "root") return;
    const parent = findParent(page, selected)!;
    commit(mapTree(page, (n) => {
      if (n.id !== parent.id) return n;
      const ch = [...n.children!]; const i = ch.findIndex((c) => c.id === selected); const j = i + dir;
      if (j < 0 || j >= ch.length) return n;
      const tmp = ch[i]!; ch[i] = ch[j]!; ch[j] = tmp;
      return { ...n, children: ch };
    }));
  };

  const handleImport = (importedPage: BNode, mode: "replace" | "append", meta?: ParseResult) => {
    if (meta?.preservedEntries) {
      setPreservedZipEntries(meta.preservedEntries);
    }
    if (meta?.fullPreviewHtml) {
      setLivePreviewHtml(meta.fullPreviewHtml);
      setCanvasViewMode("canvas");
    }
    if (meta?.mainHtmlPath) {
      setMainHtmlPath(meta.mainHtmlPath);
    }
    if (meta?.mainCssPath) {
      setMainCssPath(meta.mainCssPath);
    }
    if (meta?.extractedCss) {
      setCustomCss((prev) => (mode === "replace" ? meta.extractedCss! : `${prev}\n\n${meta.extractedCss}`));
    }
    if (mode === "replace") {
      commit(importedPage);
      select(null);
    } else {
      const existingChildren = page.children ?? [];
      const newChildren = importedPage.children ?? [importedPage];
      commit({
        ...page,
        children: [...existingChildren, ...newChildren],
      });
      select(null);
    }
  };

  // AI Actions
  const handleApplyAiModification = (updatedNode: BNode) => {
    commit(mapTree(page, (n) => (n.id === updatedNode.id ? updatedNode : n)));
  };

  const handleApplyAiNewSection = (newSection: BNode) => {
    commit({
      ...page,
      children: [...(page.children ?? []), newSection],
    });
    select(newSection.id);
  };

  const handleApplyImageToNode = (imageUrl: string) => {
    if (selected) {
      commit(mapTree(page, (n) => (n.id === selected ? { ...n, src: imageUrl } : n)));
    } else {
      const imgNode = createNode("image");
      imgNode.src = imageUrl;
      commit({ ...page, children: [...(page.children ?? []), imgNode] });
      select(imgNode.id);
    }
  };

  const handleApplyTranslatedPage = (translatedRoot: BNode) => {
    commit(translatedRoot);
  };

  const handleApplyFullSite = (sitePages: SitePage[]) => {
    setPages(sitePages);
    setActivePageId(sitePages[0].id);
    select(null);
    handleSaveSnapshot(`AI Site: ${sitePages[0]?.name || "Home"}`);
  };

  // Template Library Action
  const handleInsertTemplate = (sectionNode: BNode) => {
    commit({
      ...page,
      children: [...(page.children ?? []), sectionNode],
    });
    select(sectionNode.id);
  };

  // 1-Click Theme Application
  const handleApplyTheme = (preset: ThemePreset) => {
    setCurrentFont(preset.fontFamily);
    setCurrentPrimaryColor(preset.primaryColor);

    const rethemed = mapTree(page, (n) => {
      if (n.id === "root") {
        return {
          ...n,
          style: {
            ...n.style,
            backgroundColor: preset.backgroundColor,
            color: preset.textColor,
            fontFamily: preset.fontFamily,
          },
        };
      }
      if (n.type === "section") {
        return {
          ...n,
          style: {
            ...n.style,
            backgroundColor: preset.backgroundColor,
            borderColor: preset.borderColor,
          },
        };
      }
      if (n.type === "button") {
        return {
          ...n,
          style: {
            ...n.style,
            backgroundColor: preset.primaryColor,
            borderRadius: preset.buttonRadius,
            fontFamily: preset.fontFamily,
          },
        };
      }
      return {
        ...n,
        style: {
          ...n.style,
          fontFamily: preset.fontFamily,
        },
      };
    });

    commit(rethemed);
  };

  const handleApplyFont = (fontFamily: string) => {
    setCurrentFont(fontFamily);
    commit(mapTree(page, (n) => ({
      ...n,
      style: { ...n.style, fontFamily },
    })));
  };

  const handleApplyPrimaryColor = (color: string) => {
    setCurrentPrimaryColor(color);
    commit(mapTree(page, (n) => {
      if (n.type === "button") {
        return { ...n, style: { ...n.style, backgroundColor: color } };
      }
      return n;
    }));
  };

  // Multi-Page Actions
  const handleCreatePage = (name: string, slug: string) => {
    const newPage: SitePage = {
      id: `p_${Date.now()}`,
      name,
      slug,
      title: `${name} — Canvas Site`,
      description: `Welcome to the ${name} page.`,
      root: {
        id: "root",
        type: "section",
        style: {
          backgroundColor: page.style.backgroundColor || "#ffffff",
          fontFamily: currentFont,
          minHeight: "100vh",
          padding: "40px 24px",
        },
        children: [
          {
            id: uid(),
            type: "heading",
            level: 1,
            text: `${name}`,
            style: { fontSize: "40px", fontWeight: "800", color: "#111827", margin: "0 0 16px 0" },
          },
          {
            id: uid(),
            type: "text",
            text: "This is a new page. Add sections or templates from the bottom toolbar.",
            style: { fontSize: "16px", color: "#6b7280" },
          },
        ],
      },
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    select(null);
  };

  const handleDeletePage = (id: string) => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((p) => p.id !== id));
    if (activePageId === id) {
      const remaining = pages.filter((p) => p.id !== id);
      setActivePageId(remaining[0].id);
    }
  };

  const handleUpdateSeo = (id: string, title: string, description: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title, description } : p))
    );
  };

  // Snapshots & Checkpoints Actions
  const handleSaveSnapshot = (name: string) => {
    const snap: Snapshot = {
      id: `snap_${Date.now()}`,
      name,
      timestamp: Date.now(),
      pages: JSON.parse(JSON.stringify(pages)),
      activePageId,
    };
    setSnapshots((prev) => [snap, ...prev]);
  };

  const handleRestoreSnapshot = (snap: Snapshot) => {
    setPages(snap.pages);
    setActivePageId(snap.activePageId || snap.pages[0]?.id || "p_home");
    select(null);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (e.key === "Delete" || e.key === "Backspace") remove();
      else if (e.key === "Escape") { if (textEditId) setTextEditId(null); else setSelected(null); }
      else if (e.key === "Enter" && selected && !textEditId) {
        const n = findNode(page, selected);
        if (n && (n.type === "heading" || n.type === "text" || n.type === "button")) { e.preventDefault(); setTextEditId(selected); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const exportHtml = () => {
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${currentPage.title}</title>
  <meta name="description" content="${currentPage.description}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Poppins:wght@400;600;800&family=Playfair+Display:wght@700&family=Space+Grotesk:wght@500;700&family=Outfit:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; font-family: ${currentFont}; }
    * { box-sizing: border-box; }
    ${customCss}
  </style>
</head>
<body>
  ${toHTML(page)}
</body>
</html>`;

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = `${currentPage.slug === "/" ? "index" : currentPage.slug.replace(/\//g, "")}.html`;
    a.click();
  };

  const selNode = selected ? findNode(page, selected) : null;

  return (
    <div className="bld">
      {/* Dynamic Injected Custom CSS */}
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      <header className="bld-top">
        {/* Brand */}
        <div className="bld-brand">Canvas<span>.</span></div>

        {/* Page Switcher Dropdown */}
        <div className="bld-group">
          <button
            type="button"
            onClick={() => setPageManagerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition"
          >
            <FileText size={13} className="text-orange-400" />
            <span className="truncate max-w-[110px]">{currentPage.name}</span>
            <ChevronDown size={13} className="text-stone-400" />
          </button>
        </div>

        {/* History Undo / Redo */}
        <div className="bld-group">
          <button className="ibtn" onClick={undo} disabled={!past.length} title="Undo (Ctrl+Z)"><Undo2 size={16} /></button>
          <button className="ibtn" onClick={redo} disabled={!future.length} title="Redo (Ctrl+Shift+Z)"><Redo2 size={16} /></button>
        </div>

        {/* Device Switcher */}
        <div className="bld-group">
          {(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map((d) => {
            const I = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
            return <button key={d} className={`ibtn ${device === d ? "ibtn-on" : ""}`} onClick={() => setDevice(d)} title={d}><I size={16} /></button>;
          })}
        </div>

        {/* Live Site vs Canvas Switcher (Available when ZIP/HTML uploaded) */}
        {livePreviewHtml && (
          <div className="bld-group bg-stone-900/90 border border-stone-700/80 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setCanvasViewMode("live")}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                canvasViewMode === "live"
                  ? "bg-orange-600 text-white font-bold shadow-sm"
                  : "text-stone-300 hover:text-white"
              }`}
              title="Live interactive website preview"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Site
            </button>
            <button
              type="button"
              onClick={() => setCanvasViewMode("canvas")}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                canvasViewMode === "canvas"
                  ? "bg-stone-700 text-white font-bold shadow-sm"
                  : "text-stone-300 hover:text-white"
              }`}
              title="Visual editable blocks canvas"
            >
              <Pencil size={12} />
              Canvas
            </button>
          </div>
        )}

        {/* Action Group */}
        <div className="bld-group">
          {/* Announcement Bar Toggle */}
          <button
            className={`ibtn ${announcementVisible ? "ibtn-on" : ""}`}
            title="Toggle Sticky Announcement Bar"
            onClick={() => setAnnouncementVisible(!announcementVisible)}
          >
            <Megaphone size={16} />
          </button>

          {/* Templates */}
          <button
            className="ibtn"
            title="Ready-made Section Templates"
            onClick={() => setTemplatesModalOpen(true)}
          >
            <LayoutGrid size={16} />
          </button>

          {/* Theme & Fonts */}
          <button
            className={`ibtn ${themeDrawerOpen ? "ibtn-on" : ""}`}
            title="1-Click Themes & Google Fonts"
            onClick={() => setThemeDrawerOpen(!themeDrawerOpen)}
          >
            <Palette size={16} />
          </button>

          {/* Gemini AI Super Studio */}
          <button
            className="ibtn"
            title="Gemini AI Super Studio (Voice, Image, Edit, Translate, 1-Prompt Full Site)"
            onClick={() => setAiModalOpen(true)}
            style={{ color: "#f59e0b" }}
          >
            <Sparkles size={16} />
          </button>

          {/* Live Code & Custom CSS Inspector */}
          <button
            className={`ibtn ${codeModalOpen ? "ibtn-on" : ""}`}
            title="Live Code & Custom CSS Inspector"
            onClick={() => setCodeModalOpen(true)}
          >
            <Code2 size={16} />
          </button>

          {/* Version History & Snapshots */}
          <button
            className="ibtn"
            title="Version History & Checkpoints"
            onClick={() => setHistoryModalOpen(true)}
          >
            <History size={16} />
          </button>

          {/* Backend Form Leads & Inbox */}
          <button
            className={`ibtn ${leadsModalOpen ? "ibtn-on" : ""}`}
            title="Backend Form Leads & Cloud Database Inbox"
            onClick={() => setLeadsModalOpen(true)}
          >
            <Inbox size={16} />
          </button>

          {/* Built-in ZIP File Explorer & Code IDE */}
          <button
            className={`ibtn ${zipExplorerOpen ? "ibtn-on" : ""}`}
            title="Built-in ZIP File Explorer & Live Code Editor"
            onClick={() => setZipExplorerOpen(!zipExplorerOpen)}
          >
            <FolderTree size={16} />
          </button>

          {/* Cloud Save & 1-Click Shareable Live Link */}
          <button
            className={`ibtn ${cloudModalOpen ? "ibtn-on" : ""}`}
            title="Firebase Cloud Save & 1-Click Shareable Live Link"
            onClick={() => setCloudModalOpen(true)}
            style={{ color: "#38bdf8" }}
          >
            <Cloud size={16} />
          </button>

          {/* Built-in Analytics, Click Heatmap & A/B Testing Lab */}
          <button
            className={`ibtn ${analyticsModalOpen ? "ibtn-on" : ""}`}
            title="Live Visitor Analytics, Click Heatmap & A/B Testing Dashboard"
            onClick={() => setAnalyticsModalOpen(true)}
            style={{ color: "#10b981" }}
          >
            <BarChart3 size={16} />
          </button>

          {/* Dynamic Blog, CMS Collections & AI Blog Writer */}
          <button
            className={`ibtn ${blogCmsModalOpen ? "ibtn-on" : ""}`}
            title="Dynamic Blog, CMS Collections & AI Blog Writer"
            onClick={() => setBlogCmsModalOpen(true)}
          >
            <BookOpen size={16} />
          </button>

          {/* Advanced Design, Custom SVG Icons & Image Filter Studio */}
          <button
            className={`ibtn ${iconStudioModalOpen ? "ibtn-on" : ""}`}
            title="Custom SVG Icon Library, Image Filter Studio & Dark/Light Switcher"
            onClick={() => setIconStudioModalOpen(true)}
          >
            <ShieldCheck size={16} />
          </button>

          {/* Installable PWA, Webhooks & Client Approval Hub */}
          <button
            className={`ibtn ${collabPwaModalOpen ? "ibtn-on" : ""}`}
            title="1-Click Installable PWA, Zapier/Slack Webhooks & Client Approval"
            onClick={() => setCollabPwaModalOpen(true)}
          >
            <Webhook size={16} />
          </button>

          {/* Gemini AI Multi-Turn Chatbot */}
          <button
            className={`ibtn ${voiceBrandModalOpen && geminiModalTab === "chat" ? "ibtn-on" : ""}`}
            title="Gemini Multi-Turn AI Copilot (gemini-3.5-flash · gemini-3.1-pro-preview · gemini-3.1-flash-lite)"
            onClick={() => {
              setGeminiModalTab("chat");
              setVoiceBrandModalOpen(true);
            }}
            style={{ color: "#fb923c" }}
          >
            <Bot size={16} />
          </button>

          {/* Real-Time Live Voice Conversations (gemini-3.8-live) */}
          <button
            className={`ibtn ${voiceBrandModalOpen && geminiModalTab === "live" ? "ibtn-on" : ""}`}
            title="Real-Time Voice Conversations with Gemini (gemini-3.8-live)"
            onClick={() => {
              setGeminiModalTab("live");
              setVoiceBrandModalOpen(true);
            }}
            style={{ color: "#34d399" }}
          >
            <Mic size={16} />
          </button>

          {/* 1-Click Cloud Deploy (Vercel/Netlify/Docker), Email Newsletter & WCAG Link Scanner */}
          <button
            className={`ibtn ${deployMarketingModalOpen ? "ibtn-on" : ""}`}
            title="1-Click Vercel/Netlify/Docker Deploy, AI Email Campaigns & WCAG Link Scanner"
            onClick={() => setDeployMarketingModalOpen(true)}
            style={{ color: "#38bdf8" }}
          >
            <Rocket size={16} />
          </button>

          {/* Visual CRM Kanban Pipeline, Exit-Intent Popup & 3D Interactive Blocks */}
          <button
            className={`ibtn ${crmKanbanModalOpen ? "ibtn-on" : ""}`}
            title="Visual CRM Kanban Board, Exit-Intent Popup Builder & 3D Interactive Blocks"
            onClick={() => setCrmKanbanModalOpen(true)}
            style={{ color: "#a855f7" }}
          >
            <Kanban size={16} />
          </button>

          {/* Command Palette (Ctrl+K), AI Wireframe Vision, Charts, RTL & Gallery Hub */}
          <button
            className={`ibtn ${commandVisionModalOpen ? "ibtn-on" : ""}`}
            title="Command Palette (Ctrl+K), AI Wireframe-to-Website, Visual Charts, Custom Cursor & RTL"
            onClick={() => setCommandVisionModalOpen(true)}
            style={{ color: "#f97316" }}
          >
            <Command size={16} />
          </button>

          {/* Live Fullscreen View */}
          <button
            className="ibtn"
            title="Live Fullscreen View"
            onClick={() => setFullscreenOpen(true)}
          >
            <Maximize2 size={16} />
          </button>

          {/* Code/ZIP Upload */}
          <button
            className="upload-bar-btn"
            title="Upload Code, HTML, or ZIP file"
            onClick={() => setUploadModalOpen(true)}
          >
            <Upload size={14} />
            <span>Upload Code / ZIP</span>
          </button>

          {/* Download All Extracted ZIP contents (if zip uploaded) */}
          {preservedZipEntries.length > 0 && (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-950/70 hover:bg-orange-900/90 text-orange-300 border border-orange-700/60 text-xs font-semibold transition shadow-sm"
              title={`Download all ${preservedZipEntries.length} extracted files from current ZIP archive`}
              onClick={() => downloadZipArchive(preservedZipEntries, "extracted-archive.zip")}
            >
              <Download size={14} className="text-orange-400" />
              <span>Download All ({preservedZipEntries.length})</span>
            </button>
          )}

          {/* Download HTML */}
          <button className="ibtn" title="Download HTML" onClick={exportHtml}><Download size={16} /></button>

          {/* Reset Page */}
          <button className="ibtn" title="Reset page" onClick={() => { commit(defaultPage); select(null); }}><RotateCcw size={16} /></button>

          {/* Preview / Edit toggle */}
          <button className="pbtn" onClick={() => { setEditing(!editing); select(null); }}>
            {editing ? <><Eye size={15} /> Preview</> : <><Pencil size={15} /> Edit</>}
          </button>
        </div>
      </header>

      {/* Sticky Announcement Bar */}
      <AnnouncementBar
        visible={announcementVisible}
        onClose={() => setAnnouncementVisible(false)}
      />

      <div className="bld-body">
        {/* Main Canvas Stage */}
        <main
          className="bld-stage relative"
          onClick={() => select(null)}
          onMouseMove={(e) => {
            if (cursorMode !== "none") {
              setCursorCoords({ x: e.clientX, y: e.clientY });
            }
          }}
        >
          {cursorMode !== "none" && (
            <div
              style={{
                position: "fixed",
                left: cursorCoords.x,
                top: cursorCoords.y,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 45,
                width: cursorMode === "spotlight" ? "180px" : "36px",
                height: cursorMode === "spotlight" ? "180px" : "36px",
                borderRadius: "999px",
                border: cursorMode === "neon" ? "2px solid #f97316" : "none",
                boxShadow:
                  cursorMode === "neon"
                    ? "0 0 24px rgba(249, 115, 22, 0.85)"
                    : "none",
                background:
                  cursorMode === "spotlight"
                    ? "radial-gradient(circle, rgba(249, 115, 22, 0.22) 0%, transparent 70%)"
                    : "rgba(249, 115, 22, 0.08)",
                transition: "width 0.15s ease, height 0.15s ease",
              }}
            />
          )}
          <div className="bld-frame flex flex-col" dir={isRtl ? "rtl" : "ltr"} style={{ width: DEVICES[device] }}>
            {(canvasViewMode === "live" && livePreviewHtml) || (!editing && livePreviewHtml) ? (
              <iframe
                srcDoc={livePreviewHtml}
                title="Live Website Interactive Preview"
                className="w-full flex-1 min-h-[85vh] border-0 bg-white"
                sandbox="allow-forms"
              />
            ) : (
              <RenderNode
                node={page}
                selected={selected}
                editing={editing}
                textEditId={textEditId}
                onSelect={select}
                onSelectParent={selectParent}
                onEditText={setTextEditId}
                onMove={move}
                onDuplicate={duplicate}
                onDelete={remove}
                onInsert={insert}
                onOpenAi={() => setAiModalOpen(true)}
                onText={(id, text) => {
                  setTextEditId(null);
                  const n = findNode(page, id);
                  if (n && n.text !== text) update(id, { text });
                }}
              />
            )}
          </div>
        </main>

        {/* Right Inspector */}
        {editing && (
          <aside className="bld-right">
            {selNode ? (
              <>
                <div className="insp-head">
                  <strong>{selNode.id === "root" ? "Page" : selNode.type}</strong>
                  {selNode.id !== "root" && (
                    <div className="bld-group">
                      <button className="ibtn" onClick={() => move(-1)} title="Move up"><ArrowUp size={15} /></button>
                      <button className="ibtn" onClick={() => move(1)} title="Move down"><ArrowDown size={15} /></button>
                      <button className="ibtn" onClick={duplicate} title="Duplicate"><Copy size={15} /></button>
                      <button className="ibtn ibtn-danger" onClick={remove} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  )}
                </div>
                <Inspector
                  key={selNode.id}
                  node={selNode}
                  onChange={(p) => update(selNode.id, p)}
                  onStyle={(k, v) => setStyle(selNode.id, k, v)}
                  onOpenAi={() => setAiModalOpen(true)}
                  onOpenIconStudio={() => setIconStudioModalOpen(true)}
                />
              </>
            ) : (
              <div className="insp-empty">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(true)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "999px",
                    background: "rgba(245, 158, 11, 0.15)",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    color: "#f59e0b",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "12px",
                  }}
                >
                  <Sparkles size={14} />
                  <span>Gemini AI Studio</span>
                </button>
                <p>Click any element to inspect, style, animate, or tell AI to transform it.</p>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Floating Pill Toolbar */}
      {editing && (
        <FloatingToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onAddNode={add}
          onAddStickyNote={addStickyNote}
          onOpenUpload={() => setUploadModalOpen(true)}
          onToggleLayers={() => setShowLayersDrawer(!showLayersDrawer)}
          showLayers={showLayersDrawer}
          onTogglePenOverlay={() => setIsPenActive(!isPenActive)}
          isPenActive={isPenActive}
          onOpenAi={() => setAiModalOpen(true)}
          onOpenTemplates={() => setTemplatesModalOpen(true)}
          onOpenTheme={() => setThemeDrawerOpen(true)}
          onOpenZipExplorer={() => setZipExplorerOpen(true)}
          onOpenAnalytics={() => setAnalyticsModalOpen(true)}
          onOpenBlogCms={() => setBlogCmsModalOpen(true)}
          onOpenIconStudio={() => setIconStudioModalOpen(true)}
          onOpenCollabPwa={() => setCollabPwaModalOpen(true)}
          onOpenVoiceBrandChat={() => setVoiceBrandModalOpen(true)}
          onOpenDeployMarketing={() => setDeployMarketingModalOpen(true)}
          onOpenCrmKanban={() => setCrmKanbanModalOpen(true)}
          onOpenCommandVision={() => setCommandVisionModalOpen(true)}
        />
      )}

      {/* Command Palette (Ctrl+K), AI Wireframe Vision, Charts, Custom Cursor & RTL Modal */}
      <VisionChartCursorCommandModal
        isOpen={commandVisionModalOpen}
        onClose={() => setCommandVisionModalOpen(false)}
        onInsertNode={(newNode) => {
          commit({ ...page, children: [...(page.children ?? []), newNode] });
          select(newNode.id);
        }}
        cursorMode={cursorMode}
        onChangeCursorMode={setCursorMode}
        isRtl={isRtl}
        onToggleRtl={() => setIsRtl((v) => !v)}
        onApplyHeroBgEffect={(effect) => {
          const targetId = selected && selected !== "root" ? selected : page.children?.[0]?.id || "root";
          update(targetId, { bgEffect: effect });
        }}
        onOpenCodeExport={() => setCodeModalOpen(true)}
      />

      {/* Visual CRM Kanban Pipeline, Exit-Intent Popup & 3D Interactive Blocks Modal */}
      <CrmKanbanPopupModal
        isOpen={crmKanbanModalOpen}
        onClose={() => setCrmKanbanModalOpen(false)}
        onInsertNode={(newNode) => {
          commit({ ...page, children: [...(page.children ?? []), newNode] });
          select(newNode.id);
        }}
      />

      {/* AI Voice Commander, Brand Kit Generator & Embeddable AI Chatbot Modal */}
      <AiVoiceBrandChatModal
        isOpen={voiceBrandModalOpen}
        onClose={() => setVoiceBrandModalOpen(false)}
        pageRoot={page}
        onCommitPage={commit}
        onInsertNode={(newNode) => {
          commit({ ...page, children: [...(page.children ?? []), newNode] });
          select(newNode.id);
        }}
        onApplyFont={handleApplyFont}
        onApplyPrimaryColor={handleApplyPrimaryColor}
        initialTab={geminiModalTab}
      />

      {/* 1-Click Cloud Deploy (Vercel/Netlify/Docker), Email Campaigns & WCAG Link Scanner Modal */}
      <DeployMarketingWcagModal
        isOpen={deployMarketingModalOpen}
        onClose={() => setDeployMarketingModalOpen(false)}
        pageRoot={page}
        onCommitPage={commit}
        preservedEntries={preservedZipEntries}
        onUpdatePreservedEntries={setPreservedZipEntries}
      />

      {/* Analytics, Click Heatmap & A/B Conversion Lab Modal */}
      <AnalyticsHeatmapModal
        isOpen={analyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
        pageRoot={page}
        onCommitPage={commit}
      />

      {/* Dynamic Blog, CMS Collections & AI Blog Writer Modal */}
      <BlogCmsModal
        isOpen={blogCmsModalOpen}
        onClose={() => setBlogCmsModalOpen(false)}
        onInsertBlogSection={(blogNode) => {
          commit({ ...page, children: [...(page.children ?? []), blogNode] });
          select(blogNode.id);
        }}
      />

      {/* Custom SVG Icon Picker, Image Filter Studio & Dark/Light Toggle Modal */}
      <IconAssetStudioModal
        isOpen={iconStudioModalOpen}
        onClose={() => setIconStudioModalOpen(false)}
        selectedNode={selNode}
        onUpdateSelectedNode={(patch) => {
          if (selNode) update(selNode.id, patch);
        }}
        onInsertNode={(newNode) => {
          commit({ ...page, children: [...(page.children ?? []), newNode] });
          select(newNode.id);
        }}
      />

      {/* Installable PWA Generator, Webhooks & Client Approval Hub Modal */}
      <CollabPwaWebhookModal
        isOpen={collabPwaModalOpen}
        onClose={() => setCollabPwaModalOpen(false)}
        pageTitle={currentPage.title}
        preservedEntries={preservedZipEntries}
        onUpdatePreservedEntries={setPreservedZipEntries}
      />

      {/* Built-in ZIP File Explorer & Code IDE Sidebar */}
      <ZipExplorerDrawer
        isOpen={zipExplorerOpen}
        onClose={() => setZipExplorerOpen(false)}
        pageRoot={page}
        customCss={customCss}
        onUpdatePageRoot={commit}
        onUpdateCustomCss={setCustomCss}
        preservedEntries={preservedZipEntries}
        onUpdatePreservedEntries={setPreservedZipEntries}
        mainHtmlPath={mainHtmlPath}
        mainCssPath={mainCssPath}
      />

      {/* Firebase Cloud Save & 1-Click Shareable Live Link Modal */}
      <CloudPublishModal
        isOpen={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
        currentPageRoot={page}
        customCss={customCss}
        pageTitle={currentPage.title}
        onLoadProject={(loadedRoot, loadedCss, loadedName) => {
          commit(loadedRoot);
          setCustomCss(loadedCss);
          handleUpdateSeo(currentPage.id, loadedName, currentPage.description);
        }}
      />

      {/* Pen Draw / Doodle Annotation Overlay */}
      <DrawOverlay
        isActive={isPenActive}
        onClose={() => setIsPenActive(false)}
      />

      {/* On-demand Layers Drawer */}
      <LayersDrawer
        isOpen={showLayersDrawer}
        onClose={() => setShowLayersDrawer(false)}
        rootNode={page}
        selectedId={selected}
        onSelect={select}
      />

      {/* Upload ZIP / Code Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onImport={handleImport}
        currentPage={page}
        customCss={customCss}
        preservedEntries={preservedZipEntries}
        onUpdatePreservedEntries={setPreservedZipEntries}
        mainHtmlPath={mainHtmlPath}
        mainCssPath={mainCssPath}
      />

      {/* Ready-made Section Templates Library Modal */}
      <TemplateLibraryModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        onInsertTemplate={handleInsertTemplate}
      />

      {/* 1-Click Themes & Google Fonts Drawer */}
      <ThemeDrawer
        isOpen={themeDrawerOpen}
        onClose={() => setThemeDrawerOpen(false)}
        page={page}
        onApplyTheme={handleApplyTheme}
        onApplyFont={handleApplyFont}
        onApplyPrimaryColor={handleApplyPrimaryColor}
        currentFont={currentFont}
        currentPrimaryColor={currentPrimaryColor}
      />

      {/* Multi-Page & SEO Meta Manager Modal */}
      <PageManagerModal
        isOpen={pageManagerOpen}
        onClose={() => setPageManagerOpen(false)}
        pages={pages}
        activePageId={activePageId}
        onSelectPage={(id) => {
          setActivePageId(id);
          select(null);
        }}
        onCreatePage={handleCreatePage}
        onDeletePage={handleDeletePage}
        onUpdateSeo={handleUpdateSeo}
      />

      {/* Fullscreen Live Presentation Preview */}
      <FullscreenPreview
        isOpen={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        page={page}
        pageName={currentPage.name}
        liveHtml={livePreviewHtml}
      />

      {/* Live Code & Custom CSS Inspector Modal */}
      <CodeInspectorModal
        isOpen={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        selectedNode={selNode}
        pageRoot={page}
        customCss={customCss}
        onUpdateCustomCss={setCustomCss}
        pageTitle={currentPage.title}
        pageDescription={currentPage.description}
      />

      {/* Form Leads & Inbox Modal */}
      <FormLeadsModal
        isOpen={leadsModalOpen}
        onClose={() => setLeadsModalOpen(false)}
      />

      {/* Version History & Snapshots Modal */}
      <VersionHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        snapshots={snapshots}
        onSaveSnapshot={handleSaveSnapshot}
        onRestoreSnapshot={handleRestoreSnapshot}
      />

      {/* Gemini AI Super Studio Modal */}
      <AiModifierModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        selectedNode={selNode}
        onApplyModification={handleApplyAiModification}
        onApplyNewSection={handleApplyAiNewSection}
        onApplyImageToNode={handleApplyImageToNode}
        onApplyTranslatedPage={handleApplyTranslatedPage}
        onApplyFullSite={handleApplyFullSite}
        onUpdateSeoMeta={(title, desc) => handleUpdateSeo(currentPage.id, title, desc)}
        pageRoot={page}
        onUndoLastAiChange={undo}
      />
    </div>
  );
}
