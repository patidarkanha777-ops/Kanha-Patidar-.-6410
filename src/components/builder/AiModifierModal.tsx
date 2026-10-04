import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Undo2,
  Wand2,
  PlusCircle,
  Layers,
  Heading,
  AlignLeft,
  MousePointerClick,
  Square,
  Columns3,
  Image as ImageIcon,
  Mic,
  MicOff,
  Languages,
  Globe,
  Camera,
  Gauge,
  Link2,
} from "lucide-react";
import type { BNode } from "./types";

interface AiModifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: BNode | null;
  onApplyModification: (updatedNode: BNode, explanation: string) => void;
  onApplyNewSection: (newSection: BNode, explanation: string) => void;
  onApplyTranslatedPage?: (translatedRoot: BNode, explanation: string) => void;
  onApplyImageToNode?: (imageUrl: string, explanation: string) => void;
  onApplyFullSite?: (sitePages: any[], explanation: string) => void;
  onUpdateSeoMeta?: (title: string, description: string) => void;
  pageRoot?: BNode;
  onUndoLastAiChange?: () => void;
}

export function AiModifierModal({
  isOpen,
  onClose,
  selectedNode,
  onApplyModification,
  onApplyNewSection,
  onApplyTranslatedPage,
  onApplyImageToNode,
  onApplyFullSite,
  onUpdateSeoMeta,
  pageRoot,
  onUndoLastAiChange,
}: AiModifierModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "modify" | "generate" | "image" | "translate" | "fullsite" | "vision" | "seo" | "urlclone"
  >(selectedNode?.type === "image" ? "image" : selectedNode ? "modify" : "fullsite");

  // Voice speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [targetLang, setTargetLang] = useState("Hindi");
  const [tone, setTone] = useState("Catchy SaaS & Modern");

  // Vision AI state
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const visionInputRef = useRef<HTMLInputElement>(null);

  // URL Cloner state
  const [cloneUrl, setCloneUrl] = useState("https://stripe.com");

  // SEO Audit state
  const [seoAuditResult, setSeoAuditResult] = useState<{
    seoScore: number;
    speedScore: number;
    mobileScore: number;
    recommendedTitle: string;
    recommendedDescription: string;
    issues: string[];
    optimizedPage?: BNode;
  } | null>(null);

  useEffect(() => {
    if (selectedNode?.type === "image") {
      setActiveTab("image");
    } else if (selectedNode) {
      setActiveTab("modify");
    }
    setError(null);
  }, [selectedNode, isOpen]);

  if (!isOpen) return null;

  const toggleVoiceRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleVisionUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setScreenshotDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunSeoAudit = async () => {
    if (!pageRoot) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/seo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: pageRoot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed SEO audit.");
      setSeoAuditResult(data);
    } catch (err: any) {
      setError(err?.message || "Failed to run AI SEO & Speed Audit.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySeoFix = () => {
    if (!seoAuditResult) return;
    if (seoAuditResult.optimizedPage && onApplyTranslatedPage) {
      onApplyTranslatedPage(seoAuditResult.optimizedPage, "Auto-fixed SEO headings, alt text & responsive layout!");
    }
    if (onUpdateSeoMeta && seoAuditResult.recommendedTitle) {
      onUpdateSeoMeta(seoAuditResult.recommendedTitle, seoAuditResult.recommendedDescription);
    }
    setLastExplanation("Applied AI SEO Meta Tags, H1 hierarchy & mobile responsiveness fixes!");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    setLastExplanation(null);

    try {
      if (activeTab === "vision") {
        if (!screenshotDataUrl) {
          throw new Error("Please upload a website screenshot or design image first.");
        }
        const response = await fetch("/api/ai/vision-to-site", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageDataUrl: screenshotDataUrl,
            prompt: prompt.trim() || "Convert this UI screenshot into an editable modern website layout.",
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to convert screenshot to website.");
        }
        if (onApplyTranslatedPage && data.page) {
          onApplyTranslatedPage(data.page, data.explanation);
        } else if (data.newSection) {
          onApplyNewSection(data.newSection, data.explanation);
        }
        setLastExplanation(data.explanation || "Converted screenshot into editable Canvas blocks!");
        return;
      }

      if (activeTab === "urlclone") {
        if (!cloneUrl.trim()) {
          throw new Error("Please enter a valid URL to clone.");
        }
        const response = await fetch("/api/ai/clone-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: cloneUrl.trim(),
            prompt: prompt.trim(),
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to clone website URL.");
        }
        if (onApplyTranslatedPage && data.page) {
          onApplyTranslatedPage(data.page, data.explanation);
        }
        setLastExplanation(data.explanation || `Imported structure & copy from ${cloneUrl}!`);
        return;
      }

      if (activeTab === "modify" && selectedNode) {
        const response = await fetch("/api/ai/modify-element", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            node: selectedNode,
            prompt: prompt.trim(),
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to update element.");
        }

        onApplyModification(data.updatedNode, data.explanation);
        setLastExplanation(data.explanation);
        setPrompt("");
      } else if (activeTab === "image") {
        const response = await fetch("/api/ai/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to generate image.");
        }

        if (onApplyImageToNode) {
          onApplyImageToNode(data.imageUrl, data.explanation);
        } else if (selectedNode) {
          onApplyModification({ ...selectedNode, src: data.imageUrl }, data.explanation);
        }
        setLastExplanation(data.explanation);
        setPrompt("");
      } else if (activeTab === "translate" && pageRoot && onApplyTranslatedPage) {
        const response = await fetch("/api/ai/translate-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: pageRoot,
            targetLang,
            tone,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to translate page.");
        }

        onApplyTranslatedPage(data.translatedPage, data.explanation);
        setLastExplanation(data.explanation);
      } else if (activeTab === "fullsite" && onApplyFullSite) {
        const response = await fetch("/api/ai/generate-full-site", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to generate full website.");
        }

        onApplyFullSite(data.sitePages, data.explanation);
        setLastExplanation(data.explanation);
        setPrompt("");
      } else {
        const response = await fetch("/api/ai/generate-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to generate section.");
        }

        onApplyNewSection(data.newSection, data.explanation);
        setLastExplanation(data.explanation);
        setPrompt("");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong while communicating with Gemini AI.");
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = () => {
    if (activeTab === "image") {
      return [
        "A modern 3D illustration of a rocket launching into space",
        "Minimalist modern cafe workspace with warm sunlight",
        "Cyberpunk futuristic neon city street with reflections",
        "High-tech software developer coding setup",
      ];
    }
    if (activeTab === "fullsite") {
      return [
        "Gym & Fitness Studio with membership pricing, timetable & contact page",
        "Modern SaaS developer tools startup with dark theme & feature matrix",
        "Artisanal Coffee & Bakery cafe with menu, story & reservation page",
      ];
    }
    return [
      "Create a modern SaaS hero section with gradient text and CTA",
      "Create a 3-column feature showcase with clean cards",
      "Make this element dark glassmorphism with glowing orange accent",
      "Rewrite in Hindi: modern & professional tone",
    ];
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "heading": return <Heading size={14} className="text-orange-400" />;
      case "text": return <AlignLeft size={14} className="text-amber-400" />;
      case "button": return <MousePointerClick size={14} className="text-emerald-400" />;
      case "container": return <Columns3 size={14} className="text-sky-400" />;
      case "section": return <Square size={14} className="text-purple-400" />;
      case "image": return <ImageIcon size={14} className="text-pink-400" />;
      default: return <Layers size={14} className="text-stone-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#1c1917] border border-[#3c3836] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3836] bg-[#221f1d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                Gemini AI Super Studio
                <span className="text-[11px] font-normal text-orange-400">
                  gemini-3.8-flash
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Vision Screenshot-to-Site, AI SEO Optimizer, URL Cloner, Voice & Full Site Builder
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

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-[#3c3836] bg-[#191716] px-4 overflow-x-auto">
          <button
            onClick={() => { setActiveTab("modify"); setError(null); }}
            disabled={!selectedNode}
            className={`flex items-center gap-1.5 py-3 px-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === "modify"
                ? "border-orange-500 text-orange-400 bg-orange-500/5"
                : selectedNode
                ? "border-transparent text-stone-400 hover:text-stone-200"
                : "border-transparent text-stone-600 cursor-not-allowed"
            }`}
          >
            <Wand2 size={13} />
            Modify
          </button>

          <button
            onClick={() => { setActiveTab("vision"); setError(null); }}
            className={`flex items-center gap-1.5 py-3 px-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === "vision"
                ? "border-orange-500 text-orange-400 bg-orange-500/5"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Camera size={13} />
            Screenshot → Site
          </button>

          <button
            onClick={() => { setActiveTab("seo"); setError(null); }}
            className={`flex items-center gap-1.5 py-3 px-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === "seo"
                ? "border-orange-500 text-orange-400 bg-orange-500/5"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Gauge size={13} />
            SEO & Speed
          </button>

          <button
            onClick={() => { setActiveTab("urlclone"); setError(null); }}
            className={`flex items-center gap-1.5 py-3 px-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === "urlclone"
                ? "border-orange-500 text-orange-400 bg-orange-500/5"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Link2 size={13} />
            URL Cloner
          </button>

          <button
            onClick={() => { setActiveTab("fullsite"); setError(null); }}
            className={`flex items-center gap-1.5 py-3 px-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === "fullsite"
                ? "border-orange-500 text-orange-400 bg-orange-500/5"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Globe size={13} />
            Full Site
          </button>

          <button
            onClick={() => { setActiveTab("generate"); setError(null); }}
            className={`flex items-center gap-1.5 py-3 px-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === "generate"
                ? "border-orange-500 text-orange-400 bg-orange-500/5"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <PlusCircle size={13} />
            Section
          </button>

          <button
            onClick={() => { setActiveTab("image"); setError(null); }}
            className={`flex items-center gap-1.5 py-3 px-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === "image"
                ? "border-orange-500 text-orange-400 bg-orange-500/5"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <ImageIcon size={13} />
            Image
          </button>

          <button
            onClick={() => { setActiveTab("translate"); setError(null); }}
            className={`flex items-center gap-1.5 py-3 px-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === "translate"
                ? "border-orange-500 text-orange-400 bg-orange-500/5"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Languages size={13} />
            Translate
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === "modify" && selectedNode && (
            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-stone-800 border border-stone-700">
                  {getNodeIcon(selectedNode.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-200 uppercase text-[11px] tracking-wide">
                      Target: {selectedNode.type}
                    </span>
                    <span className="font-mono text-[10px] text-stone-500">#{selectedNode.id.slice(0, 8)}</span>
                  </div>
                  <p className="text-[11px] text-stone-400 truncate max-w-sm">
                    {selectedNode.text ? `"${selectedNode.text}"` : "Element style node"}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-orange-400">Ready for AI</span>
            </div>
          )}

          {lastExplanation && (
            <div className="p-3 rounded-xl bg-green-950/40 border border-green-500/40 text-xs text-green-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                <span>{lastExplanation}</span>
              </div>
              {onUndoLastAiChange && (
                <button
                  type="button"
                  onClick={() => {
                    onUndoLastAiChange();
                    setLastExplanation("Reverted AI change.");
                  }}
                  className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition"
                >
                  <Undo2 size={12} />
                  Undo
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB: VISION AI (SCREENSHOT TO SITE) */}
          {activeTab === "vision" && (
            <div className="space-y-4">
              <div
                onClick={() => visionInputRef.current?.click()}
                className="border-2 border-dashed border-stone-700 hover:border-orange-500 rounded-2xl p-6 text-center cursor-pointer bg-stone-900/50 transition"
              >
                <input
                  ref={visionInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleVisionUpload(e.target.files[0]);
                  }}
                />
                {screenshotDataUrl ? (
                  <div className="space-y-2">
                    <img
                      src={screenshotDataUrl}
                      alt="Uploaded design"
                      className="max-h-44 mx-auto rounded-xl border border-stone-700 object-contain"
                    />
                    <p className="text-xs text-emerald-400 font-semibold">
                      Screenshot loaded! Click "Rebuild Website from Screenshot" below.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera size={28} className="text-orange-400 mx-auto" />
                    <p className="text-xs font-bold text-stone-200">
                      Upload any Website Screenshot, Figma Mockup, or Sketch
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Gemini Vision AI will analyze colors, typography, and layout to build editable Canvas blocks.
                    </p>
                  </div>
                )}
              </div>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Optional instruction (e.g. 'Use dark theme and make buttons orange')..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-stone-700 text-xs text-white"
              />
            </div>
          )}

          {/* TAB: AI SEO & SPEED OPTIMIZER */}
          {activeTab === "seo" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-100">
                    1-Click AI SEO, Meta Tag & Mobile Speed Audit
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Scans heading hierarchy (H1–H6), copy clarity, meta tags, and mobile layout responsiveness.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunSeoAudit}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <Gauge size={13} />}
                  <span>Run Live Audit</span>
                </button>
              </div>

              {seoAuditResult && (
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                      <div className="text-[11px] text-stone-400">SEO Score</div>
                      <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
                        {seoAuditResult.seoScore}/100
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                      <div className="text-[11px] text-stone-400">Speed Score</div>
                      <div className="text-xl font-extrabold text-orange-400 mt-0.5">
                        {seoAuditResult.speedScore}/100
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                      <div className="text-[11px] text-stone-400">Mobile Ready</div>
                      <div className="text-xl font-extrabold text-sky-400 mt-0.5">
                        {seoAuditResult.mobileScore}/100
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="font-bold text-stone-300">AI Recommendations & Findings:</div>
                    {seoAuditResult.issues.map((iss, i) => (
                      <div key={i} className="text-stone-400 flex items-start gap-2">
                        <span className="text-orange-400">•</span>
                        <span>{iss}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleApplySeoFix}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                  >
                    ✨ 1-Click Auto-Fix SEO Meta Tags & Mobile Layout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: URL CLONER */}
          {activeTab === "urlclone" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Target Website URL to Clone / Import
                </label>
                <input
                  type="url"
                  value={cloneUrl}
                  onChange={(e) => setCloneUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-stone-700 text-xs font-mono text-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Customization Notes (Optional)
                </label>
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. 'Keep the hero and pricing structure but adapt for my AI agency'"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-stone-700 text-xs text-white"
                />
              </div>
              <p className="text-[11px] text-stone-400">
                Canvas fetches the live page metadata/headings from the URL and reconstructs an editable layout on your canvas.
              </p>
            </div>
          )}

          {/* TAB: TRANSLATE */}
          {activeTab === "translate" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Target Language</label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-[#141210] border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200"
                  >
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="English">English (US/UK)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Tone & Polish</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-[#141210] border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200"
                  >
                    <option value="Catchy SaaS & Modern">Catchy SaaS & High-Converting</option>
                    <option value="Professional & Formal">Professional & Corporate</option>
                    <option value="Friendly & Casual">Friendly & Approachable</option>
                    <option value="Minimalist & Direct">Minimalist (Apple-like)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STANDARD PROMPT TABS */}
          {["modify", "generate", "image", "fullsite"].includes(activeTab) && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-300">
                    {activeTab === "modify"
                      ? "Batao is element me kya change karna hai:"
                      : activeTab === "image"
                      ? "Describe the photo or illustration you want:"
                      : "Describe what you want Gemini AI to build:"}
                  </label>
                  <button
                    type="button"
                    onClick={toggleVoiceRecognition}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-stone-800 text-stone-300 hover:text-orange-400"
                    }`}
                  >
                    {isListening ? <MicOff size={12} /> : <Mic size={12} />}
                    <span>{isListening ? "Listening..." : "Voice Dictate"}</span>
                  </button>
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  disabled={loading}
                  placeholder="Type in Hindi or English..."
                  className="w-full bg-[#141210] border border-stone-700 rounded-xl p-3.5 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <p className="text-[11px] font-medium text-stone-400 mb-2 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-orange-400" />
                  Quick suggestions:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {getSuggestions().map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPrompt(sug)}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-orange-500/60 text-[11px] text-left transition"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* Footer Action Buttons */}
          {activeTab !== "seo" && (
            <div className="flex items-center justify-between pt-3 border-t border-[#3c3836]">
              <span className="text-[11px] text-stone-500">
                Powered by <span className="text-orange-400 font-semibold">Gemini 3.8 Flash</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-semibold transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={loading}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-orange-900/30 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Processing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>
                        {activeTab === "vision"
                          ? "Rebuild Website from Screenshot"
                          : activeTab === "urlclone"
                          ? "Clone & Import URL"
                          : activeTab === "modify"
                          ? "Apply Changes"
                          : activeTab === "image"
                          ? "Generate Image"
                          : activeTab === "translate"
                          ? `Translate to ${targetLang}`
                          : activeTab === "fullsite"
                          ? "Generate Full Website"
                          : "Generate Section"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
