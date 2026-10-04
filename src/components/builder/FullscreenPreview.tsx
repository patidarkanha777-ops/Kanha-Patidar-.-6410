import React, { useState } from "react";
import { X, CheckCircle, ExternalLink, Monitor, Tablet, Smartphone } from "lucide-react";
import type { BNode } from "./types";
import { RenderNode } from "./Canvas";

interface FullscreenPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  page: BNode;
  pageName: string;
  liveHtml?: string | null;
}

export function FullscreenPreview({
  isOpen,
  onClose,
  page,
  pageName,
  liveHtml,
}: FullscreenPreviewProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const widths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "390px",
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Rahul Sharma",
          email: "rahul@example.com",
          message: "Hi, I am reaching out through the website contact form!",
          page: pageName,
        }),
      });
    } catch (e) {
      console.error(e);
    }
    setToastMessage("🎉 Form submitted! Saved in Backend Database & Viewable in Inbox.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0f17] flex flex-col animate-in fade-in duration-200">
      {/* Top Floating Preview Bar */}
      <div className="h-14 bg-[#18181b]/90 backdrop-blur-md border-b border-stone-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-stone-100">Live Website Preview:</span>
          <span className="text-xs text-orange-400 font-medium px-2 py-0.5 rounded bg-orange-500/10">
            {pageName}
          </span>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              device === "desktop" ? "bg-stone-800 text-white" : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Monitor size={14} />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("tablet")}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              device === "tablet" ? "bg-stone-800 text-white" : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Tablet size={14} />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              device === "mobile" ? "bg-stone-800 text-white" : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Smartphone size={14} />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
        >
          <X size={15} />
          <span>Exit Preview</span>
        </button>
      </div>

      {/* Main Preview Stage */}
      <div className="flex-1 overflow-y-auto flex justify-center bg-[#090b10] p-0">
        <div
          className="transition-all duration-300 min-h-full bg-white shadow-2xl overflow-x-hidden flex flex-col"
          style={{ width: widths[device] }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            // Intercept submit clicks for demo feedback
            if (target.tagName === "A" && target.innerText.toLowerCase().includes("send")) {
              e.preventDefault();
              handleTestSubmit(e);
            }
          }}
        >
          {liveHtml ? (
            <iframe
              srcDoc={liveHtml}
              title="Live Website Fullscreen Preview"
              className="w-full flex-1 min-h-[90vh] border-0"
              sandbox="allow-forms"
            />
          ) : (
            <RenderNode
              node={page}
              selected={null}
              editing={false}
              textEditId={null}
              onSelect={() => {}}
              onSelectParent={() => {}}
              onEditText={() => {}}
              onText={() => {}}
              onMove={() => {}}
              onDuplicate={() => {}}
              onDelete={() => {}}
              onInsert={() => {}}
            />
          )}
        </div>
      </div>

      {/* Submission Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1c1917] border border-emerald-500 text-emerald-200 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs font-semibold">
          <CheckCircle size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
