import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Bot,
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  Plus,
  Volume2,
  VolumeX,
  Send,
  Trash2,
  Copy,
  Check,
  Headphones,
  Zap,
  Brain,
  Code,
  Layout,
  FileText,
  User,
  Radio,
  Sliders,
  TrendingUp,
  Palette,
  MessageSquare,
} from "lucide-react";
import { type BNode, createNode, mapTree, toHTML } from "./types";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  model?: string;
  roleName?: string;
}

interface AiVoiceBrandChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageRoot: BNode;
  onCommitPage: (nextRoot: BNode) => void;
  onInsertNode: (node: BNode) => void;
  onApplyFont: (font: string) => void;
  onApplyPrimaryColor: (color: string) => void;
  initialTab?: "chat" | "live" | "brandkit";
}

export function AiVoiceBrandChatModal({
  isOpen,
  onClose,
  pageRoot,
  onCommitPage,
  onInsertNode,
  onApplyFont,
  onApplyPrimaryColor,
  initialTab = "chat",
}: AiVoiceBrandChatModalProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "live" | "brandkit">(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // ==========================================
  // 1. GEMINI MULTI-TURN CHATBOT STATE
  // ==========================================
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_welcome",
      role: "model",
      text: "👋 Welcome to Canvas AI Copilot! I'm your Gemini-powered assistant. Ask me to critique your website layout, write high-converting copy, generate custom CSS/HTML, or suggest color palettes.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      model: "gemini-3.5-flash",
      roleName: "Website Architect",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"gemini-3.5-flash" | "gemini-3.1-flash-lite" | "gemini-3.1-pro-preview">("gemini-3.5-flash");
  const [selectedRole, setSelectedRole] = useState<"architect" | "copywriter" | "engineer" | "growth">("architect");
  const [attachPageContext, setAttachPageContext] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roles = {
    architect: {
      name: "Website Architect",
      icon: <Layout size={14} className="text-orange-400" />,
      tagline: "Layout, UI/UX structure & visual visual hierarchy",
      instruction:
        "You are an elite website architect and UI/UX designer on Canvas Website Builder. Analyze visual layouts, section flow, visual balance, component hierarchy, whitespace, and user journeys. Give structured, actionable design feedback.",
    },
    copywriter: {
      name: "Creative Copywriter",
      icon: <FileText size={14} className="text-pink-400" />,
      tagline: "High-converting headlines & brand storytelling",
      instruction:
        "You are an award-winning digital copywriter. Craft high-converting headlines, value propositions, benefit bullets, and compelling calls-to-action that capture attention and drive sales. Support both English and Hindi copy.",
    },
    engineer: {
      name: "Frontend Code Engineer",
      icon: <Code size={14} className="text-sky-400" />,
      tagline: "CSS styling, Tailwind classes & React components",
      instruction:
        "You are a senior full-stack software engineer. Write clean React, HTML, modern Tailwind CSS, and TypeScript code snippets. Help users debug layout bugs, responsive media queries, and design system tokens.",
    },
    growth: {
      name: "SEO & CRO Strategist",
      icon: <TrendingUp size={14} className="text-emerald-400" />,
      tagline: "Conversion rate optimization & search visibility",
      instruction:
        "You are a conversion rate optimization (CRO) and SEO growth strategist. Recommend high-CTR placements, meta titles, social proof positioning, and speed optimizations that convert visitors into customers.",
    },
  };

  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      // Build conversation payload for Gemini
      const payloadMessages = newHistory.map((m) => {
        let content = m.text;
        // Attach current page context to the latest message if enabled
        if (m.id === userMsg.id && attachPageContext) {
          const simplifiedHtml = toHTML(pageRoot).slice(0, 3000);
          content = `${content}\n\n[Website Page Context: Total nodes in page tree: ${simplifiedHtml.length} chars of HTML. Context:\n${simplifiedHtml}]`;
        }
        return {
          role: m.role === "user" ? "user" : "model",
          text: content,
        };
      });

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          model: selectedModel,
          systemInstruction: roles[selectedRole].instruction,
          role: roles[selectedRole].name,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            role: "model",
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            model: data.model || selectedModel,
            roleName: roles[selectedRole].name,
          },
        ]);
      } else {
        throw new Error(data.error || "No reply from Gemini.");
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          role: "model",
          text: `⚠️ Error: ${err?.message || "Failed to connect to Gemini API. Please try again."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          model: selectedModel,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ==========================================
  // 2. REAL-TIME LIVE API VOICE CONVERSATION STATE
  // ==========================================
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveSpeaking, setLiveSpeaking] = useState(false);
  const [liveMuted, setLiveMuted] = useState(false);
  const [liveStatus, setLiveStatus] = useState("Tap 'Start Voice Conversation' to speak with gemini-3.8-live in real time.");
  const [liveTranscript, setLiveTranscript] = useState<Array<{ sender: "user" | "gemini"; text: string }>>([
    { sender: "gemini", text: "Hello! I am Canvas Live Voice Copilot powered by gemini-3.8-live. Speak to me anytime!" },
  ]);
  const [selectedVoice, setSelectedVoice] = useState("Zephyr");

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  // Helpers for PCM audio
  const floatTo16BitPCM = (input: Float32Array): ArrayBuffer => {
    const output = new DataView(new ArrayBuffer(input.length * 2));
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return output.buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const playPcmChunk = (base64Audio: string) => {
    try {
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }
      const ctx = outputAudioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      const startTime = Math.max(now, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + audioBuffer.duration;

      activeSourcesRef.current.push(source);
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      };
      setLiveSpeaking(true);
      setTimeout(() => {
        if (activeSourcesRef.current.length === 0) setLiveSpeaking(false);
      }, audioBuffer.duration * 1000);
    } catch (err) {
      console.error("PCM playback error:", err);
    }
  };

  const stopAllPlayback = () => {
    for (const s of activeSourcesRef.current) {
      try {
        s.stop();
      } catch {}
    }
    activeSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
    setLiveSpeaking(false);
  };

  const startLiveConversation = async () => {
    try {
      setLiveStatus("Connecting to Gemini Live API (gemini-3.8-live)...");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/live-voice`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setLiveConnected(true);
        setLiveStatus("Connected to gemini-3.8-live! Start speaking into your mic.");

        // Start microphone capture at 16kHz
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
          });
          mediaStreamRef.current = stream;

          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000,
          });
          audioContextRef.current = audioCtx;

          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(2048, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN || liveMuted) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBuffer = floatTo16BitPCM(inputData);
            const base64Audio = arrayBufferToBase64(pcmBuffer);
            ws.send(JSON.stringify({ audio: base64Audio }));
          };

          source.connect(processor);
          processor.connect(audioCtx.destination);
        } catch (micErr) {
          console.error("Mic access error:", micErr);
          setLiveStatus("Microphone access denied or unavailable. Please enable mic permissions.");
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.interrupted) {
            stopAllPlayback();
          }
          if (data.audio) {
            playPcmChunk(data.audio);
          }
          if (data.text) {
            setLiveTranscript((prev) => [...prev, { sender: "gemini", text: data.text }]);
          }
        } catch (e) {
          console.error("WS parse error:", e);
        }
      };

      ws.onclose = () => {
        setLiveConnected(false);
        setLiveStatus("Voice session disconnected.");
        stopLiveConversation();
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setLiveStatus("Connection error. Ensure dev server is active.");
      };
    } catch (err: any) {
      console.error(err);
      setLiveStatus(`Failed to connect: ${err?.message || "Unknown error"}`);
    }
  };

  const stopLiveConversation = () => {
    stopAllPlayback();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setLiveConnected(false);
    setLiveSpeaking(false);
    setLiveStatus("Voice session ended.");
  };

  // Clean up on unmount or modal close
  useEffect(() => {
    return () => {
      stopLiveConversation();
    };
  }, []);

  // ==========================================
  // 3. BRAND KIT & EMBEDDABLE BOT STATE
  // ==========================================
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("AI SaaS & Digital Agency");
  const [generatingKit, setGeneratingKit] = useState(false);
  const [brandKit, setBrandKit] = useState<any | null>(null);
  const [kitApplied, setKitApplied] = useState(false);

  // Embeddable customer widget
  const [botName, setBotName] = useState("Canvas AI Support");
  const [botWelcome, setBotWelcome] = useState("नमस्ते! 👋 मैं आपका AI असिस्टेंट हूँ। कुछ भी पूछें!");
  const [botContext, setBotContext] = useState("Starter plan $19/mo, Pro $49/mo, Enterprise $99/mo. 14-day free trial.");

  const handleGenerateBrandKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    setGeneratingKit(true);
    setKitApplied(false);
    try {
      const res = await fetch("/api/ai/brand-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: brandName.trim(), industry }),
      });
      const data = await res.json();
      if (data.brandKit) setBrandKit(data.brandKit);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingKit(false);
    }
  };

  const applyBrandKitToCanvas = () => {
    if (!brandKit) return;
    onApplyFont(brandKit.headingFont || "'Space Grotesk', sans-serif");
    onApplyPrimaryColor(brandKit.primaryColor || "#f97316");

    let h1Updated = false;
    let pUpdated = false;
    let btnUpdated = false;

    const updated = mapTree(pageRoot, (n) => {
      if (n.id === "root") {
        return {
          ...n,
          style: {
            ...n.style,
            background: brandKit.backgroundColor || "#09090b",
            color: brandKit.textColor || "#fafaf9",
            fontFamily: brandKit.bodyFont || "'Inter', sans-serif",
          },
        };
      }
      if (n.type === "heading" && n.level === 1 && !h1Updated) {
        h1Updated = true;
        return {
          ...n,
          text: brandKit.heroHeadline,
          style: { ...n.style, color: brandKit.textColor || "#ffffff" },
        };
      }
      if (n.type === "text" && !pUpdated) {
        pUpdated = true;
        return { ...n, text: brandKit.heroSubheadline };
      }
      if (n.type === "button" && !btnUpdated) {
        btnUpdated = true;
        return {
          ...n,
          text: brandKit.ctaText,
          style: { ...n.style, background: brandKit.primaryColor, backgroundColor: brandKit.primaryColor, color: "#ffffff" },
        };
      }
      return n;
    });

    onCommitPage(updated);
    setKitApplied(true);
  };

  const handleInsertAiChatbot = () => {
    const node = createNode("aiChatbot");
    node.botName = botName;
    node.botWelcome = botWelcome;
    node.botContext = botContext;
    onInsertNode(node);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121110] border border-[#3c3836] rounded-2xl w-full max-w-4xl h-[90vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2e2a28] flex items-center justify-between bg-[#191715]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 flex items-center justify-center text-white shadow-lg shadow-orange-950/40">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100 flex items-center gap-2">
                Gemini AI Studio & Voice Copilot
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  gemini-3.5-flash · gemini-3.8-live
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Multi-turn intelligent chatbot & real-time two-way voice conversations powered by Gemini.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-[#282523] bg-[#141311] flex items-center gap-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`pb-3 px-4 font-semibold text-xs flex items-center gap-2 border-b-2 transition ${
              activeTab === "chat"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <MessageSquare size={15} />
            Gemini Chatbot (Multi-Turn)
          </button>
          <button
            onClick={() => setActiveTab("live")}
            className={`pb-3 px-4 font-semibold text-xs flex items-center gap-2 border-b-2 transition relative ${
              activeTab === "live"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Radio size={15} className={liveConnected ? "text-emerald-400 animate-pulse" : ""} />
            Live Voice API (gemini-3.8-live)
            {liveConnected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute right-1 top-2" />}
          </button>
          <button
            onClick={() => setActiveTab("brandkit")}
            className={`pb-3 px-4 font-semibold text-xs flex items-center gap-2 border-b-2 transition ${
              activeTab === "brandkit"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Palette size={15} />
            Brand Kit & Support Widget
          </button>
        </div>

        {/* Tab 1: GEMINI MULTI-TURN CHATBOT */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0f0e0d]">
            {/* Top Toolbar: Model & Role Configuration */}
            <div className="px-6 py-2.5 border-b border-[#282523] bg-[#161513] flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Role Persona Selector */}
              <div className="flex items-center gap-2">
                <span className="text-stone-400 font-medium">Role:</span>
                <div className="flex items-center gap-1 bg-stone-900 border border-stone-700/80 rounded-lg p-0.5">
                  {(Object.keys(roles) as (keyof typeof roles)[]).map((rKey) => (
                    <button
                      key={rKey}
                      type="button"
                      onClick={() => setSelectedRole(rKey)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition ${
                        selectedRole === rKey
                          ? "bg-orange-600 text-white font-bold shadow-sm"
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                      title={roles[rKey].instruction}
                    >
                      {roles[rKey].icon}
                      <span>{roles[rKey].name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gemini Model Selector */}
              <div className="flex items-center gap-2">
                <span className="text-stone-400 font-medium">Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as any)}
                  className="bg-stone-900 border border-stone-700 text-stone-200 rounded-lg px-2.5 py-1 text-xs font-mono font-medium focus:border-orange-500 outline-none"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (General Tasks · Default)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Speed)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Tasks)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setAttachPageContext(!attachPageContext)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition flex items-center gap-1.5 ${
                    attachPageContext
                      ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-300"
                      : "bg-stone-900 border-stone-700 text-stone-400"
                  }`}
                  title="When active, attaches the current website HTML structure as context to prompts"
                >
                  <Zap size={12} className={attachPageContext ? "text-emerald-400" : "text-stone-500"} />
                  <span>Page Context {attachPageContext ? "ON" : "OFF"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMessages([messages[0]])}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-stone-800 transition"
                  title="Clear conversation history"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Scrollable Message Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                      msg.role === "user"
                        ? "bg-stone-700 text-white"
                        : "bg-gradient-to-tr from-orange-600 to-amber-500 text-white"
                    }`}
                  >
                    {msg.role === "user" ? <User size={15} /> : <Bot size={16} />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`group relative rounded-2xl p-4 text-xs leading-relaxed max-w-[85%] border shadow-sm ${
                      msg.role === "user"
                        ? "bg-orange-600 text-white border-orange-500 rounded-tr-sm"
                        : "bg-[#181614] text-stone-200 border-[#2f2b28] rounded-tl-sm"
                    }`}
                  >
                    {/* Header info for model response */}
                    {msg.role === "model" && (
                      <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-stone-800 text-[10px] text-stone-400">
                        <span className="font-semibold text-orange-400 flex items-center gap-1.5">
                          <Sparkles size={11} /> {msg.roleName || roles[selectedRole].name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-stone-500">{msg.model}</span>
                          <span>·</span>
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap font-sans text-stone-100">{msg.text}</div>

                    {/* Copy action */}
                    <button
                      type="button"
                      onClick={() => copyMessage(msg.id, msg.text)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-stone-800/80 hover:bg-stone-700 text-stone-300 transition"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-3 max-w-3xl mr-auto">
                  <div className="w-8 h-8 rounded-xl bg-orange-600/30 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                  <div className="bg-[#181614] border border-[#2f2b28] rounded-2xl rounded-tl-sm p-4 text-xs text-stone-400 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                    <span>Gemini is thinking ({selectedModel})...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="px-6 py-2 bg-[#141210] border-t border-[#262320] flex items-center gap-2 overflow-x-auto text-[11px] text-stone-400">
              <span className="font-semibold text-stone-400 shrink-0">Quick prompts:</span>
              <button
                type="button"
                onClick={() => setChatInput("Critique my current page layout and suggest 3 high-impact improvements.")}
                className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-orange-500/50 hover:text-stone-200 transition shrink-0"
              >
                📐 Critique Page Layout
              </button>
              <button
                type="button"
                onClick={() => setChatInput("Write 3 high-converting hero headlines and subheadlines for this website.")}
                className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-orange-500/50 hover:text-stone-200 transition shrink-0"
              >
                ✍️ Write Hero Headlines
              </button>
              <button
                type="button"
                onClick={() => setChatInput("Recommend a modern high-contrast color palette with hex codes.")}
                className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-orange-500/50 hover:text-stone-200 transition shrink-0"
              >
                🎨 Recommend Color Palette
              </button>
              <button
                type="button"
                onClick={() => setChatInput("How can I optimize this page for better mobile conversions and SEO?")}
                className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-orange-500/50 hover:text-stone-200 transition shrink-0"
              >
                🚀 Mobile & SEO Tips
              </button>
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#2e2a28] bg-[#161513] flex items-center gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ask ${roles[selectedRole].name} anything (e.g., 'Rewrite my headline', 'Add pricing table', 'Debug layout')...`}
                className="flex-1 bg-stone-900/90 border border-stone-700/80 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-orange-950/40"
              >
                {chatLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                <span>Send</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: GEMINI LIVE API REAL-TIME VOICE CONVERSATION */}
        {activeTab === "live" && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0f0e0d] p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full flex flex-col items-center gap-6 py-4">
              {/* Animated Live Voice Visualizer Orb */}
              <div className="relative flex items-center justify-center">
                {/* Outer pulsing rings when active */}
                {liveConnected && (
                  <>
                    <div className="absolute w-44 h-44 rounded-full bg-orange-500/15 animate-ping" />
                    <div className="absolute w-36 h-36 rounded-full bg-orange-500/25 animate-pulse" />
                  </>
                )}

                {/* Central Microphone / Speaker Sphere */}
                <div
                  className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl relative z-10 ${
                    liveConnected
                      ? liveSpeaking
                        ? "bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 shadow-orange-500/50 scale-105"
                        : "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/30"
                      : "bg-stone-800 border-2 border-stone-700 text-stone-400"
                  }`}
                >
                  {liveConnected ? (
                    liveSpeaking ? (
                      <Volume2 size={40} className="text-white animate-bounce" />
                    ) : (
                      <Mic size={38} className="text-white" />
                    )
                  ) : (
                    <Headphones size={36} className="text-stone-400" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 mt-1">
                    {liveConnected ? (liveSpeaking ? "Speaking" : "Listening") : "Offline"}
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-stone-100 flex items-center justify-center gap-2">
                  <span>Gemini 3.8 Live Voice Studio</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    WebSocket 16kHz → 24kHz
                  </span>
                </h3>
                <p className="text-xs text-stone-400 max-w-md mx-auto">{liveStatus}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {!liveConnected ? (
                  <button
                    type="button"
                    onClick={startLiveConversation}
                    className="py-3 px-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-xl shadow-orange-950/50"
                  >
                    <Radio size={16} />
                    Start Voice Conversation (gemini-3.8-live)
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setLiveMuted(!liveMuted)}
                      className={`p-3 rounded-xl border font-semibold text-xs transition flex items-center gap-2 ${
                        liveMuted
                          ? "bg-red-950/80 border-red-700 text-red-300"
                          : "bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700"
                      }`}
                    >
                      {liveMuted ? <MicOff size={16} className="text-red-400" /> : <Mic size={16} className="text-emerald-400" />}
                      <span>{liveMuted ? "Unmute Mic" : "Mute Mic"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={stopAllPlayback}
                      className="p-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 font-semibold text-xs transition flex items-center gap-2"
                      title="Interrupt Gemini response immediately"
                    >
                      <VolumeX size={16} className="text-amber-400" />
                      <span>Interrupt</span>
                    </button>

                    <button
                      type="button"
                      onClick={stopLiveConversation}
                      className="py-3 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-red-950/40"
                    >
                      <X size={16} />
                      <span>End Call</span>
                    </button>
                  </>
                )}
              </div>

              {/* Live Transcript Stream */}
              <div className="w-full bg-[#161413] border border-stone-800 rounded-xl p-4 space-y-2.5 max-h-56 overflow-y-auto text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-orange-400" /> Live Conversation Transcript
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">model: gemini-3.8-live</span>
                </div>

                {liveTranscript.map((turn, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg leading-relaxed ${
                      turn.sender === "user"
                        ? "bg-orange-950/40 border border-orange-800/40 text-orange-200"
                        : "bg-stone-900 border border-stone-800 text-stone-200"
                    }`}
                  >
                    <span className="font-bold text-[10px] uppercase block mb-0.5 text-stone-400">
                      {turn.sender === "user" ? "You (Microphone)" : "Gemini Live"}
                    </span>
                    {turn.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: BRAND KIT & CUSTOMER SUPPORT WIDGET */}
        {activeTab === "brandkit" && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0f0e0d] p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full space-y-6">
              {/* Brand Kit Generator */}
              <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                    <Palette size={16} className="text-orange-400" />
                    AI Brand Kit & Copy Generator
                  </h3>
                  <p className="text-xs text-stone-400">
                    Generate cohesive typography, primary branding colors, and high-converting marketing copy in 1 click.
                  </p>
                </div>

                <form onSubmit={handleGenerateBrandKit} className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g., NovaPay, Studio Zenith"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1">Industry</label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g., SaaS, Cafe, Fintech, Agency"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div className="col-span-2 pt-1">
                    <button
                      type="submit"
                      disabled={generatingKit || !brandName.trim()}
                      className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-orange-950/40"
                    >
                      {generatingKit ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      Generate Brand Identity & Colors
                    </button>
                  </div>
                </form>

                {brandKit && (
                  <div className="mt-4 p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                      <span className="font-bold text-stone-200">Generated Palette & Typography</span>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: brandKit.primaryColor }} />
                        <span className="font-mono text-stone-400">{brandKit.primaryColor}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-stone-300">
                      <div><span className="text-stone-500 font-medium">Headline:</span> {brandKit.heroHeadline}</div>
                      <div><span className="text-stone-500 font-medium">CTA Button:</span> {brandKit.ctaText}</div>
                    </div>
                    <button
                      type="button"
                      onClick={applyBrandKitToCanvas}
                      className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 mt-2"
                    >
                      {kitApplied ? <CheckCircle2 size={14} /> : <Palette size={14} />}
                      {kitApplied ? "Brand Kit Applied to Canvas!" : "Apply Brand Kit to Current Page"}
                    </button>
                  </div>
                )}
              </div>

              {/* Embeddable Customer Chatbot Component */}
              <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                    <Bot size={16} className="text-emerald-400" />
                    Embeddable AI Customer Support Widget
                  </h3>
                  <p className="text-xs text-stone-400">
                    Insert an intelligent floating chat widget directly into your canvas for website visitors.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1">Bot Name</label>
                    <input
                      type="text"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 block mb-1">Greeting Message</label>
                    <input
                      type="text"
                      value={botWelcome}
                      onChange={(e) => setBotWelcome(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleInsertAiChatbot}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40"
                  >
                    <Plus size={15} />
                    Insert AI Customer Chat Widget into Website
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
