"use client";

import Image from "next/image";
import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";
import { StarRating } from "@/components/ui/star-rating";
import { FavoriteButton } from "@/components/product/favorite-button";
import type { Product } from "@/db/schema";

interface ProductCardProps {
  product: Product;
  className?: string;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ product, className, onQuickView }: ProductCardProps) {
  const firstImage = product.images[0] ?? "/images/hero.jpg";
  const secondImage = product.images[1] ?? firstImage;
  const onSale =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const inStock = product.inStock !== false;
  const stock = (product as { stock?: number }).stock ?? (inStock ? 99 : 0);
  const lowStock = inStock && stock > 0 && stock <= 5;

  return (
    <article className={cn("group flex h-full flex-col", !inStock && "opacity-90", className)}>
      <Link href={`/products/${product.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-navy bg-sheen-light ring-1 ring-inset ring-panel transition-shadow duration-700 group-hover:shadow-navy-hover">
          {/* Badges */}
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
            {product.badge && (
              <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide-2 text-paper">
                {product.badge}
              </span>
            )}
            {onSale && (
              <span className="rounded-full bg-wine px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide-2 text-paper">
                Sale
              </span>
            )}
            {product.offerActive && product.offerLabel && (
              <span className="rounded-full bg-bronze px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide-2 text-paper">
                {product.offerLabel}
              </span>
            )}
            {!inStock && (
              <span className="rounded-full bg-stone-900/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide-2 text-white">
                Sold out
              </span>
            )}
          </div>

          {/* Favorite button */}
          <div className="absolute right-3 top-3 z-10">
            <FavoriteButton
              slug={product.slug}
              name={product.name}
              price={product.price}
              image={firstImage}
            />
          </div>

          {/* Image swap on hover */}
          <Image
            src={firstImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn(
              "object-cover transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]",
              inStock && "group-hover:opacity-0",
              !inStock && "grayscale"
            )}
          />
          <Image
            src={secondImage}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn(
              "object-cover opacity-0 transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]",
              inStock && "group-hover:opacity-100",
              !inStock && "grayscale"
            )}
          />

          {/* Out of stock overlay */}
          {!inStock && (
            <div className="pointer-events-none absolute inset-0 bg-ink/20" />
          )}

          {/* Quick view bar */}
          {inStock && (
            <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <span className="block flex-1 rounded-full bg-paper/95 py-3 text-center text-[11px] font-medium uppercase tracking-wide-2 text-ink backdrop-blur">
                  View product
                </span>
                {onQuickView && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onQuickView(product);
                    }}
                    className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-ink/90 text-paper backdrop-blur transition-colors hover:bg-ink"
                    aria-label="Quick view"
                    title="Quick view"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /></svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide-2 text-stone-500">
              {product.gender} · {product.category}
            </p>
            <h3 className={cn(
              "mt-1 font-serif text-[17px] leading-snug text-ink transition-colors group-hover:text-bronze line-clamp-2 min-h-[2.6rem]",
              !inStock && "text-stone-500"
            )}>
              {product.name}
            </h3>
          </div>
          <div className="shrink-0 text-right">
            <p className={cn("text-sm tabular-nums", inStock ? "text-ink" : "text-stone-500")}>
              {formatPrice(product.price)}
            </p>
            {onSale && (
              <p className="text-xs tabular-nums text-stone-400 line-through">
                {formatPrice(product.compareAtPrice!)}
              </p>
            )}
          </div>
        </div>
        <div className="mt-auto flex items-center gap-2 pt-2">
          {inStock ? (
            <>
              <StarRating rating={Number(product.rating ?? 0)} size={12} />
              <span className="text-xs text-stone-400">({product.reviewCount})</span>
              {lowStock && (
                <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-bronze">
                  Only {stock} left
                </span>
              )}
            </>
          ) : (
            <span className="text-[11px] uppercase tracking-wide-2 text-stone-500">
              Currently unavailable
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
