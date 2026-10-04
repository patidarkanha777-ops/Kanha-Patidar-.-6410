import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Webhook,
  MessageSquareMore,
  X,
  CheckCircle2,
  Send,
  Plus,
  Trash2,
  Download,
  FolderPlus,
  ShieldCheck,
  AlertCircle,
  Play,
} from "lucide-react";
import type { PreservedZipEntry } from "./importer";

interface CollabPwaWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageTitle: string;
  preservedEntries: PreservedZipEntry[];
  onUpdatePreservedEntries: (entries: PreservedZipEntry[]) => void;
}

export function CollabPwaWebhookModal({
  isOpen,
  onClose,
  pageTitle,
  preservedEntries,
  onUpdatePreservedEntries,
}: CollabPwaWebhookModalProps) {
  const [tab, setTab] = useState<"pwa" | "webhooks" | "comments">("pwa");

  // PWA Generator State
  const [appName, setAppName] = useState(pageTitle || "Canvas Pro App");
  const [shortName, setShortName] = useState("CanvasApp");
  const [themeColor, setThemeColor] = useState("#f97316");
  const [bgColor, setBgColor] = useState("#09090b");
  const [displayMode, setDisplayMode] = useState<"standalone" | "fullscreen">("standalone");
  const [pwaInjected, setPwaInjected] = useState(false);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [whName, setWhName] = useState("");
  const [whProvider, setWhProvider] = useState("Zapier");
  const [whUrl, setWhUrl] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);

  // Client Comments & Approval State
  const [comments, setComments] = useState<any[]>([]);
  const [approval, setApproval] = useState<any>({ status: "pending", approvedBy: "", notes: "" });
  const [cmtAuthor, setCmtAuthor] = useState("");
  const [cmtSection, setCmtSection] = useState("Hero Section");
  const [cmtText, setCmtText] = useState("");
  const [approverName, setApproverName] = useState("");

  const loadData = async () => {
    try {
      const [whRes, cmtRes] = await Promise.all([
        fetch("/api/webhooks"),
        fetch("/api/comments"),
      ]);
      const whData = await whRes.json();
      const cmtData = await cmtRes.json();
      if (whData.webhooks) setWebhooks(whData.webhooks);
      if (whData.logs) setLogs(whData.logs);
      if (cmtData.comments) setComments(cmtData.comments);
      if (cmtData.approval) setApproval(cmtData.approval);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const manifestJson = JSON.stringify(
    {
      id: "/",
      name: appName,
      short_name: shortName.slice(0, 12),
      description: `${appName} — Installable Progressive Web Application built with Canvas.`,
      start_url: "/",
      scope: "/",
      display: displayMode,
      theme_color: themeColor,
      background_color: bgColor,
      icons: [
        { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    null,
    2
  );

  const serviceWorkerJs = `// Canvas Generated Offline-Ready Service Worker
const CACHE_NAME = "${shortName.toLowerCase().replace(/[^a-z0-9]/g, "")}-pwa-v1";
const PRECACHE_URLS = ["/", "/index.html", "/styles.css", "/manifest.json"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
`;

  const handleInjectPwaIntoProject = () => {
    const manifestEntry: PreservedZipEntry = {
      path: "manifest.json",
      content: manifestJson,
      isBase64: false,
      category: "config",
    };
    const swEntry: PreservedZipEntry = {
      path: "service-worker.js",
      content: serviceWorkerJs,
      isBase64: false,
      category: "backend",
    };
    const filtered = preservedEntries.filter(
      (e) => e.path !== "manifest.json" && e.path !== "service-worker.js"
    );
    onUpdatePreservedEntries([...filtered, manifestEntry, swEntry]);
    setPwaInjected(true);
    setTimeout(() => setPwaInjected(false), 3500);
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = filename;
    a.click();
  };

  // Webhook Handlers
  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim() || !whUrl.trim()) return;
    await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: whName.trim(),
        provider: whProvider,
        url: whUrl.trim(),
        events: ["form.submitted", "order.completed"],
      }),
    });
    setWhName("");
    setWhUrl("");
    loadData();
  };

  const handleTestWebhook = async (id: string) => {
    setTestingId(id);
    await fetch("/api/webhooks/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTestingId(null);
    loadData();
  };

  const handleDeleteWebhook = async (id: string) => {
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    loadData();
  };

  // Client Comment & Approval Handlers
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmtText.trim()) return;
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: cmtAuthor.trim() || "Client Stakeholder",
        role: "Reviewer",
        sectionName: cmtSection,
        text: cmtText.trim(),
      }),
    });
    setCmtText("");
    loadData();
  };

  const handleToggleCommentStatus = async (id: string) => {
    await fetch(`/api/comments/${id}`, { method: "PATCH" });
    loadData();
  };

  const handleSetApproval = async (status: "approved" | "changes_requested") => {
    await fetch("/api/comments/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        approvedBy: approverName.trim() || "Verified Client",
        notes:
          status === "approved"
            ? "Design approved and signed off for live launch."
            : "Requested revisions based on pinned section comments.",
      }),
    });
    loadData();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#18181b] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-stone-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-[#1c1917]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                PWA App Generator, Webhooks & Client Approval Hub
              </h2>
              <p className="text-[11px] text-stone-400">
                1-Click Installable PWA files, Zapier/Slack/Discord webhooks, and client review sign-off
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-stone-800 flex gap-2 bg-[#141417]">
          {[
            { id: "pwa", label: "📱 1-Click Installable PWA Generator" },
            { id: "webhooks", label: "🔗 Webhook & API Connector (Zapier / Slack)" },
            { id: "comments", label: "💬 Client Commenting & Design Approval" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
                tab === t.id
                  ? "border-orange-500 text-orange-400 bg-orange-500/5"
                  : "border-transparent text-stone-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {tab === "pwa" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 p-4 rounded-2xl bg-stone-900 border border-stone-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">
                    PWA App Configuration
                  </h3>
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">Full Application Name</label>
                    <input
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">
                      Home Screen Short Name (Max 12 chars)
                    </label>
                    <input
                      maxLength={12}
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Theme Color</label>
                      <input
                        type="color"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="w-full h-9 rounded cursor-pointer bg-black/50 border border-stone-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Splash BG</label>
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-full h-9 rounded cursor-pointer bg-black/50 border border-stone-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">Display</label>
                      <select
                        value={displayMode}
                        onChange={(e) => setDisplayMode(e.target.value as any)}
                        className="w-full h-9 px-2 rounded-lg bg-black/50 border border-stone-700 text-xs text-white"
                      >
                        <option value="standalone">Standalone App</option>
                        <option value="fullscreen">Fullscreen</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleInjectPwaIntoProject}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <FolderPlus size={14} />
                      <span>Inject into Project & ZIP Files</span>
                    </button>
                  </div>

                  {pwaInjected && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      <span>Added manifest.json & service-worker.js to ZIP Explorer!</span>
                    </div>
                  )}
                </div>

                {/* Live Generated Code Preview */}
                <div className="space-y-3 p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-300 font-mono">manifest.json + service-worker.js</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => downloadFile("manifest.json", manifestJson, "application/json")}
                          className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[11px] text-orange-400 font-semibold flex items-center gap-1"
                        >
                          <Download size={11} /> manifest.json
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadFile("service-worker.js", serviceWorkerJs, "application/javascript")}
                          className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[11px] text-emerald-400 font-semibold flex items-center gap-1"
                        >
                          <Download size={11} /> service-worker.js
                        </button>
                      </div>
                    </div>
                    <pre className="p-3 rounded-xl bg-black/70 border border-stone-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56">
                      {manifestJson}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "webhooks" && (
            <div className="space-y-5">
              <form
                onSubmit={handleAddWebhook}
                className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Connect External Automation Webhook (Triggers on Form Submit & Store Order)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                  <input
                    required
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    placeholder="Integration Name (e.g. Discord Leads)"
                    className="px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                  />
                  <select
                    value={whProvider}
                    onChange={(e) => setWhProvider(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                  >
                    <option value="Zapier">Zapier Webhook</option>
                    <option value="Make">Make.com Scenario</option>
                    <option value="Slack">Slack Incoming Webhook</option>
                    <option value="Discord">Discord Channel Webhook</option>
                    <option value="Custom REST">Custom REST API</option>
                  </select>
                  <input
                    required
                    value={whUrl}
                    onChange={(e) => setWhUrl(e.target.value)}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    className="px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Connect Webhook</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Active Webhook Endpoints ({webhooks.length})
                </h4>
                {webhooks.map((wh) => (
                  <div
                    key={wh.id}
                    className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 text-[10px] font-bold">
                          {wh.provider}
                        </span>
                        <span className="text-xs font-bold text-white">{wh.name}</span>
                      </div>
                      <div className="text-[11px] font-mono text-stone-400 truncate max-w-md">{wh.url}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestWebhook(wh.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Play size={12} />
                        <span>{testingId === wh.id ? "Sending..." : "Send Test Ping"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteWebhook(wh.id)}
                        className="p-1.5 text-stone-500 hover:text-red-400 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Logs */}
              <div className="p-4 rounded-2xl bg-black/40 border border-stone-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Recent Webhook Delivery Logs
                </h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {logs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between text-xs py-1 border-b border-stone-800/60">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                          HTTP {l.status}
                        </span>
                        <span className="font-semibold text-stone-200">{l.webhookName}</span>
                        <span className="text-stone-500 font-mono">({l.event})</span>
                      </div>
                      <span className="text-[11px] text-stone-500">
                        {new Date(l.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "comments" && (
            <div className="space-y-5">
              {/* Design Approval Sign-off Banner */}
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Client Design Approval Status:
                    </span>
                    {approval.status === "approved" ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                        <ShieldCheck size={13} /> Approved by {approval.approvedBy}
                      </span>
                    ) : approval.status === "changes_requested" ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1">
                        <AlertCircle size={13} /> Revisions Requested
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 text-xs font-bold">
                        Pending Client Sign-Off
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400">
                    Clients can pin comments to specific sections and officially approve the website design.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    placeholder="Client Name..."
                    className="px-3 py-1.5 rounded-xl bg-black/50 border border-stone-700 text-xs text-white w-36"
                  />
                  <button
                    type="button"
                    onClick={() => handleSetApproval("approved")}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>Approve Design ✅</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetApproval("changes_requested")}
                    className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
                  >
                    Request Changes
                  </button>
                </div>
              </div>

              {/* Add Pinned Feedback Comment */}
              <form
                onSubmit={handleAddComment}
                className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <input
                    value={cmtAuthor}
                    onChange={(e) => setCmtAuthor(e.target.value)}
                    placeholder="Your Name (e.g. Riya - Client)"
                    className="px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                  />
                  <select
                    value={cmtSection}
                    onChange={(e) => setCmtSection(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                  >
                    <option value="Hero Section">📌 Pin to: Hero Section</option>
                    <option value="Features Grid">📌 Pin to: Features Grid</option>
                    <option value="Pricing / Store">📌 Pin to: Pricing / Store</option>
                    <option value="Contact & Footer">📌 Pin to: Contact & Footer</option>
                  </select>
                  <div className="flex gap-2">
                    <input
                      required
                      value={cmtText}
                      onChange={(e) => setCmtText(e.target.value)}
                      placeholder="Write feedback note..."
                      className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                    >
                      <Send size={13} /> Pin
                    </button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-2.5">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
                      c.status === "resolved"
                        ? "bg-stone-900/40 border-stone-800/60 opacity-70"
                        : "bg-stone-900 border-stone-800"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 text-[10px] font-bold">
                          📌 {c.sectionName}
                        </span>
                        <span className="text-xs font-bold text-white">{c.author}</span>
                        <span className="text-[11px] text-stone-500">
                          • {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-stone-200 leading-relaxed">{c.text}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCommentStatus(c.id)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
                        c.status === "resolved"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-stone-800 hover:bg-stone-700 text-stone-300"
                      }`}
                    >
                      {c.status === "resolved" ? "✓ Resolved" : "Mark Resolved"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
