import React, { useState, useRef, useEffect } from "react";
import {
  MousePointer2,
  Pencil,
  MessageSquare,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Square,
  Columns3,
  AlignLeft,
  MousePointerClick,
  Image as ImageIcon,
  Minus,
  Upload,
  Layers,
  Sparkles,
  Heading,
  LayoutGrid,
  Palette,
  ShoppingBag,
  FileInput,
  Calculator,
  HelpCircle,
  MessageCircle,
  FolderTree,
  CreditCard,
  BarChart3,
  BookOpen,
  ShieldCheck,
  Sun,
  Smartphone,
  Mic,
  Rocket,
  Bot,
  Kanban,
  Calendar,
  SplitSquareHorizontal,
  Command,
  Globe,
  FileText,
  Code2,
  Menu,
} from "lucide-react";
import type { NodeType } from "./types";

interface FloatingToolbarProps {
  activeTool: "select" | "text" | "pen" | "comment";
  setActiveTool: (tool: "select" | "text" | "pen" | "comment") => void;
  onAddNode: (type: NodeType) => void;
  onAddStickyNote: () => void;
  onOpenUpload: () => void;
  onToggleLayers: () => void;
  showLayers: boolean;
  onTogglePenOverlay: () => void;
  isPenActive: boolean;
  onOpenAi: () => void;
  onOpenTemplates?: () => void;
  onOpenTheme?: () => void;
  onOpenZipExplorer?: () => void;
  onOpenAnalytics?: () => void;
  onOpenBlogCms?: () => void;
  onOpenIconStudio?: () => void;
  onOpenCollabPwa?: () => void;
  onOpenVoiceBrandChat?: () => void;
  onOpenDeployMarketing?: () => void;
  onOpenCrmKanban?: () => void;
  onOpenCommandVision?: () => void;
}

export function FloatingToolbar({
  activeTool,
  setActiveTool,
  onAddNode,
  onAddStickyNote,
  onOpenUpload,
  onToggleLayers,
  showLayers,
  onTogglePenOverlay,
  isPenActive,
  onOpenAi,
  onOpenTemplates,
  onOpenTheme,
  onOpenZipExplorer,
  onOpenAnalytics,
  onOpenBlogCms,
  onOpenIconStudio,
  onOpenCollabPwa,
  onOpenVoiceBrandChat,
  onOpenDeployMarketing,
  onOpenCrmKanban,
  onOpenCommandVision,
}: FloatingToolbarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTextMenu, setShowTextMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const textMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
      if (textMenuRef.current && !textMenuRef.current.contains(e.target as Node)) {
        setShowTextMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const elementsList: { type: NodeType; label: string; icon: React.ElementType }[] = [
    { type: "section", label: "Section", icon: Square },
    { type: "container", label: "Row / Box", icon: Columns3 },
    { type: "smartNavbar", label: "Sticky Navbar", icon: Menu },
    { type: "heading", label: "Heading", icon: Heading },
    { type: "text", label: "Paragraph", icon: AlignLeft },
    { type: "button", label: "Button", icon: MousePointerClick },
    { type: "image", label: "Image", icon: ImageIcon },
    { type: "dataChart", label: "Visual Charts", icon: BarChart3 },
    { type: "directoryGrid", label: "Search Directory", icon: LayoutGrid },
    { type: "apiTable", label: "REST API Table", icon: Code2 },
    { type: "langSwitcher", label: "Language & RTL Bar", icon: Globe },
    { type: "masonryGallery", label: "Masonry Lightbox", icon: ImageIcon },
    { type: "pdfViewer", label: "PDF Brochure Viewer", icon: FileText },
    { type: "imageHotspot", label: "Image Hotspot (+)", icon: Sparkles },
    { type: "customEmbed", label: "HTML/Iframe Embed", icon: Code2 },
    { type: "blog", label: "Blog & CMS Grid", icon: BookOpen },
    { type: "aiChatbot", label: "AI Support Chatbot", icon: Bot },
    { type: "beforeAfter", label: "Before/After Slider", icon: SplitSquareHorizontal },
    { type: "marquee", label: "Infinite Marquee", icon: Layers },
    { type: "tiltCard", label: "3D Tilt Spotlight", icon: Sparkles },
    { type: "bookingCalendar", label: "Booking Calendar", icon: Calendar },
    { type: "iconBadge", label: "SVG Icon Badge", icon: ShieldCheck },
    { type: "themeToggle", label: "Dark/Light Toggle", icon: Sun },
    { type: "form", label: "Contact/Booking Form", icon: FileInput },
    { type: "product", label: "E-Commerce Product", icon: ShoppingBag },
    { type: "pricing", label: "Pricing Toggle", icon: CreditCard },
    { type: "faq", label: "FAQ Accordion", icon: HelpCircle },
    { type: "calculator", label: "Price Calculator", icon: Calculator },
    { type: "tabs", label: "Content Tabs", icon: Layers },
    { type: "popup", label: "Promo Popup", icon: Sparkles },
    { type: "whatsapp", label: "WhatsApp Chat", icon: MessageCircle },
    { type: "divider", label: "Divider", icon: Minus },
  ];

  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
      {showMoreMenu && (
        <div
          ref={moreMenuRef}
          className="mb-3 w-80 bg-[#1c1917]/95 backdrop-blur-md border border-[#3c3836] rounded-2xl shadow-2xl p-2.5 text-stone-200 animate-in fade-in slide-in-from-bottom-2 duration-150 max-h-[75vh] overflow-y-auto"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-800">
            Insert Dynamic Blocks, E-Commerce & Forms
          </div>

          <div className="grid grid-cols-2 gap-1 py-1.5">
            {elementsList.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onAddNode(type);
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-stone-300 hover:text-white hover:bg-stone-800/80 transition text-left"
              >
                <Icon size={14} className="text-orange-400 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-stone-800 pt-1.5 space-y-1">
            {onOpenZipExplorer && (
              <button
                type="button"
                onClick={() => {
                  onOpenZipExplorer();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition"
              >
                <div className="flex items-center gap-2">
                  <FolderTree size={14} />
                  <span>ZIP File Explorer & Code IDE</span>
                </div>
                <span className="text-[10px] font-mono">Full-Stack</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onOpenUpload();
                setShowMoreMenu(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-orange-400 hover:bg-orange-500/10 transition"
            >
              <div className="flex items-center gap-2">
                <Upload size={14} />
                <span>Upload Code / ZIP</span>
              </div>
              <span className="text-[10px] font-mono">.zip/.html</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onToggleLayers();
                setShowMoreMenu(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                showLayers ? "bg-stone-800 text-white" : "text-stone-300 hover:text-white hover:bg-stone-800/80"
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-stone-400" />
                <span>Page Layers Tree</span>
              </div>
              <span className="text-[10px] text-stone-500">Tree view</span>
            </button>

            {onOpenTemplates && (
              <button
                type="button"
                onClick={() => {
                  onOpenTemplates();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-stone-300 hover:text-white hover:bg-stone-800/80 transition"
              >
                <div className="flex items-center gap-2">
                  <LayoutGrid size={14} className="text-orange-400" />
                  <span>Section Templates Library</span>
                </div>
                <span className="text-[10px] text-stone-500">Ready</span>
              </button>
            )}

            {onOpenTheme && (
              <button
                type="button"
                onClick={() => {
                  onOpenTheme();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-stone-300 hover:text-white hover:bg-stone-800/80 transition"
              >
                <div className="flex items-center gap-2">
                  <Palette size={14} className="text-cyan-400" />
                  <span>Themes & Google Fonts</span>
                </div>
                <span className="text-[10px] text-stone-500">Global</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onOpenAi();
                setShowMoreMenu(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} />
                <span>Gemini AI Super Studio</span>
              </div>
              <span className="text-[10px] font-mono">AI</span>
            </button>

            {onOpenAnalytics && (
              <button
                type="button"
                onClick={() => {
                  onOpenAnalytics();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-stone-200 hover:bg-stone-800/80 transition"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 size={14} className="text-orange-400" />
                  <span>Analytics, Heatmap & A/B Lab</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">Live</span>
              </button>
            )}

            {onOpenBlogCms && (
              <button
                type="button"
                onClick={() => {
                  onOpenBlogCms();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-stone-200 hover:bg-stone-800/80 transition"
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-amber-400" />
                  <span>Blog, CMS & AI Article Writer</span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">CMS</span>
              </button>
            )}

            {onOpenIconStudio && (
              <button
                type="button"
                onClick={() => {
                  onOpenIconStudio();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-stone-200 hover:bg-stone-800/80 transition"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-purple-400" />
                  <span>SVG Icon & Image Filter Studio</span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">Assets</span>
              </button>
            )}

            {onOpenCollabPwa && (
              <button
                type="button"
                onClick={() => {
                  onOpenCollabPwa();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-stone-200 hover:bg-stone-800/80 transition"
              >
                <div className="flex items-center gap-2">
                  <Smartphone size={14} className="text-emerald-400" />
                  <span>PWA App, Webhooks & Approval</span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">Pro</span>
              </button>
            )}

            {onOpenVoiceBrandChat && (
              <button
                type="button"
                onClick={() => {
                  onOpenVoiceBrandChat();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-stone-200 hover:bg-stone-800/80 transition"
              >
                <div className="flex items-center gap-2">
                  <Mic size={14} className="text-orange-400" />
                  <span>Voice Commander, Brand Kit & Bot</span>
                </div>
                <span className="text-[10px] font-mono text-orange-400">Voice</span>
              </button>
            )}

            {onOpenDeployMarketing && (
              <button
                type="button"
                onClick={() => {
                  onOpenDeployMarketing();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-stone-200 hover:bg-stone-800/80 transition"
              >
                <div className="flex items-center gap-2">
                  <Rocket size={14} className="text-sky-400" />
                  <span>Deploy, Email Campaigns & WCAG</span>
                </div>
                <span className="text-[10px] font-mono text-sky-400">Launch</span>
              </button>
            )}

            {onOpenCrmKanban && (
              <button
                type="button"
                onClick={() => {
                  onOpenCrmKanban();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-stone-200 hover:bg-stone-800/80 transition"
              >
                <div className="flex items-center gap-2">
                  <Kanban size={14} className="text-emerald-400" />
                  <span>CRM Kanban, Exit Popup & 3D Blocks</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">CRM</span>
              </button>
            )}

            {onOpenCommandVision && (
              <button
                type="button"
                onClick={() => {
                  onOpenCommandVision();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-stone-200 hover:bg-stone-800/80 transition"
              >
                <div className="flex items-center gap-2">
                  <Command size={14} className="text-orange-400" />
                  <span>Ctrl+K, AI Sketch Vision, Charts & RTL</span>
                </div>
                <span className="text-[10px] font-mono text-orange-400">Ctrl+K</span>
              </button>
            )}
          </div>
        </div>
      )}

      {showTextMenu && (
        <div
          ref={textMenuRef}
          className="mb-3 bg-[#1c1917]/95 backdrop-blur-md border border-[#3c3836] rounded-xl shadow-2xl p-1.5 flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <button
            type="button"
            onClick={() => {
              onAddNode("heading");
              setShowTextMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-200 hover:bg-stone-800 hover:text-orange-400 transition"
          >
            <Heading size={13} />
            Heading
          </button>
          <button
            type="button"
            onClick={() => {
              onAddNode("text");
              setShowTextMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-200 hover:bg-stone-800 hover:text-orange-400 transition"
          >
            <AlignLeft size={13} />
            Paragraph
          </button>
        </div>
      )}

      <div
        className="flex items-center bg-[#18181b]/95 backdrop-blur-md border border-stone-800/90 rounded-full px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.55)] transition-all duration-200"
        style={{ minHeight: "44px" }}
      >
        {!collapsed ? (
          <>
            <button
              type="button"
              onClick={() => {
                setActiveTool("select");
                if (isPenActive) onTogglePenOverlay();
              }}
              title="Select / Pointer Tool"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                activeTool === "select" && !isPenActive
                  ? "bg-stone-800 text-orange-400 shadow-sm"
                  : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
              }`}
            >
              <MousePointer2 size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTool("text");
                setShowTextMenu(!showTextMenu);
              }}
              title="Add Text or Heading"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all font-serif font-bold text-sm ${
                activeTool === "text" || showTextMenu
                  ? "bg-stone-800 text-orange-400"
                  : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
              }`}
            >
              <span className="font-sans font-semibold text-base leading-none">T</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTool("pen");
                onTogglePenOverlay();
              }}
              title="Draw / Doodle Overlay"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isPenActive
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
              }`}
            >
              <Pencil size={15} />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTool("comment");
                onAddStickyNote();
              }}
              title="Add Sticky Note / Comment Callout"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                activeTool === "comment"
                  ? "bg-stone-800 text-orange-400"
                  : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
              }`}
            >
              <MessageSquare size={15} />
            </button>

            {onOpenZipExplorer && (
              <button
                type="button"
                onClick={onOpenZipExplorer}
                title="Open Built-In ZIP File Explorer & Code Editor"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all text-emerald-400 hover:text-emerald-300 hover:bg-stone-800/80"
              >
                <FolderTree size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={onOpenAi}
              title="Gemini AI Studio"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all text-amber-400 hover:text-amber-300 hover:bg-stone-800/80"
            >
              <Sparkles size={16} />
            </button>

            <div className="w-[1px] h-4 bg-stone-700/80 mx-1.5" />

            <button
              type="button"
              onClick={() => {
                setShowMoreMenu(!showMoreMenu);
                setShowTextMenu(false);
              }}
              title="More Elements & Tools"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                showMoreMenu
                  ? "bg-stone-800 text-orange-400"
                  : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
              }`}
            >
              <MoreHorizontal size={17} />
            </button>

            <button
              type="button"
              onClick={() => setCollapsed(true)}
              title="Minimize Toolbar"
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-200 hover:bg-stone-800/60 transition"
            >
              <ChevronRight size={15} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            title="Expand Toolbar"
            className="flex items-center gap-1.5 px-3 py-1 text-xs text-stone-400 hover:text-stone-100 transition"
          >
            <Sparkles size={14} className="text-orange-400" />
            <span className="font-medium">Tools</span>
            <ChevronLeft size={14} className="rotate-180" />
          </button>
        )}
      </div>
    </div>
  );
}
