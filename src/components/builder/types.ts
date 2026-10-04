export type NodeType =
  | "section"
  | "container"
  | "heading"
  | "text"
  | "button"
  | "image"
  | "divider"
  | "video"
  | "carousel"
  | "countdown"
  | "stars"
  | "map"
  | "form"
  | "product"
  | "pricing"
  | "faq"
  | "calculator"
  | "tabs"
  | "popup"
  | "whatsapp"
  | "blog"
  | "themeToggle"
  | "iconBadge"
  | "aiChatbot"
  | "beforeAfter"
  | "marquee"
  | "tiltCard"
  | "bookingCalendar"
  | "dataChart"
  | "directoryGrid"
  | "apiTable"
  | "smartNavbar"
  | "langSwitcher"
  | "masonryGallery"
  | "pdfViewer"
  | "imageHotspot"
  | "customEmbed";

export interface FaqItem {
  q: string;
  a: string;
}

export interface TabItem {
  label: string;
  title: string;
  content: string;
}

export interface BNode {
  id: string;
  type: NodeType;
  level?: number; // heading tag level 1-6 (h1..h6)
  text?: string;
  src?: string;
  href?: string;
  videoUrl?: string;
  carouselImages?: string[];
  targetDate?: string;
  rating?: number;
  author?: string;
  mapQuery?: string;
  // Form Builder properties
  formType?: "contact" | "signup" | "booking";
  formTitle?: string;
  formButtonText?: string;
  // E-Commerce Product properties
  productTitle?: string;
  productPrice?: number;
  productBadge?: string;
  // Interactive Widgets properties
  faqItems?: FaqItem[];
  tabItems?: TabItem[];
  whatsappNumber?: string;
  whatsappMessage?: string;
  popupTitle?: string;
  popupText?: string;
  // CMS & Blog properties
  cmsCollection?: "blog" | "portfolio" | "team";
  // Custom Icon & SVG Badge properties
  iconName?: string;
  iconBadgeStyle?: "pill" | "circle" | "card" | "seal";
  iconColor?: string;
  // Embeddable AI Customer Support Chatbot properties
  botName?: string;
  botWelcome?: string;
  botContext?: string;
  // Before / After Slider properties
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
  // Infinite Marquee Ticker properties
  marqueeItems?: string[];
  marqueeSpeed?: "slow" | "normal" | "fast";
  // Popup Exit-Intent & Timed Trigger properties
  popupTrigger?: "click" | "timed" | "exit";
  popupDelaySeconds?: number;
  // Multi-Step Appointment Calendar Slots
  bookingSlots?: string[];
  // Live Data Charts, Directory & REST API Table properties
  chartType?: "bar" | "line" | "donut";
  chartData?: { label: string; value: number }[];
  directoryCategory?: "jobs" | "realestate" | "tools";
  apiUrl?: string;
  // Smart Sticky Navbar properties
  navBrand?: string;
  navLinks?: string[];
  navCta?: string;
  // Animated Background Effect
  bgEffect?: "none" | "aurora" | "starfield" | "cyber-grid";
  // PDF Viewer & Custom Embed properties
  pdfUrl?: string;
  embedCode?: string;
  // Built-in Image Editor & Filter Studio properties
  imageBrightness?: number;
  imageContrast?: number;
  imageBlur?: number;
  imageGrayscale?: number;
  imageSepia?: number;
  imageBadge?: string;
  imageBadgeColor?: string;
  imageFrame?: "none" | "polaroid" | "neon" | "glass" | "browser";
  // A/B Testing properties
  abVariantBText?: string;
  abVariantBBg?: string;
  abActiveVariant?: "A" | "B";
  animation?: "none" | "fade-up" | "slide-left" | "slide-right" | "zoom-in" | "bounce" | "flip-up" | "blur-in";
  hoverEffect?: "none" | "lift" | "glow" | "scale" | "tilt";
  className?: string;
  rawHtml?: string;
  style: Record<string, string>;
  children?: BNode[];
}

export interface Snapshot {
  id: string;
  name: string;
  timestamp: number;
  pages: any[];
  activePageId: string;
}

export const uid = () => Math.random().toString(36).slice(2, 9);

export const isContainer = (t: NodeType) => t === "section" || t === "container";

export function createNode(type: NodeType): BNode {
  const id = uid();
  switch (type) {
    case "section":
      return { id, type, style: { padding: "64px 32px", background: "#f6f1ea", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }, children: [] };
    case "container":
      return { id, type, style: { display: "flex", flexDirection: "row", gap: "16px", padding: "16px", width: "100%", justifyContent: "center" }, children: [] };
    case "heading":
      return { id, type, level: 2, text: "New heading", style: { fontSize: "40px", fontWeight: "700", color: "#1c1917", margin: "0" } };
    case "text":
      return { id, type, text: "Write something meaningful here.", style: { fontSize: "18px", color: "#57534e", lineHeight: "1.6", margin: "0" } };
    case "button":
      return { id, type, text: "Click me", href: "#", style: { background: "#c2410c", color: "#ffffff", padding: "12px 28px", borderRadius: "999px", fontSize: "16px", fontWeight: "600", display: "inline-block", textDecoration: "none" } };
    case "image":
      return { id, type, src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200", style: { width: "100%", maxWidth: "640px", borderRadius: "16px", display: "block" } };
    case "divider":
      return { id, type, style: { width: "100%", height: "1px", background: "#d6d3d1", border: "none", margin: "16px 0" } };
    case "video":
      return {
        id,
        type,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        style: { width: "100%", maxWidth: "720px", height: "400px", borderRadius: "16px", overflow: "hidden", border: "none", margin: "16px auto" },
      };
    case "carousel":
      return {
        id,
        type,
        carouselImages: [
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200",
          "https://images.unsplash.com/photo-1517976487507-5b3b4a45a74c?w=1200",
          "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200",
        ],
        style: { width: "100%", maxWidth: "800px", height: "420px", borderRadius: "16px", overflow: "hidden", margin: "16px auto" },
      };
    case "countdown":
      return {
        id,
        type,
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        style: { padding: "24px 32px", background: "#18181b", borderRadius: "16px", color: "#ffffff", maxWidth: "560px", margin: "16px auto", textAlign: "center" },
      };
    case "stars":
      return {
        id,
        type,
        rating: 5,
        text: "“Canvas transformed our landing page workflow! It saved us over 40 hours of development time and looks stunning.”",
        author: "Sarah Jenkins, VP Design at Stripe",
        src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        style: { padding: "28px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e5e7eb", maxWidth: "520px", margin: "16px auto", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" },
      };
    case "map":
      return {
        id,
        type,
        mapQuery: "San Francisco, CA",
        style: { width: "100%", maxWidth: "760px", height: "360px", borderRadius: "16px", overflow: "hidden", border: "none", margin: "16px auto" },
      };
    case "form":
      return {
        id,
        type,
        formType: "contact",
        formTitle: "Get in Touch with Our Team",
        text: "Fill out the form below and our team will respond within 24 hours. Connected directly to backend & cloud database.",
        formButtonText: "Send Message →",
        style: { width: "100%", maxWidth: "560px", padding: "32px", background: "#18181b", color: "#ffffff", borderRadius: "20px", margin: "16px auto", boxShadow: "0 20px 40px rgba(0,0,0,0.18)" },
      };
    case "product":
      return {
        id,
        type,
        productTitle: "Pro Wireless Studio Headphones",
        productPrice: 249,
        productBadge: "BESTSELLER",
        text: "Active noise cancellation, 40-hour battery life, and spatial studio acoustics.",
        src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
        rating: 5,
        style: { width: "100%", maxWidth: "380px", padding: "20px", background: "#18181b", color: "#ffffff", borderRadius: "20px", margin: "16px auto" },
      };
    case "pricing":
      return {
        id,
        type,
        text: "Simple, Transparent Plans",
        style: { width: "100%", maxWidth: "960px", padding: "40px 24px", background: "#18181b", color: "#ffffff", borderRadius: "24px", margin: "16px auto" },
      };
    case "faq":
      return {
        id,
        type,
        text: "Frequently Asked Questions",
        faqItems: [
          { q: "Can I upload my own ZIP file with HTML, CSS & Backend?", a: "Yes! Upload any .zip archive and Canvas preserves all your backend files while letting you visually edit HTML & CSS." },
          { q: "Does it export clean React & Tailwind code?", a: "Absolutely. Open the Code Inspector to copy or download production-ready React (.tsx), Next.js, or standalone HTML." },
          { q: "Where do form submissions get saved?", a: "All form submissions are automatically saved to both the Node/Express backend and your Firebase Cloud Firestore database." },
        ],
        style: { width: "100%", maxWidth: "740px", padding: "32px", background: "#18181b", color: "#ffffff", borderRadius: "20px", margin: "16px auto" },
      };
    case "calculator":
      return {
        id,
        type,
        text: "Interactive Project Cost Calculator",
        style: { width: "100%", maxWidth: "620px", padding: "32px", background: "#18181b", color: "#ffffff", borderRadius: "20px", margin: "16px auto" },
      };
    case "tabs":
      return {
        id,
        type,
        text: "Explore Platform Features",
        tabItems: [
          { label: "Visual Builder", title: "Real-Time Drag & Drop Canvas", content: "Click any element to customize typography, gradients, glassmorphism, animations, and responsive breakpoints in real time." },
          { label: "Full-Stack ZIP", title: "Built-In ZIP File Explorer & Backend Sync", content: "Inspect and edit index.html, style.css, and server.ts directly inside the built-in IDE sidebar and sync backend routes with AI." },
          { label: "Cloud & Export", title: "1-Click Live Link & React/Next.js Export", content: "Save projects to Firebase Cloud, share a live URL with clients, or export clean React + Tailwind (.tsx) components." },
        ],
        style: { width: "100%", maxWidth: "780px", padding: "32px", background: "#18181b", color: "#ffffff", borderRadius: "20px", margin: "16px auto" },
      };
    case "popup":
      return {
        id,
        type,
        text: "🎁 Claim 30% Launch Discount",
        popupTitle: "Unlock 30% Off Your First Year!",
        popupText: "Enter your email below to receive your instant promo code and priority onboarding.",
        style: { padding: "20px", margin: "16px auto", textAlign: "center" },
      };
    case "whatsapp":
      return {
        id,
        type,
        text: "Chat with Us on WhatsApp",
        whatsappNumber: "919876543210",
        whatsappMessage: "Hi! I visited your website and would like to know more.",
        style: { padding: "16px", margin: "16px auto", textAlign: "center" },
      };
    case "blog":
      return {
        id,
        type,
        text: "Latest Insights & Articles",
        cmsCollection: "blog",
        style: { width: "100%", maxWidth: "980px", padding: "40px 24px", background: "#18181b", color: "#ffffff", borderRadius: "24px", margin: "16px auto" },
      };
    case "themeToggle":
      return {
        id,
        type,
        text: "Switch Website Theme",
        style: { padding: "12px 20px", margin: "12px auto", textAlign: "center" },
      };
    case "iconBadge":
      return {
        id,
        type,
        text: "Verified Enterprise Security",
        iconName: "ShieldCheck",
        iconBadgeStyle: "pill",
        iconColor: "#f97316",
        style: { padding: "12px", margin: "8px auto", textAlign: "center" },
      };
    case "aiChatbot":
      return {
        id,
        type,
        botName: "Canvas AI Support",
        botWelcome: "नमस्ते! 👋 मैं आपका AI असिस्टेंट हूँ। हमारे प्रोडक्ट्स, प्राइसिंग या सर्विसेज़ के बारे में कुछ भी पूछें!",
        botContext: "Starter plan is $19/mo, Pro Studio is $49/mo, Enterprise is $99/mo. 24/7 support and instant setup.",
        iconColor: "#f97316",
        style: { width: "100%", maxWidth: "460px", padding: "16px", margin: "16px auto" },
      };
    case "beforeAfter":
      return {
        id,
        type,
        text: "Drag Slider to Compare: Before vs After Redesign",
        beforeLabel: "BEFORE (Old Layout)",
        afterLabel: "AFTER (Canvas Pro)",
        beforeImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1000&auto=format&fit=crop&q=80",
        afterImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80",
        style: { width: "100%", maxWidth: "780px", padding: "24px", background: "#18181b", color: "#ffffff", borderRadius: "24px", margin: "16px auto" },
      };
    case "marquee":
      return {
        id,
        type,
        text: "Trusted by World-Class Teams",
        marqueeSpeed: "normal",
        marqueeItems: [
          "⚡ STRIPE STUDIO",
          "🚀 VERCEL CLOUD",
          "💎 LINEAR DESIGN",
          "🔥 SHOPIFY PLUS",
          "✨ FRAMER PRO",
          "🌐 CLOUDFLARE EDGE",
        ],
        style: { width: "100%", padding: "24px 0", background: "#09090b", color: "#ffffff", margin: "12px 0" },
      };
    case "tiltCard":
      return {
        id,
        type,
        productBadge: "3D INTERACTIVE SPOTLIGHT",
        productTitle: "Holographic 3D Spatial Card",
        text: "Move your cursor across this card to experience real-time 3D perspective tilt and dynamic radial spotlight tracking.",
        formButtonText: "Explore 3D Experience →",
        iconColor: "#f97316",
        style: { width: "100%", maxWidth: "520px", padding: "16px", margin: "16px auto" },
      };
    case "bookingCalendar":
      return {
        id,
        type,
        formTitle: "Schedule a 1-on-1 Strategy Session",
        text: "Select your preferred date and time slot below. Instant confirmation synced with CRM Pipeline.",
        bookingSlots: ["10:00 AM", "11:30 AM", "02:30 PM", "04:00 PM", "05:30 PM"],
        style: { width: "100%", maxWidth: "640px", padding: "32px", background: "#18181b", color: "#ffffff", borderRadius: "24px", margin: "16px auto" },
      };
    case "dataChart":
      return {
        id,
        type,
        text: "Annual Revenue & Conversion Growth",
        chartType: "bar",
        chartData: [
          { label: "Jan", value: 42 },
          { label: "Feb", value: 58 },
          { label: "Mar", value: 74 },
          { label: "Apr", value: 65 },
          { label: "May", value: 89 },
          { label: "Jun", value: 96 },
        ],
        style: { width: "100%", maxWidth: "780px", padding: "32px", background: "#18181b", color: "#ffffff", borderRadius: "24px", margin: "16px auto" },
      };
    case "directoryGrid":
      return {
        id,
        type,
        text: "Explore Curated Opportunities & Listings",
        directoryCategory: "jobs",
        style: { width: "100%", maxWidth: "960px", padding: "32px", background: "#18181b", color: "#ffffff", borderRadius: "24px", margin: "16px auto" },
      };
    case "apiTable":
      return {
        id,
        type,
        text: "Live External REST API Data Explorer",
        apiUrl: "/api/cms/items",
        style: { width: "100%", maxWidth: "920px", padding: "28px", background: "#18181b", color: "#ffffff", borderRadius: "24px", margin: "16px auto" },
      };
    case "smartNavbar":
      return {
        id,
        type,
        navBrand: "CANVAS.PRO",
        navLinks: ["Features", "Pricing", "Case Studies", "Docs"],
        navCta: "Start Free Trial →",
        style: { width: "100%", padding: "16px 32px", background: "rgba(24, 24, 27, 0.9)", color: "#ffffff", position: "sticky", top: "0", zIndex: "30" },
      };
    case "langSwitcher":
      return {
        id,
        type,
        text: "Global Language & RTL Switcher",
        style: { padding: "12px 20px", margin: "12px auto", textAlign: "center" },
      };
    case "masonryGallery":
      return {
        id,
        type,
        text: "Filterable Masonry Portfolio & Lightbox Zoom",
        style: { width: "100%", maxWidth: "980px", padding: "32px", background: "#18181b", color: "#ffffff", borderRadius: "24px", margin: "16px auto" },
      };
    case "pdfViewer":
      return {
        id,
        type,
        text: "Interactive Product Brochure & Resume PDF Viewer",
        pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        style: { width: "100%", maxWidth: "820px", padding: "28px", background: "#18181b", color: "#ffffff", borderRadius: "24px", margin: "16px auto" },
      };
    case "imageHotspot":
      return {
        id,
        type,
        text: "Interactive Shop-the-Look Studio Setup (Hover or Click + Pins)",
        src: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1200&auto=format&fit=crop&q=80",
        style: { width: "100%", maxWidth: "820px", padding: "28px", background: "#18181b", color: "#ffffff", borderRadius: "24px", margin: "16px auto" },
      };
    case "customEmbed":
      return {
        id,
        type,
        text: "Custom HTML / Iframe / Third-Party Widget Embed",
        embedCode: `<div style="padding:24px;border-radius:16px;background:linear-gradient(135deg,#1e1b4b,#311042);color:#fff;text-align:center;font-family:sans-serif;"><h3 style="margin:0 0 8px;">⚡ Live Custom HTML / Script Embed</h3><p style="margin:0;font-size:13px;opacity:0.85;">Embed Calendly, Typeform, Spotify, YouTube, or custom JavaScript widgets right here.</p></div>`,
        style: { width: "100%", maxWidth: "760px", padding: "24px", background: "#18181b", color: "#ffffff", borderRadius: "20px", margin: "16px auto" },
      };
  }
}

export const defaultPage: BNode = {
  id: "root",
  type: "section",
  style: { display: "flex", flexDirection: "column", background: "#ffffff", minHeight: "100%", width: "100%" },
  children: [],
};

export function findNode(root: BNode, id: string): BNode | null {
  if (root.id === id) return root;
  for (const c of root.children ?? []) {
    const found = findNode(c, id);
    if (found) return found;
  }
  return null;
}

export function findParent(root: BNode, id: string): BNode | null {
  for (const c of root.children ?? []) {
    if (c.id === id) return root;
    const found = findParent(c, id);
    if (found) return found;
  }
  return null;
}

export function mapTree(root: BNode, fn: (n: BNode) => BNode): BNode {
  const updated = fn(root);
  if (!updated.children) return updated;
  return { ...updated, children: updated.children.map((c) => mapTree(c, fn)) };
}

export function insertChildAt(root: BNode, parentId: string, index: number, child: BNode): BNode {
  return mapTree(root, (n) => {
    if (n.id !== parentId) return n;
    const children = [...(n.children ?? [])];
    children.splice(Math.max(0, Math.min(index, children.length)), 0, child);
    return { ...n, children };
  });
}

export function cloneWithIds(n: BNode): BNode {
  const c: BNode = { ...n, id: uid(), style: { ...n.style } };
  if (n.children) c.children = n.children.map(cloneWithIds);
  return c;
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function toHTML(n: BNode): string {
  const css = Object.entries(n.style).map(([k, v]) => `${kebab(k)}:${v}`).join(";");
  const clsAttr = n.className ? ` class="${esc(n.className)}"` : "";
  if (n.rawHtml) return n.rawHtml;
  if (n.type === "customEmbed" && n.embedCode) return n.embedCode;
  switch (n.type) {
    case "heading": { const tag = `h${n.level ?? 2}`; return `<${tag}${clsAttr} style="${css}">${esc(n.text)}</${tag}>`; }
    case "text": return `<p${clsAttr} style="${css}">${esc(n.text)}</p>`;
    case "button": return `<a${clsAttr} href="${n.href || '#'}" style="${css}">${esc(n.text)}</a>`;
    case "image": return `<img${clsAttr} src="${n.src}" style="${css}" alt=""/>`;
    case "divider": return `<hr${clsAttr} style="${css}"/>`;
    case "video": return `<div${clsAttr} style="${css}"><iframe src="${n.videoUrl}" style="width:100%;height:100%;border:none;" allowfullscreen></iframe></div>`;
    case "carousel": return `<div${clsAttr} style="${css}"><img src="${(n.carouselImages || [])[0]}" style="width:100%;height:100%;object-fit:cover;" alt=""/></div>`;
    case "countdown": return `<div${clsAttr} style="${css}"><h3>Offer Ends In:</h3><div style="font-size:24px;font-weight:bold;">07 Days : 14 Hours : 32 Mins</div></div>`;
    case "stars": return `<div${clsAttr} style="${css}"><div style="color:#f59e0b;font-size:20px;">★★★★★</div><p>${esc(n.text)}</p><strong>${esc(n.author)}</strong></div>`;
    case "map": return `<div${clsAttr} style="${css}"><iframe src="https://maps.google.com/maps?q=${encodeURIComponent(n.mapQuery || 'San Francisco')}&t=&z=13&ie=UTF8&iwloc=&output=embed" style="width:100%;height:100%;border:none;"></iframe></div>`;
    case "form":
      return `<form${clsAttr} style="${css}" onsubmit="event.preventDefault();fetch('/api/forms/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:this.name.value,email:this.email.value,message:this.message.value})}).then(()=>alert('Submitted!'));"><h3>${esc(n.formTitle || "Contact Us")}</h3><p>${esc(n.text)}</p><input name="name" placeholder="Your Name" required style="width:100%;padding:10px;margin:8px 0;border-radius:8px;"/><input name="email" type="email" placeholder="Your Email" required style="width:100%;padding:10px;margin:8px 0;border-radius:8px;"/><textarea name="message" placeholder="Details" style="width:100%;padding:10px;margin:8px 0;border-radius:8px;"></textarea><button type="submit" style="background:#ea580c;color:#fff;padding:12px 24px;border:none;border-radius:8px;font-weight:700;cursor:pointer;">${esc(n.formButtonText || "Submit")}</button></form>`;
    case "product":
      return `<div${clsAttr} style="${css}"><img src="${n.src}" style="width:100%;height:220px;object-fit:cover;border-radius:12px;" alt=""/><h3>${esc(n.productTitle || "Product")}</h3><p>${esc(n.text)}</p><strong>$${n.productPrice ?? 249}</strong></div>`;
    case "pricing":
      return `<section${clsAttr} style="${css}"><h2>${esc(n.text || "Pricing Plans")}</h2></section>`;
    case "faq":
      return `<section${clsAttr} style="${css}"><h2>${esc(n.text || "FAQ")}</h2>${(n.faqItems || []).map((f) => `<details style="margin:10px 0;"><summary style="font-weight:700;">${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</section>`;
    case "calculator":
      return `<section${clsAttr} style="${css}"><h3>${esc(n.text || "Interactive Price Calculator")}</h3></section>`;
    case "tabs":
      return `<section${clsAttr} style="${css}"><h3>${esc(n.text || "Features")}</h3></section>`;
    case "popup":
      return `<div${clsAttr} style="${css}"><button onclick="alert('${esc(n.popupTitle || "Special Offer")}')">${esc(n.text || "Open Offer")}</button></div>`;
    case "whatsapp":
      return `<div${clsAttr} style="${css}"><a href="https://wa.me/${n.whatsappNumber || "919876543210"}?text=${encodeURIComponent(n.whatsappMessage || "Hello!")}" target="_blank" style="background:#22c55e;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700;">${esc(n.text || "Chat on WhatsApp")}</a></div>`;
    default: return `<div${clsAttr} style="${css}">${(n.children ?? []).map(toHTML).join("")}</div>`;
  }
}

// Convert inline styles to clean Tailwind arbitrary/standard classes + inline fallback where needed
function styleToTailwind(s: Record<string, string>): { tw: string; inlineObj: Record<string, string> } {
  const classes: string[] = [];
  const rest: Record<string, string> = {};

  for (const [k, v] of Object.entries(s)) {
    if (!v) continue;
    if (k === "display" && v === "flex") classes.push("flex");
    else if (k === "display" && v === "block") classes.push("block");
    else if (k === "display" && v === "inline-block") classes.push("inline-block");
    else if (k === "flexDirection" && v === "column") classes.push("flex-col");
    else if (k === "flexDirection" && v === "row") classes.push("flex-row");
    else if (k === "alignItems" && v === "center") classes.push("items-center");
    else if (k === "alignItems" && v === "flex-start") classes.push("items-start");
    else if (k === "justifyContent" && v === "center") classes.push("justify-center");
    else if (k === "justifyContent" && v === "space-between") classes.push("justify-between");
    else if (k === "flexWrap" && v === "wrap") classes.push("flex-wrap");
    else if (k === "textAlign" && v === "center") classes.push("text-center");
    else if (k === "textAlign" && v === "left") classes.push("text-left");
    else if (k === "textAlign" && v === "right") classes.push("text-right");
    else if (k === "width" && v === "100%") classes.push("w-full");
    else if (k === "fontWeight" && v === "700") classes.push("font-bold");
    else if (k === "fontWeight" && v === "800") classes.push("font-extrabold");
    else if (k === "fontWeight" && v === "600") classes.push("font-semibold");
    else if (k === "borderRadius" && v === "999px") classes.push("rounded-full");
    else if (k === "borderRadius" && (v === "16px" || v === "20px")) classes.push("rounded-2xl");
    else if (k === "borderRadius" && v === "12px") classes.push("rounded-xl");
    else if (k === "backgroundColor" && /^#[0-9a-fA-F]{3,8}$/.test(v)) classes.push(`bg-[${v}]`);
    else if (k === "color" && /^#[0-9a-fA-F]{3,8}$/.test(v)) classes.push(`text-[${v}]`);
    else if (k === "fontSize" && /^\d+px$/.test(v)) classes.push(`text-[${v}]`);
    else if (k === "gap" && /^\d+px$/.test(v)) classes.push(`gap-[${v}]`);
    else rest[k] = v;
  }

  return { tw: classes.join(" "), inlineObj: rest };
}

function renderJsxNode(n: BNode, indent = 4): string {
  const pad = " ".repeat(indent);
  const { tw, inlineObj } = styleToTailwind(n.style);
  const classAttr = tw ? ` className="${tw}"` : "";
  const styleAttr = Object.keys(inlineObj).length > 0 ? ` style={${JSON.stringify(inlineObj)}}` : "";

  switch (n.type) {
    case "heading": {
      const Tag = `h${n.level ?? 2}`;
      return `${pad}<${Tag}${classAttr}${styleAttr}>${esc(n.text)}</${Tag}>`;
    }
    case "text":
      return `${pad}<p${classAttr}${styleAttr}>${esc(n.text)}</p>`;
    case "button":
      return `${pad}<a href="${n.href || "#"}"${classAttr}${styleAttr}>${esc(n.text)}</a>`;
    case "image":
      return `${pad}<img src="${n.src || ""}" alt=""${classAttr}${styleAttr} />`;
    case "divider":
      return `${pad}<hr${classAttr}${styleAttr} />`;
    case "form":
      return `${pad}<form className="flex flex-col gap-3 p-6 rounded-2xl bg-zinc-900 text-white"${styleAttr}>\n${pad}  <h3 className="text-xl font-bold">${esc(n.formTitle || "Contact Us")}</h3>\n${pad}  <p className="text-sm text-zinc-400">${esc(n.text)}</p>\n${pad}  <input className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700" placeholder="Your Name" />\n${pad}  <input className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700" type="email" placeholder="Your Email" />\n${pad}  <textarea className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700" rows={3} placeholder="Message" />\n${pad}  <button type="submit" className="py-2.5 px-5 rounded-xl bg-orange-600 font-semibold text-white">${esc(n.formButtonText || "Submit")}</button>\n${pad}</form>`;
    case "product":
      return `${pad}<div className="p-5 rounded-2xl bg-zinc-900 text-white flex flex-col gap-3"${styleAttr}>\n${pad}  <img src="${n.src}" alt="${esc(n.productTitle)}" className="w-full h-52 object-cover rounded-xl" />\n${pad}  <h3 className="text-lg font-bold">${esc(n.productTitle || "Product")}</h3>\n${pad}  <p className="text-sm text-zinc-400">${esc(n.text)}</p>\n${pad}  <div className="flex items-center justify-between pt-2">\n${pad}    <span className="text-2xl font-extrabold text-orange-400">$${n.productPrice ?? 249}</span>\n${pad}    <button className="px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold">Add to Cart</button>\n${pad}  </div>\n${pad}</div>`;
    default: {
      const Tag = n.type === "section" ? "section" : "div";
      const childrenJsx = (n.children ?? []).map((c) => renderJsxNode(c, indent + 2)).join("\n");
      if (!childrenJsx) return `${pad}<${Tag}${classAttr}${styleAttr} />`;
      return `${pad}<${Tag}${classAttr}${styleAttr}>\n${childrenJsx}\n${pad}</${Tag}>`;
    }
  }
}

export function toReactTailwind(root: BNode, componentName = "CanvasExportedPage"): string {
  return `import React from "react";

export default function ${componentName}() {
  return (
${renderJsxNode(root, 4)}
  );
}
`;
}

export function toNextJsPage(root: BNode, title = "Canvas Website", description = "Built with Canvas Visual Website Builder"): string {
  return `import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: ${JSON.stringify(title)},
  description: ${JSON.stringify(description)},
};

export default function Page() {
  return (
    <main className="min-h-screen w-full">
${renderJsxNode(root, 6)}
    </main>
  );
}
`;
}

export function toWordPressGutenberg(root: BNode): string {
  const htmlBody = toHTML(root);
  return `<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
  <!-- wp:html -->
  ${htmlBody}
  <!-- /wp:html -->
</div>
<!-- /wp:group -->`;
}

export function toVueSfc(root: BNode, customCss = ""): string {
  return `<script setup lang="ts">
// Generated by Canvas Visual Website Builder (Vue 3 SFC + Tailwind)
</script>

<template>
  <div class="canvas-vue-root">
    ${toHTML(root)}
  </div>
</template>

<style scoped>
.canvas-vue-root {
  min-height: 100vh;
}
${customCss}
</style>
`;
}

export function toAstroComponent(root: BNode, title = "Canvas Website"): string {
  return `---
// Generated by Canvas Visual Website Builder (Astro Component)
const pageTitle = ${JSON.stringify(title)};
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{pageTitle}</title>
  </head>
  <body>
    ${toHTML(root)}
  </body>
</html>
`;
}
