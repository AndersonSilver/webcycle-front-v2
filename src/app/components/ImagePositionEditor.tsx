import { useCallback, useRef, useState } from "react";
import { Move } from "lucide-react";

interface ImagePositionEditorProps {
  src: string;
  alt?: string;
  /** CSS object-position, e.g. "50% 40%" */
  position: string;
  onChange: (position: string) => void;
  className?: string;
}

function parsePosition(value: string): { x: number; y: number } {
  const match = value?.match(/([\d.]+)%\s+([\d.]+)%/);
  if (!match) return { x: 50, y: 50 };
  return {
    x: Math.min(100, Math.max(0, parseFloat(match[1]))),
    y: Math.min(100, Math.max(0, parseFloat(match[2]))),
  };
}

function formatPosition(x: number, y: number): string {
  return `${Math.round(x)}% ${Math.round(y)}%`;
}

/**
 * Preview com object-cover onde o usuário arrasta para ajustar o enquadramento.
 */
export function ImagePositionEditor({
  src,
  alt = "Preview",
  position,
  onChange,
  className = "",
}: ImagePositionEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const posRef = useRef(parsePosition(position));
  const [isDragging, setIsDragging] = useState(false);

  posRef.current = parsePosition(position);

  const applyDelta = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      const last = lastPoint.current;
      if (!el || !last) return;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      // Arrastar a imagem para baixo revela o topo (diminui o % vertical)
      const dx = ((clientX - last.x) / rect.width) * 100;
      const dy = ((clientY - last.y) / rect.height) * 100;

      const nextX = Math.min(100, Math.max(0, posRef.current.x - dx));
      const nextY = Math.min(100, Math.max(0, posRef.current.y - dy));
      posRef.current = { x: nextX, y: nextY };
      lastPoint.current = { x: clientX, y: clientY };
      onChange(formatPosition(nextX, nextY));
    },
    [onChange]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    setIsDragging(true);
    lastPoint.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    e.preventDefault();
    applyDelta(e.clientX, e.clientY);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    lastPoint.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const { x, y } = parsePosition(position);

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        ref={containerRef}
        className={`relative w-full h-40 sm:h-48 lg:h-56 overflow-hidden rounded-lg border border-gray-600 bg-gray-900 select-none touch-none ${
          isDragging ? "cursor-grabbing ring-2 ring-blue-500" : "cursor-grab"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: `${x}% ${y}%` }}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 flex items-center gap-2 pointer-events-none">
          <Move className="w-3.5 h-3.5 text-white/90 shrink-0" />
          <span className="text-xs text-white/90">
            Arraste para enquadrar · {formatPosition(x, y)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange("50% 50%")}
          className="text-xs px-2.5 py-1 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
        >
          Centralizar
        </button>
        <button
          type="button"
          onClick={() => onChange("50% 20%")}
          className="text-xs px-2.5 py-1 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
        >
          Priorizar topo
        </button>
        <button
          type="button"
          onClick={() => onChange("50% 80%")}
          className="text-xs px-2.5 py-1 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
        >
          Priorizar base
        </button>
      </div>
    </div>
  );
}
