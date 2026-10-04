import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  X,
  Loader2,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { type BNode, createNode } from "./types";

interface BlogCmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertBlogSection: (node: BNode) => void;
}

export function BlogCmsModal({
  isOpen,
  onClose,
  onInsertBlogSection,
}: BlogCmsModalProps) {
  const [activeCollection, setActiveCollection] = useState<"blog" | "portfolio" | "team">("blog");
  const [items, setItems] = useState<any[]>([]);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("Professional & High-Converting");
  const [generating, setGenerating] = useState(false);

  // Manual Entry State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newExcerpt, setNewExcerpt] = useState("");
  const [newCover, setNewCover] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const loadItems = async () => {
    try {
      const res = await fetch("/api/cms/items");
      const data = await res.json();
      if (Array.isArray(data.items)) setItems(data.items);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) loadItems();
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = items.filter((i) => i.collection === activeCollection);

  const handleGenerateAiBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          category: "AI & Growth",
          tone: aiTone,
        }),
      });
      const data = await res.json();
      if (data.item) {
        setAiTopic("");
        setActiveCollection("blog");
        await loadItems();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await fetch("/api/cms/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collection: activeCollection,
        title: newTitle.trim(),
        category: newCategory.trim() || activeCollection.toUpperCase(),
        excerpt: newExcerpt.trim() || "Dynamic CMS entry created in Canvas Studio.",
        content: newExcerpt.trim(),
        coverImage: newCover.trim() || undefined,
      }),
    });
    setNewTitle("");
    setNewCategory("");
    setNewExcerpt("");
    setNewCover("");
    setShowAddForm(false);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/cms/items/${id}`, { method: "DELETE" });
    loadItems();
  };

  const insertCollectionToCanvas = () => {
    const node = createNode("blog");
    node.cmsCollection = activeCollection;
    node.text =
      activeCollection === "portfolio"
        ? "Featured Portfolio & Case Studies"
        : activeCollection === "team"
        ? "Meet Our World-Class Team"
        : "Latest Blog Articles & Insights";
    onInsertBlogSection(node);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#18181b] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-stone-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-[#1c1917]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Dynamic Blog, CMS Collections & Gemini AI Blog Writer
              </h2>
              <p className="text-[11px] text-stone-400">
                Manage Blog Posts, Portfolio Projects & Team Members, or write full SEO articles with AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={insertCollectionToCanvas}
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white flex items-center gap-1.5 shadow"
            >
              <Layers size={13} />
              <span>Insert {activeCollection.toUpperCase()} Grid on Canvas</span>
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

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* AI Blog Writer Box */}
          <form
            onSubmit={handleGenerateAiBlog}
            className="p-5 rounded-2xl bg-gradient-to-r from-orange-950/40 via-stone-900 to-stone-900 border border-orange-500/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <Sparkles size={14} />
                <span>1-Prompt Gemini AI SEO Blog Writer</span>
              </div>
              <span className="text-[11px] text-stone-400">
                Auto-generates Headline, Tags, Cover Photo & Full Article
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-2.5">
              <input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Enter blog topic in English or Hindi (e.g., Top 5 AI Trends for E-Commerce in 2026)..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/50 border border-stone-700 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-orange-500"
              />
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-black/50 border border-stone-700 text-xs text-stone-200"
              >
                <option value="Professional & High-Converting">Professional Tone</option>
                <option value="Hindi / Hinglish Friendly">Hindi / Hinglish</option>
                <option value="Technical Deep-Dive">Technical Guide</option>
              </select>
              <button
                type="submit"
                disabled={generating || !aiTopic.trim()}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shrink-0"
              >
                {generating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Writing Article...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Write & Publish with AI</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Collection Switcher + Add Item Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {[
                { id: "blog", label: "📝 Blog Articles" },
                { id: "portfolio", label: "🚀 Portfolio Projects" },
                { id: "team", label: "👥 Team Members" },
              ].map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setActiveCollection(col.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeCollection === col.id
                      ? "bg-orange-600 text-white"
                      : "bg-stone-900 text-stone-400 hover:text-white border border-stone-800"
                  }`}
                >
                  {col.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 flex items-center gap-1.5 border border-stone-700"
            >
              <Plus size={14} />
              <span>Add New {activeCollection} Item</span>
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleCreateManual}
              className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Title / Name"
                  className="px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                />
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category / Role"
                  className="px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                />
                <input
                  value={newCover}
                  onChange={(e) => setNewCover(e.target.value)}
                  placeholder="Cover Image URL (optional)"
                  className="px-3 py-2 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
                />
              </div>
              <textarea
                rows={2}
                value={newExcerpt}
                onChange={(e) => setNewExcerpt(e.target.value)}
                placeholder="Summary / Article Content..."
                className="w-full p-3 rounded-xl bg-black/50 border border-stone-700 text-xs text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 text-xs text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white"
                >
                  Save to CMS Database
                </button>
              </div>
            </form>
          )}

          {/* Collection Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex gap-4 items-start justify-between"
              >
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-20 h-20 rounded-xl object-cover shrink-0 bg-stone-800"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-orange-400">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-stone-500">• {item.publishedAt}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                  <p className="text-xs text-stone-400 line-clamp-2">{item.excerpt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-stone-500 hover:text-red-400 rounded-lg"
                  title="Delete CMS item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
