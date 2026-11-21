"use client";

import Image from "next/image";
import Link from "next/link";
import { useFavorites } from "@/components/favorites/favorites-context";
import { formatPrice } from "@/lib/utils";
import { Heart, X } from "lucide-react";

export default function FavoritesPage() {
  const { favorites, remove, count } = useFavorites();

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 fill-wine text-wine" />
        <h1 className="font-serif text-4xl font-light text-ink">Favorites</h1>
      </div>
      <p className="mt-2 text-sm text-stone-500">
        {count === 0
          ? "Your saved items will appear here."
          : `${count} ${count === 1 ? "item" : "items"} saved`}
      </p>

      {favorites.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-ink/20 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream">
            <Heart className="h-7 w-7 text-stone-400" />
          </div>
          <div>
            <p className="font-serif text-xl text-ink">No favorites yet</p>
            <p className="mt-1 text-sm text-stone-500">
              Tap the heart icon on any product to save it here.
            </p>
          </div>
          <Link
            href="/shop"
            className="mt-2 rounded-full bg-ink px-8 py-4 text-xs uppercase tracking-wide-2 text-paper transition-colors hover:bg-bronze"
          >
            Browse the collection
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.map((item) => (
            <div key={item.slug} className="group relative">
              <button
                onClick={() => remove(item.slug)}
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-paper/90 text-stone-500 backdrop-blur transition-colors hover:bg-wine hover:text-paper"
                aria-label="Remove from favorites"
              >
                <X className="h-4 w-4" />
              </button>
              <Link href={`/products/${item.slug}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-cream">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-3 font-serif text-base text-ink">{item.name}</h3>
                <p className="text-sm text-stone-600">{formatPrice(item.price)}</p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
