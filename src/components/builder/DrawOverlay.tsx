import React, { useRef, useEffect, useState } from "react";
import { X, Trash2, Check } from "lucide-react";

interface DrawOverlayProps {
  isActive: boolean;
  onClose: () => void;
}

export function DrawOverlay({ isActive, onClose }: DrawOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#f97316"); // default orange
  const [lineWidth, setLineWidth] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [isActive]);

  if (!isActive) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="fixed inset-0 z-30 pointer-events-auto cursor-crosshair">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="w-full h-full block bg-black/10"
      />

      {/* Floating Draw Bar */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-[#1c1917]/95 backdrop-blur-md border border-stone-800 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl">
        <span className="text-xs font-semibold text-stone-300">✏️ Pen Draw Mode</span>
        <div className="flex items-center gap-1.5 border-l border-stone-800 pl-3">
          {["#f97316", "#eab308", "#38bdf8", "#ef4444", "#ffffff"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border transition ${
                color === c ? "scale-125 border-white ring-2 ring-orange-500" : "border-stone-700"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 border-l border-stone-800 pl-3 text-xs text-stone-400">
          <span>Width:</span>
          {[2, 4, 8].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setLineWidth(w)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                lineWidth === w ? "bg-orange-600 text-white" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
              }`}
            >
              {w}px
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 border-l border-stone-800 pl-3">
          <button
            type="button"
            onClick={clearCanvas}
            title="Clear all drawings"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <Trash2 size={14} />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Done drawing"
            className="px-3 py-1 rounded-full bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1 transition"
          >
            <Check size={13} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
