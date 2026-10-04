import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Flame,
  SplitSquareVertical,
  X,
  TrendingUp,
  MousePointerClick,
  Users,
  ShoppingBag,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { type BNode, mapTree } from "./types";

interface AnalyticsHeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageRoot: BNode;
  onCommitPage: (nextRoot: BNode) => void;
}

export function AnalyticsHeatmapModal({
  isOpen,
  onClose,
  pageRoot,
  onCommitPage,
}: AnalyticsHeatmapModalProps) {
  const [tab, setTab] = useState<"overview" | "heatmap" | "abtest">("overview");
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/summary");
      const data = await res.json();
      if (data.analytics) setAnalytics(data.analytics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAnalytics();
  }, [isOpen]);

  if (!isOpen) return null;

  const switchGlobalVariant = async (variant: "A" | "B") => {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "switch_variant", variant }),
    });
    // Also apply Variant A or B across all buttons/headings on the current canvas
    const updated = mapTree(pageRoot, (n) => {
      if (n.type === "button" || n.type === "heading") {
        return {
          ...n,
          abActiveVariant: variant,
          abVariantBText:
            n.abVariantBText ||
            (n.type === "button" ? `${n.text || "Start Now"} — Free Trial →` : n.text),
          abVariantBBg: n.abVariantBBg || (n.type === "button" ? "#10b981" : undefined),
        };
      }
      return n;
    });
    onCommitPage(updated);
    fetchAnalytics();
  };

  const simulateLiveTraffic = async () => {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "click",
        elementId: "b1",
        label: "Hero Primary CTA",
        x: Math.floor(30 + Math.random() * 40),
        y: Math.floor(20 + Math.random() * 60),
      }),
    });
    fetchAnalytics();
  };

  const data = analytics || {
    visitors: 2840,
    pageviews: 6490,
    buttonClicks: 912,
    formSubmissions: 148,
    orders: 64,
    activeVariant: "A",
    topElements: [],
    dailyTraffic: [],
    heatmapPoints: [],
    variantStats: {
      A: { name: "Variant A (Original Orange CTA)", impressions: 1450, clicks: 468, conversions: 112 },
      B: { name: "Variant B (High-Contrast Emerald CTA)", impressions: 1390, clicks: 544, conversions: 146 },
    },
  };

  const convRate = ((data.formSubmissions + data.orders) / Math.max(1, data.visitors) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#18181b] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-stone-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-[#1c1917]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <BarChart3 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Live Analytics, Click Heatmap & A/B Conversion Lab
              </h2>
              <p className="text-[11px] text-stone-400">
                Real-time visitor funnel, button click heatmap, and Variant A vs Variant B conversion splits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={simulateLiveTraffic}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-[11px] font-semibold text-orange-400 border border-stone-700 flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              <span>Simulate Live Click Event</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-stone-800 flex gap-2 bg-[#141417]">
          {[
            { id: "overview", label: "📊 Visitor & Conversion Funnel", icon: BarChart3 },
            { id: "heatmap", label: "🔥 Visual Click Heatmap", icon: Flame },
            { id: "abtest", label: "⚡ A/B Testing (Variant A vs B)", icon: SplitSquareVertical },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                tab === t.id
                  ? "border-orange-500 text-orange-400 bg-orange-500/5"
                  : "border-transparent text-stone-400 hover:text-white"
              }`}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {tab === "overview" && (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                    <span>Unique Visitors</span>
                    <Users size={14} className="text-sky-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">{data.visitors.toLocaleString()}</div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <ArrowUpRight size={12} /> +18.4% this week
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                    <span>Total Button Clicks</span>
                    <MousePointerClick size={14} className="text-orange-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">{data.buttonClicks.toLocaleString()}</div>
                  <div className="text-[11px] text-stone-400 mt-1">
                    {((data.buttonClicks / Math.max(1, data.visitors)) * 100).toFixed(1)}% Click-Through
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                    <span>Form Leads & Orders</span>
                    <ShoppingBag size={14} className="text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">
                    {data.formSubmissions + data.orders}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">
                    {data.formSubmissions} Leads • {data.orders} Orders
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800">
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                    <span>Conversion Rate</span>
                    <TrendingUp size={14} className="text-amber-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-400">{convRate}%</div>
                  <div className="text-[11px] text-stone-400 mt-1">Top 5% Industry Benchmark</div>
                </div>
              </div>

              {/* Daily Traffic Bar Chart & Conversion Funnel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                      7-Day Visitor & Conversion Trend
                    </h3>
                    <span className="text-[11px] text-orange-400 font-mono">Live Telemetry</span>
                  </div>
                  <div className="flex items-end justify-between gap-2 h-40 pt-4 px-2">
                    {(data.dailyTraffic || []).map((d: any) => {
                      const hPct = Math.min(100, Math.round((d.visitors / 550) * 100));
                      return (
                        <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-[10px] font-mono text-stone-400">{d.visitors}</span>
                          <div className="w-full bg-stone-800 rounded-t-lg h-28 flex items-end overflow-hidden">
                            <div
                              className="w-full bg-gradient-to-t from-orange-600 to-amber-400 rounded-t-lg transition-all"
                              style={{ height: `${hPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-stone-400">{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Conversion Funnel */}
                <div className="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                    Conversion Funnel Breakdown
                  </h3>
                  {[
                    { step: "1. Total Website Visitors", count: data.visitors, pct: 100, color: "#38bdf8" },
                    { step: "2. Scrolled & Engaged Sections", count: Math.round(data.visitors * 0.68), pct: 68, color: "#a855f7" },
                    { step: "3. Clicked CTA Button / Product", count: data.buttonClicks, pct: 32, color: "#f97316" },
                    { step: "4. Completed Form / Order", count: data.formSubmissions + data.orders, pct: 12, color: "#10b981" },
                  ].map((f) => (
                    <div key={f.step} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-stone-300 font-medium">{f.step}</span>
                        <span className="font-mono font-bold text-white">
                          {f.count.toLocaleString()} ({f.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-stone-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${f.pct}%`, backgroundColor: f.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Clicked Buttons Table */}
              <div className="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                  Most Clicked Buttons & Interactive Elements
                </h3>
                <div className="divide-y divide-stone-800">
                  {(data.topElements || []).map((el: any) => (
                    <div key={el.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono text-[10px]">
                          #{el.id}
                        </span>
                        <span className="font-semibold text-white">{el.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-stone-400 font-mono">{el.clicks} clicks</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[11px]">
                          {el.ctr} CTR
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "heatmap" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Live Visitor Click Heatmap Map</h3>
                  <p className="text-xs text-stone-400">
                    Glowing red/orange hotspots show where visitors click and tap most frequently on your page
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold">
                  {(data.heatmapPoints || []).length} Active Hotspots
                </span>
              </div>

              <div className="relative w-full h-96 rounded-2xl bg-gradient-to-b from-stone-900 via-stone-950 to-black border border-stone-800 overflow-hidden p-6 flex flex-col justify-between">
                {/* Simulated Wireframe Background */}
                <div className="text-center space-y-2 opacity-35 pointer-events-none pt-4">
                  <div className="w-2/3 h-7 bg-stone-700 rounded-lg mx-auto" />
                  <div className="w-1/2 h-4 bg-stone-800 rounded mx-auto" />
                  <div className="w-36 h-9 bg-orange-500/50 rounded-full mx-auto mt-3" />
                </div>
                <div className="grid grid-cols-3 gap-4 opacity-30 pointer-events-none my-auto">
                  <div className="h-24 bg-stone-800 rounded-xl" />
                  <div className="h-24 bg-stone-800 rounded-xl" />
                  <div className="h-24 bg-stone-800 rounded-xl" />
                </div>
                <div className="w-1/2 h-16 bg-stone-800/40 rounded-xl mx-auto opacity-30 pointer-events-none" />

                {/* Heatmap Hotspots */}
                {(data.heatmapPoints || []).map((pt: any, idx: number) => (
                  <div
                    key={idx}
                    style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  >
                    <div
                      className="w-20 h-20 rounded-full blur-xl opacity-75 animate-pulse"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(239,68,68,0.95) 0%, rgba(249,115,22,0.75) 50%, rgba(234,179,8,0) 100%)",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="px-2 py-0.5 rounded-full bg-black/85 border border-orange-500/50 text-[10px] font-bold text-white whitespace-nowrap shadow-lg">
                        🔥 {pt.label} ({pt.weight}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "abtest" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider">
                    Live A/B Split Testing Engine
                  </h4>
                  <p className="text-xs text-stone-300 mt-0.5">
                    Compare two design variants on your canvas and 1-click activate the winning design.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-black/50 text-xs font-mono text-white">
                  Active on Canvas: <strong className="text-orange-400">Variant {data.activeVariant}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(["A", "B"] as const).map((v) => {
                  const st = data.variantStats[v];
                  const rate = ((st.conversions / Math.max(1, st.impressions)) * 100).toFixed(2);
                  const isWinner = v === "B";
                  const isActive = data.activeVariant === v;

                  return (
                    <div
                      key={v}
                      className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                        isActive
                          ? "bg-stone-900 border-orange-500/60 shadow-xl"
                          : "bg-stone-900/50 border-stone-800"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-md bg-white/10 text-xs font-extrabold text-white">
                            VARIANT {v}
                          </span>
                          {isWinner && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 size={12} /> +30.4% Higher Conversion Winner
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-white">{st.name}</h4>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-800 text-center">
                        <div className="p-2.5 rounded-xl bg-black/40">
                          <div className="text-[10px] text-stone-400">Impressions</div>
                          <div className="text-sm font-bold text-white mt-0.5">{st.impressions}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40">
                          <div className="text-[10px] text-stone-400">Button Clicks</div>
                          <div className="text-sm font-bold text-orange-400 mt-0.5">{st.clicks}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40">
                          <div className="text-[10px] text-stone-400">Conv. Rate</div>
                          <div className="text-sm font-bold text-emerald-400 mt-0.5">{rate}%</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => switchGlobalVariant(v)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                          isActive
                            ? "bg-orange-600 text-white"
                            : "bg-stone-800 hover:bg-stone-700 text-stone-200"
                        }`}
                      >
                        {isActive
                          ? `✓ Variant ${v} Active on Canvas`
                          : `Switch Canvas to Variant ${v}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
