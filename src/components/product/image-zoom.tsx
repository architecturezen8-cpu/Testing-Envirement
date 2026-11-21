"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageZoomProps {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}

export function ImageZoom({ src, alt, sizes, priority }: ImageZoomProps) {
  const [zoomed, setZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-cream",
        zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
      )}
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
      onMouseMove={handleMove}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn(
          "object-cover transition-transform duration-300 ease-out",
          zoomed ? "scale-[2]" : "scale-100"
        )}
        style={
          zoomed
            ? { transformOrigin: `${position.x}% ${position.y}%` }
            : undefined
        }
      />
      {/* Zoom hint badge */}
      <div className={cn(
        "pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-[10px] uppercase tracking-wide-2 text-paper backdrop-blur transition-opacity duration-300",
        zoomed ? "opacity-0" : "opacity-100"
      )}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M21 21l-4-4M11 8v6M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        Hover to zoom
      </div>
    </div>
  );
}
