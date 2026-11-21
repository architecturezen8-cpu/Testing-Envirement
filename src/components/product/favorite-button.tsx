"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useFavorites } from "@/components/favorites/favorites-context";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  slug: string;
  name: string;
  price: number;
  image: string;
  variant?: "icon" | "full";
  className?: string;
}

export function FavoriteButton({
  slug,
  name,
  price,
  image,
  variant = "icon",
  className,
}: FavoriteButtonProps) {
  const { toggle, isFavorite } = useFavorites();
  const [bumped, setBumped] = useState(false);
  const fav = isFavorite(slug);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle({ slug, name, price, image, addedAt: Date.now() });
    setBumped(true);
    setTimeout(() => setBumped(false), 400);
  };

  if (variant === "full") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-xs font-medium uppercase tracking-wide-2 transition-all",
          fav
            ? "border-wine text-wine"
            : "border-ink/15 text-ink/80 hover:border-ink/40",
          bumped && "scale-110",
          className
        )}
      >
        <Heart className={cn("h-4 w-4", fav && "fill-wine")} />
        {fav ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Add to favorites"
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-110",
        fav ? "text-wine" : "text-ink/60 hover:text-ink",
        bumped && "scale-125",
        className
      )}
    >
      <Heart className={cn("h-[18px] w-[18px]", fav && "fill-wine")} />
    </button>
  );
}
