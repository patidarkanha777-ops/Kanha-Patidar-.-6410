import React, { useState, useEffect } from "react";
import {
  Kanban,
  Sparkles,
  Calendar,
  Layers,
  X,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  DollarSign,
  Clock,
  SplitSquareHorizontal,
} from "lucide-react";
import { type BNode, type NodeType, createNode } from "./types";

interface CrmKanbanPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertNode: (node: BNode) => void;
}

const STAGES: { id: "new" | "contacted" | "negotiation" | "won"; label: string; color: string }[] = [
  { id: "new", label: "📥 New Leads", color: "#38bdf8" },
  { id: "contacted", label: "📞 Contacted", color: "#a855f7" },
  { id: "negotiation", label: "🤝 Negotiation", color: "#f97316" },
  { id: "won", label: "🏆 Won / Closed", color: "#10b981" },
];

export function CrmKanbanPopupModal({
  isOpen,
  onClose,
  onInsertNode,
}: CrmKanbanPopupModalProps) {
  const [tab, setTab] = useState<"kanban" | "popup" | "blocks">("kanban");
  const [leads, setLeads] = useState<any[]>([]);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Quick Add Lead State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDeal, setNewDeal] = useState(1500);

  // Exit-Intent / Timed Popup Builder State
  const [popupTitle, setPopupTitle] = useState("Wait! Don’t Leave Empty-Handed 🎁");
  const [popupText, setPopupText] = useState(
    "Claim an instant 30% discount on any plan before you go. Use code EXIT30 at checkout!"
  );
  const [popupBtnText, setPopupBtnText] = useState("🎁 Unlock 30% Exit Offer");
  const [popupTrigger, setPopupTrigger] = useState<"exit" | "timed" | "click">("exit");
  const [popupDelay, setPopupDelay] = useState(5);

  const loadLeads = async () => {
    try {
      const res = await fetch("/api/forms/leads");
      const data = await res.json();
      if (Array.isArray(data.leads)) setLeads(data.leads);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) loadLeads();
  }, [isOpen]);

  if (!isOpen) return null;

  const moveStage = async (leadId: string, currentStage: string, dir: -1 | 1) => {
    const order = ["new", "contacted", "negotiation", "won"];
    const idx = order.indexOf(currentStage || "new");
    const nextIdx = Math.max(0, Math.min(order.length - 1, idx + dir));
    const nextStage = order[nextIdx];
    await fetch(`/api/forms/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: nextStage }),
    });
    loadLeads();
  };

  const dropToStage = async (leadId: string, targetStage: string) => {
    setDraggedLeadId(null);
    setDragOverStage(null);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: targetStage } : l))
    );
    await fetch(`/api/forms/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: targetStage }),
    });
    loadLeads();
  };

  const deleteLead = async (id: string) => {
    await fetch(`/api/forms/leads/${id}`, { method: "DELETE" });
    loadLeads();
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    await fetch("/api/forms/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        email: newEmail.trim(),
        message: "Added manually in CRM Kanban Board",
        page: "CRM Pipeline",
        dealValue: Number(newDeal) || 1000,
      }),
    });
    setNewName("");
    setNewEmail("");
    loadLeads();
  };

  const handleInsertCustomPopup = () => {
    const node = createNode("popup");
    node.text = popupBtnText;
    node.popupTitle = popupTitle;
    node.popupText = popupText;
    node.popupTrigger = popupTrigger;
    node.popupDelaySeconds = popupDelay;
    onInsertNode(node);
    onClose();
  };

  const handleQuickInsertBlock = (type: NodeType) => {
    const node = createNode(type);
    onInsertNode(node);
    onClose();
  };

  const totalPipeline = leads.reduce((acc, l) => acc + (l.dealValue || 950), 0);
  const wonRevenue = leads
    .filter((l) => l.stage === "won")
    .reduce((acc, l) => acc + (l.dealValue || 950), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-[#18181b] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-stone-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-[#1c1917]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Kanban size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Visual CRM Kanban Pipeline, Exit-Intent Popup & 3D Interactive Blocks
              </h2>
              <p className="text-[11px] text-stone-400">
                Manage website leads across stages, build Exit-Intent/Timed Popups, and add 3D Tilt & Before/After Sliders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-stone-900 border border-stone-800 text-xs">
              <DollarSign size={13} className="text-emerald-400" />
              <span className="text-stone-400">Pipeline:</span>
              <strong className="text-white">${totalPipeline.toLocaleString()}</strong>
              <span className="text-stone-600">|</span>
              <span className="text-emerald-400 font-bold">Won: ${wonRevenue.toLocaleString()}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-stone-800 flex gap-2 bg-[#141417]">
          {[
            { id: "kanban", label: "📊 Visual CRM Kanban Board (Leads Pipeline)" },
            { id: "popup", label: "🎁 Exit-Intent & Timed Offer Popup Builder" },
            { id: "blocks", label: "🎬 3D Tilt, Before/After Slider, Marquee & Calendar" },
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
          {tab === "kanban" && (
            <div className="space-y-5">
              {/* Quick Add Deal Bar */}
              <form
                onSubmit={handleAddLead}
                className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-wrap items-center gap-2.5"
              >
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Client / Lead Name..."
                  className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                />
                <input
                  required
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                />
                <input
                  type="number"
                  value={newDeal}
                  onChange={(e) => setNewDeal(Number(e.target.value))}
                  placeholder="Deal Value ($)"
                  className="w-28 px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add to Pipeline
                </button>
              </form>

              {/* 4-Column Kanban Board */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {STAGES.map((st) => {
                  const stageLeads = leads.filter((l) => (l.stage || "new") === st.id);
                  const isOver = dragOverStage === st.id;
                  return (
                    <div
                      key={st.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverStage(st.id);
                      }}
                      onDragLeave={() => setDragOverStage(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        const id = e.dataTransfer.getData("text/plain") || draggedLeadId;
                        if (id) dropToStage(id, st.id);
                      }}
                      className={`p-3.5 rounded-2xl bg-stone-900/90 border flex flex-col gap-3 min-h-[320px] transition ${
                        isOver ? "border-orange-500 bg-orange-500/5" : "border-stone-800"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                        <span className="text-xs font-extrabold text-white">{st.label}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: `${st.color}33`, color: st.color }}
                        >
                          {stageLeads.length}
                        </span>
                      </div>

                      <div className="space-y-2.5 flex-1">
                        {stageLeads.map((lead) => (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => {
                              setDraggedLeadId(lead.id);
                              e.dataTransfer.setData("text/plain", lead.id);
                            }}
                            onDragEnd={() => {
                              setDraggedLeadId(null);
                              setDragOverStage(null);
                            }}
                            className="p-3 rounded-xl bg-black/50 border border-stone-800 space-y-2 hover:border-orange-500/50 transition cursor-grab active:cursor-grabbing"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-xs font-bold text-white">{lead.name}</div>
                                <div className="text-[10px] text-stone-400">{lead.email}</div>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[10px] font-bold">
                                ${lead.dealValue || 950}
                              </span>
                            </div>

                            <p className="text-[11px] text-stone-300 line-clamp-2 leading-relaxed">
                              {lead.message}
                            </p>

                            <div className="flex items-center justify-between pt-1.5 border-t border-stone-800/80">
                              <span className="text-[9px] uppercase font-mono text-orange-400">
                                {lead.page}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveStage(lead.id, lead.stage || "new", -1)}
                                  disabled={(lead.stage || "new") === "new"}
                                  className="p-1 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                                  title="Move Left"
                                >
                                  <ArrowLeft size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveStage(lead.id, lead.stage || "new", 1)}
                                  disabled={lead.stage === "won"}
                                  className="p-1 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300"
                                  title="Move Right"
                                >
                                  <ArrowRight size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteLead(lead.id)}
                                  className="p-1 rounded text-stone-500 hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "popup" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Exit-Intent & Timed Offer Popup Configurator
                </h3>
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Popup Trigger Behavior</label>
                  <select
                    value={popupTrigger}
                    onChange={(e) => setPopupTrigger(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                  >
                    <option value="exit">🚪 Exit-Intent (Opens when visitor moves cursor to close tab)</option>
                    <option value="timed">⏱️ Timed Delay (Auto-opens after N seconds on page)</option>
                    <option value="click">👆 Button Click Only</option>
                  </select>
                </div>

                {popupTrigger === "timed" && (
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">
                      Auto-Open Delay (Seconds)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={popupDelay}
                      onChange={(e) => setPopupDelay(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Popup Headline</label>
                  <input
                    value={popupTitle}
                    onChange={(e) => setPopupTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Offer Description</label>
                  <textarea
                    rows={3}
                    value={popupText}
                    onChange={(e) => setPopupText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleInsertCustomPopup}
                  className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <Sparkles size={14} />
                  <span>Insert {popupTrigger.toUpperCase()} Popup Block on Canvas</span>
                </button>
              </div>

              {/* Live Popup Preview */}
              <div className="p-6 rounded-2xl bg-black/60 border border-stone-800 flex items-center justify-center">
                <div className="w-full max-w-sm bg-[#1c1917] border border-orange-500/40 rounded-2xl p-6 text-center space-y-3 shadow-2xl">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase">
                    {popupTrigger === "exit"
                      ? "Exit-Intent Trigger Active"
                      : popupTrigger === "timed"
                      ? `Opens After ${popupDelay} Seconds`
                      : "Click Trigger"}
                  </span>
                  <h4 className="text-lg font-extrabold text-white">{popupTitle}</h4>
                  <p className="text-xs text-stone-300 leading-relaxed">{popupText}</p>
                  <div className="p-2 rounded-lg bg-black/50 border border-orange-500/30 font-mono text-xs font-bold text-orange-400">
                    PROMO CODE: CANVAS30
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "blocks" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  type: "beforeAfter" as NodeType,
                  title: "Interactive Before / After Image Comparison Slider",
                  desc: "Draggable split-screen comparison slider for agencies, studios, salons, and fitness transformations.",
                  icon: SplitSquareHorizontal,
                  badge: "DRAG SLIDER",
                },
                {
                  type: "marquee" as NodeType,
                  title: "Infinite Logo & Testimonial Marquee Ticker",
                  desc: "Continuous scrolling brand logos, client social proof, or special announcement ticker strip.",
                  icon: Layers,
                  badge: "TICKER",
                },
                {
                  type: "tiltCard" as NodeType,
                  title: "3D Perspective Tilt & Cursor Spotlight Card",
                  desc: "Holographic 3D card that rotates with mouse movement and projects a radial spotlight glow.",
                  icon: Sparkles,
                  badge: "3D SPATIAL",
                },
                {
                  type: "bookingCalendar" as NodeType,
                  title: "Multi-Step Appointment Calendar & Time-Slot Picker",
                  desc: "Interactive date & time-slot chips (10:00 AM, 02:30 PM, 05:00 PM) connected directly to CRM.",
                  icon: Calendar,
                  badge: "CALENDAR",
                },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.type}
                    className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between gap-4 hover:border-orange-500/50 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                          <Icon size={18} />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-[10px] font-mono text-orange-400 font-bold">
                          {b.badge}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{b.title}</h4>
                      <p className="text-xs text-stone-400 leading-relaxed">{b.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickInsertBlock(b.type)}
                      className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Insert on Canvas</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
