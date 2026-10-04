import React, { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, Copy, GripVertical, Plus, Trash2, Sparkles } from "lucide-react";
import type { BNode, NodeType } from "./types";
import {
  VideoWidget,
  CarouselWidget,
  CountdownWidget,
  StarsWidget,
  MapWidget,
  FormWidget,
  ProductWidget,
  PricingWidget,
  FaqWidget,
  CalculatorWidget,
  TabsWidget,
  PopupWidget,
  WhatsAppWidget,
  BlogCmsWidget,
  ThemeToggleWidget,
  IconBadgeWidget,
  AiChatbotWidget,
  BeforeAfterWidget,
  MarqueeWidget,
  TiltCardWidget,
  BookingCalendarWidget,
  DataChartWidget,
  DirectoryGridWidget,
  ApiTableWidget,
  SmartNavbarWidget,
  LangSwitcherWidget,
  MasonryGalleryWidget,
  PdfViewerWidget,
  ImageHotspotWidget,
  CustomEmbedWidget,
} from "./Widgets";

interface Props {
  node: BNode;
  selected: string | null;
  editing: boolean;
  textEditId: string | null;
  onSelect: (id: string) => void;
  onSelectParent: (id: string) => void;
  onEditText: (id: string) => void;
  onText: (id: string, text: string) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onInsert: (parentId: string, index: number, type: NodeType) => void;
  onOpenAi?: () => void;
  parentId?: string;
}

const BLOCKS: { type: NodeType; label: string }[] = [
  { type: "section", label: "Section" },
  { type: "container", label: "Row / Box" },
  { type: "smartNavbar", label: "Smart Sticky Navbar" },
  { type: "heading", label: "Heading" },
  { type: "text", label: "Paragraph" },
  { type: "button", label: "Button" },
  { type: "image", label: "Image" },
  { type: "dataChart", label: "Visual Charts (Bar/Line/Donut)" },
  { type: "directoryGrid", label: "Searchable Directory Grid" },
  { type: "apiTable", label: "External REST API Table" },
  { type: "langSwitcher", label: "Multi-Language & RTL Bar" },
  { type: "masonryGallery", label: "Masonry Lightbox Gallery" },
  { type: "pdfViewer", label: "Brochure / Resume PDF Viewer" },
  { type: "imageHotspot", label: "Image Hotspot (Shop the Look)" },
  { type: "customEmbed", label: "Custom HTML / Iframe Embed" },
  { type: "blog", label: "Dynamic Blog & CMS Grid" },
  { type: "aiChatbot", label: "AI Support Chatbot Widget" },
  { type: "beforeAfter", label: "Before / After Image Slider" },
  { type: "marquee", label: "Infinite Logo Marquee Ticker" },
  { type: "tiltCard", label: "3D Tilt & Spotlight Card" },
  { type: "bookingCalendar", label: "Appointment Time-Slot Calendar" },
  { type: "iconBadge", label: "Custom Icon / SVG Badge" },
  { type: "themeToggle", label: "Dark / Light Theme Switch" },
  { type: "form", label: "Contact / Booking Form" },
  { type: "product", label: "E-Commerce Product" },
  { type: "pricing", label: "Pricing Toggle Table" },
  { type: "faq", label: "FAQ Accordion" },
  { type: "calculator", label: "Quote Calculator" },
  { type: "tabs", label: "Interactive Tabs" },
  { type: "popup", label: "Promo Popup Modal" },
  { type: "whatsapp", label: "WhatsApp Chat Button" },
  { type: "video", label: "Video Player" },
  { type: "carousel", label: "Image Slider" },
  { type: "countdown", label: "Countdown Timer" },
  { type: "stars", label: "Star Testimonial" },
  { type: "map", label: "Google Map" },
  { type: "divider", label: "Divider" },
];

type Rect = { top: number; left: number; width: number; height: number };

function useElementRect(ref: RefObject<HTMLElement | null>, active: boolean) {
  const [rect, setRect] = useState<Rect | null>(null);
  const measure = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    const next = element.getBoundingClientRect();
    setRect({ top: next.top, left: next.left, width: next.width, height: next.height });
  }, [ref]);

  useLayoutEffect(() => {
    if (!active) { setRect(null); return; }
    const observer = new ResizeObserver(measure);
    const frame = window.requestAnimationFrame(() => {
      measure();
      if (ref.current) observer.observe(ref.current);
    });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, measure, ref]);

  return rect;
}

function BlockToolbar({ targetRef, type, onMove, onDuplicate, onDelete, onOpenAi }: {
  targetRef: RefObject<HTMLElement | null>;
  type: NodeType;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpenAi?: () => void;
}) {
  const rect = useElementRect(targetRef, true);
  if (!rect) return null;
  const top = Math.max(6, rect.top - 38);
  const left = Math.max(6, Math.min(rect.left, window.innerWidth - 275));
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return createPortal(
    <div className="block-toolbar" style={{ top, left }} onMouseDown={stop} onClick={stop} role="toolbar" aria-label={`${type} block controls`}>
      <span className="block-grip" title="Drag handle"><GripVertical size={15} /></span>
      <span className="block-kind">{type}</span>
      <span className="block-toolbar-rule" />
      {onOpenAi && (
        <button
          type="button"
          onClick={onOpenAi}
          title="Ask AI to change this element"
          style={{ color: "var(--brand)" }}
        >
          <Sparkles size={14} />
        </button>
      )}
      <button type="button" onClick={() => onMove(-1)} title="Move up" aria-label="Move block up"><ArrowUp size={15} /></button>
      <button type="button" onClick={() => onMove(1)} title="Move down" aria-label="Move block down"><ArrowDown size={15} /></button>
      <button type="button" onClick={onDuplicate} title="Duplicate" aria-label="Duplicate block"><Copy size={15} /></button>
      <button type="button" className="block-delete" onClick={onDelete} title="Delete" aria-label="Delete block"><Trash2 size={15} /></button>
    </div>,
    document.body,
  );
}

function InsertionPoint({ parentRef, parentId, index, count, direction, onInsert }: {
  parentRef: RefObject<HTMLElement | null>;
  parentId: string;
  index: number;
  count: number;
  direction: string;
  onInsert: (parentId: string, index: number, type: NodeType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; horizontal: boolean } | null>(null);

  const measure = useCallback(() => {
    const parent = parentRef.current;
    if (!parent) return;
    const children = Array.from(parent.querySelectorAll<HTMLElement>(`:scope > [data-builder-parent="${parentId}"]`));
    const horizontal = direction === "row";
    const before = children[index - 1]?.getBoundingClientRect();
    const after = children[index]?.getBoundingClientRect();
    const p = parent.getBoundingClientRect();
    if (horizontal) {
      const left = before && after ? (before.right + after.left) / 2 : before ? before.right + 8 : after ? after.left - 8 : p.left + p.width / 2;
      setPosition({ top: p.top + p.height / 2, left, horizontal: true });
    } else {
      const top = before && after ? (before.bottom + after.top) / 2 : before ? before.bottom + 8 : after ? after.top - 8 : p.top + p.height / 2;
      setPosition({ top, left: p.left + p.width / 2, horizontal: false });
    }
  }, [direction, index, parentId, parentRef]);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(measure);
    const frame = window.requestAnimationFrame(() => {
      measure();
      if (parentRef.current) observer.observe(parentRef.current);
    });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure, parentRef, count]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("click", close); window.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!position) return null;
  return createPortal(
    <div data-insert-parent={parentId} data-insert-index={index} className={`block-inserter ${position.horizontal ? "block-inserter-row" : "block-inserter-column"} ${open ? "block-inserter-open" : ""}`} style={{ top: position.top, left: position.left }} onClick={(e) => e.stopPropagation()}>
      <span className="block-inserter-line" />
      <button type="button" className="block-inserter-trigger" aria-label="Add block" aria-expanded={open} onClick={() => setOpen((value) => !value)}><Plus size={16} /></button>
      {open && (
        <div className="block-inserter-menu max-h-72 overflow-y-auto" role="menu" aria-label="Choose a block">
          <div className="block-inserter-title">Add block</div>
          {BLOCKS.map((block) => (
            <button key={block.type} type="button" role="menuitem" onClick={() => { onInsert(parentId, index, block.type); setOpen(false); }}>
              <Plus size={13} /><span>{block.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}

export function RenderNode({ node, selected, editing, textEditId, onSelect, onSelectParent, onEditText, onText, onMove, onDuplicate, onDelete, onInsert, onOpenAi, parentId }: Props) {
  const [hovered, setHovered] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const isSel = editing && selected === node.id;
  const isTextEditing = editing && textEditId === node.id;
  const animCls = node.animation && node.animation !== "none" ? `anim-${node.animation}` : "";
  const hoverCls = node.hoverEffect && node.hoverEffect !== "none" ? `hover-${node.hoverEffect}` : "";
  const customNodeCls = node.className || "";
  const cls = `bnode ${customNodeCls} ${animCls} ${hoverCls} ${editing ? `${isSel ? "bnode-selected " : ""}${isTextEditing ? "bnode-textedit " : ""}${hovered && !isSel ? "bnode-hover" : ""}` : ""}`.trim();
  const isVariantB = node.abActiveVariant === "B";
  const displayText = isVariantB && node.abVariantBText ? node.abVariantBText : node.text;
  const computedStyle: CSSProperties = {
    ...(node.style as CSSProperties),
    ...(isVariantB && node.abVariantBBg ? { background: node.abVariantBBg, backgroundColor: node.abVariantBBg } : {}),
  };

  if (node.bgEffect === "aurora") {
    computedStyle.background = "radial-gradient(circle at 20% 20%, rgba(249, 115, 22, 0.28), transparent 45%), radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.25), transparent 50%), #09090b";
  } else if (node.bgEffect === "starfield") {
    computedStyle.backgroundColor = "#09090b";
    computedStyle.backgroundImage = "radial-gradient(rgba(255,255,255,0.28) 1px, transparent 1px), radial-gradient(rgba(249,115,22,0.35) 1px, transparent 1px)";
    computedStyle.backgroundSize = "32px 32px, 64px 64px";
    computedStyle.backgroundPosition = "0 0, 16px 16px";
  } else if (node.bgEffect === "cyber-grid") {
    computedStyle.backgroundColor = "#09090b";
    computedStyle.backgroundImage = "linear-gradient(to right, rgba(249,115,22,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(249,115,22,0.12) 1px, transparent 1px)";
    computedStyle.backgroundSize = "36px 36px";
  }

  // Image filter & frame styles
  const imgFilterParts: string[] = [];
  if (typeof node.imageBrightness === "number" && node.imageBrightness !== 100) imgFilterParts.push(`brightness(${node.imageBrightness}%)`);
  if (typeof node.imageContrast === "number" && node.imageContrast !== 100) imgFilterParts.push(`contrast(${node.imageContrast}%)`);
  if (typeof node.imageBlur === "number" && node.imageBlur > 0) imgFilterParts.push(`blur(${node.imageBlur}px)`);
  if (typeof node.imageGrayscale === "number" && node.imageGrayscale > 0) imgFilterParts.push(`grayscale(${node.imageGrayscale}%)`);
  if (typeof node.imageSepia === "number" && node.imageSepia > 0) imgFilterParts.push(`sepia(${node.imageSepia}%)`);

  if (imgFilterParts.length > 0) {
    computedStyle.filter = imgFilterParts.join(" ");
  }

  if (node.imageFrame === "polaroid") {
    computedStyle.padding = "12px 12px 36px 12px";
    computedStyle.background = "#ffffff";
    computedStyle.boxShadow = "0 16px 36px rgba(0,0,0,0.35)";
  } else if (node.imageFrame === "neon") {
    computedStyle.border = "2px solid #f97316";
    computedStyle.boxShadow = "0 0 28px rgba(249, 115, 22, 0.55)";
  } else if (node.imageFrame === "glass") {
    computedStyle.padding = "10px";
    computedStyle.background = "rgba(255,255,255,0.12)";
    computedStyle.backdropFilter = "blur(12px)";
    computedStyle.border = "1px solid rgba(255,255,255,0.25)";
  }

  const common = {
    className: cls,
    style: computedStyle,
    "data-label": isVariantB ? `${node.type} (Variant B)` : node.type,
    "data-builder-node": node.id,
    "data-builder-parent": parentId,
    ref: (element: HTMLElement | null) => { elementRef.current = element; },
    onClick: editing
      ? (e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          if (isTextEditing) return;
          if (isSel) onSelectParent(node.id);
          else onSelect(node.id);
        }
      : (e: React.MouseEvent) => {
          if (node.type === "button") {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = Math.round(((e.clientX - rect.left) / Math.max(1, window.innerWidth)) * 100);
            const relY = Math.round((e.clientY / Math.max(1, window.innerHeight)) * 100);
            fetch("/api/analytics/event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "click",
                elementId: node.id,
                label: displayText || "Button",
                x: relX || 50,
                y: relY || 35,
                variant: node.abActiveVariant || "A",
              }),
            }).catch(() => {});
          }
        },
    onDoubleClick: editing
      ? (e: React.MouseEvent) => {
          e.stopPropagation();
          if (node.type === "heading" || node.type === "text" || node.type === "button") onEditText(node.id);
        }
      : undefined,
    onMouseEnter: editing ? (e: React.MouseEvent) => { e.stopPropagation(); setHovered(true); } : undefined,
    onMouseLeave: editing ? () => setHovered(false) : undefined,
  };

  const textProps = {
    contentEditable: isTextEditing,
    suppressContentEditableWarning: true,
    onBlur: (e: React.FocusEvent<HTMLElement>) => onText(node.id, e.currentTarget.innerText),
  };

  const toolbar = isSel && node.id !== "root" && (
    <BlockToolbar targetRef={elementRef} type={node.type} onMove={onMove} onDuplicate={onDuplicate} onDelete={onDelete} onOpenAi={onOpenAi} />
  );

  switch (node.type) {
    case "heading": { const H = `h${node.level ?? 2}` as "h2"; return <>{toolbar}<H {...common} {...textProps}>{displayText}</H></>; }
    case "text": return <>{toolbar}<p {...common} {...textProps}>{displayText}</p></>;
    case "button": return <>{toolbar}<a href={editing ? undefined : node.href} {...common} {...textProps}>{displayText}</a></>;
    case "image":
      if (node.imageBadge) {
        return (
          <>
            {toolbar}
            <div {...common} style={{ ...computedStyle, position: "relative", display: "inline-block" }}>
              <img src={node.src} alt="" style={{ width: "100%", borderRadius: computedStyle.borderRadius, display: "block" }} />
              <span
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  background: node.imageBadgeColor || "#ea580c",
                  color: "#ffffff",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
                }}
              >
                {node.imageBadge}
              </span>
            </div>
          </>
        );
      }
      return <>{toolbar}<img src={node.src} alt="" {...common} /></>;
    case "divider": return <>{toolbar}<hr {...common} /></>;
    case "video": return <>{toolbar}<div {...common}><VideoWidget node={node} /></div></>;
    case "carousel": return <>{toolbar}<div {...common}><CarouselWidget node={node} /></div></>;
    case "countdown": return <>{toolbar}<div {...common}><CountdownWidget node={node} /></div></>;
    case "stars": return <>{toolbar}<div {...common}><StarsWidget node={node} /></div></>;
    case "map": return <>{toolbar}<div {...common}><MapWidget node={node} /></div></>;
    case "form": return <>{toolbar}<div {...common}><FormWidget node={node} /></div></>;
    case "product": return <>{toolbar}<div {...common}><ProductWidget node={node} /></div></>;
    case "pricing": return <>{toolbar}<div {...common}><PricingWidget node={node} /></div></>;
    case "faq": return <>{toolbar}<div {...common}><FaqWidget node={node} /></div></>;
    case "calculator": return <>{toolbar}<div {...common}><CalculatorWidget node={node} /></div></>;
    case "tabs": return <>{toolbar}<div {...common}><TabsWidget node={node} /></div></>;
    case "popup": return <>{toolbar}<div {...common}><PopupWidget node={node} /></div></>;
    case "whatsapp": return <>{toolbar}<div {...common}><WhatsAppWidget node={node} /></div></>;
    case "blog": return <>{toolbar}<div {...common}><BlogCmsWidget node={node} /></div></>;
    case "themeToggle": return <>{toolbar}<div {...common}><ThemeToggleWidget node={node} /></div></>;
    case "iconBadge": return <>{toolbar}<div {...common}><IconBadgeWidget node={node} /></div></>;
    case "aiChatbot": return <>{toolbar}<div {...common}><AiChatbotWidget node={node} /></div></>;
    case "beforeAfter": return <>{toolbar}<div {...common}><BeforeAfterWidget node={node} /></div></>;
    case "marquee": return <>{toolbar}<div {...common}><MarqueeWidget node={node} /></div></>;
    case "tiltCard": return <>{toolbar}<div {...common}><TiltCardWidget node={node} /></div></>;
    case "bookingCalendar": return <>{toolbar}<div {...common}><BookingCalendarWidget node={node} /></div></>;
    case "dataChart": return <>{toolbar}<div {...common}><DataChartWidget node={node} /></div></>;
    case "directoryGrid": return <>{toolbar}<div {...common}><DirectoryGridWidget node={node} /></div></>;
    case "apiTable": return <>{toolbar}<div {...common}><ApiTableWidget node={node} /></div></>;
    case "smartNavbar": return <>{toolbar}<div {...common}><SmartNavbarWidget node={node} /></div></>;
    case "langSwitcher": return <>{toolbar}<div {...common}><LangSwitcherWidget node={node} /></div></>;
    case "masonryGallery": return <>{toolbar}<div {...common}><MasonryGalleryWidget node={node} /></div></>;
    case "pdfViewer": return <>{toolbar}<div {...common}><PdfViewerWidget node={node} /></div></>;
    case "imageHotspot": return <>{toolbar}<div {...common}><ImageHotspotWidget node={node} /></div></>;
    case "customEmbed": return <>{toolbar}<div {...common}><CustomEmbedWidget node={node} /></div></>;
    default:
      if (node.rawHtml) {
        return (
          <>
            {toolbar}
            <div {...common} dangerouslySetInnerHTML={{ __html: node.rawHtml }} />
          </>
        );
      }
      return (
        <>
          {toolbar}
          <div {...common}>
            {editing && Array.from({ length: (node.children?.length ?? 0) + 1 }, (_, index) => (
              <InsertionPoint key={`insert-${index}`} parentRef={elementRef} parentId={node.id} index={index} count={node.children?.length ?? 0} direction={node.style["flexDirection"] ?? "column"} onInsert={onInsert} />
            ))}
            {node.children?.length ? node.children.map((c) => (
              <RenderNode key={c.id} node={c} selected={selected} editing={editing} textEditId={textEditId}
                onSelect={onSelect} onSelectParent={onSelectParent} onEditText={onEditText} onText={onText}
                onMove={onMove} onDuplicate={onDuplicate} onDelete={onDelete} onInsert={onInsert} onOpenAi={onOpenAi} parentId={node.id} />
            )) : editing ? <div className="bnode-empty">Empty — add elements here</div> : null}
          </div>
        </>
      );
  }
}
