"use client";

import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  slug: string;
  name: string;
  variant?: "icon" | "full";
  className?: string;
}

export function ShareButton({ slug, name, variant = "full", className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const url = typeof window !== "undefined" ? `${window.location.origin}/products/${slug}` : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: name, url });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  if (variant === "icon") {
    return (
      <div className="relative" style={{ position: "relative" }}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof navigator.share === "function") {
              handleNativeShare();
            } else {
              setOpen((o) => !o);
            }
          }}
          aria-label="Share"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition-all hover:scale-110 hover:text-ink"
        >
          <Share2 className="h-[18px] w-[18px]" />
        </button>
        {open && (
          <div
            className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-xl border border-ink/10 bg-paper shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                handleCopy();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-ink/80 hover:bg-ink/5"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof navigator.share === "function") {
          handleNativeShare();
        } else {
          handleCopy();
        }
      }}
      className={cn(
        "flex items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3.5 text-xs font-medium uppercase tracking-wide-2 text-ink/80 transition-all hover:border-ink/40",
        className
      )}
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
