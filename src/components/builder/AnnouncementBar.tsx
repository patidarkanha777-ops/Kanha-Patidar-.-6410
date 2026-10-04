import React from "react";
import { Sparkles, X, ArrowRight } from "lucide-react";

interface AnnouncementBarProps {
  visible: boolean;
  onClose: () => void;
  text?: string;
  badge?: string;
  linkText?: string;
  linkUrl?: string;
  backgroundColor?: string;
  textColor?: string;
}

export function AnnouncementBar({
  visible,
  onClose,
  text = "🎉 Special Launch Offer: Get 50% Off All Annual Plans Today!",
  badge = "LIMITED DEAL",
  linkText = "Claim Deal",
  linkUrl = "#",
  backgroundColor = "linear-gradient(90deg, #ea580c 0%, #d97706 50%, #f59e0b 100%)",
  textColor = "#ffffff",
}: AnnouncementBarProps) {
  if (!visible) return null;

  return (
    <div
      className="relative z-30 w-full py-2.5 px-4 text-xs font-semibold flex items-center justify-between shadow-md transition-all duration-300"
      style={{ background: backgroundColor, color: textColor }}
    >
      <div className="flex-1 flex items-center justify-center gap-2.5 text-center flex-wrap">
        <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-bold tracking-wider uppercase border border-white/20">
          {badge}
        </span>
        <span className="font-medium">{text}</span>
        {linkText && (
          <a
            href={linkUrl}
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-85 font-bold transition ml-1"
          >
            <span>{linkText}</span>
            <ArrowRight size={12} />
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-md hover:bg-black/20 text-white/90 hover:text-white transition shrink-0 ml-2"
        title="Dismiss announcement"
      >
        <X size={15} />
      </button>
    </div>
  );
}
