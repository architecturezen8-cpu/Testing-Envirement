"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-context";
import type { Product } from "@/db/schema";

interface QuickViewProps {
  product: Product | null;
  onClose: () => void;
}

export function QuickView({ product, onClose }: QuickViewProps) {
  const { addItem } = useCart();
  const [imageIdx, setImageIdx] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product) {
      setImageIdx(0);
      setSize(product.sizes[0] ?? "");
      const c = (product.colors as { name: string; value: string }[])?.[0];
      setColor(c?.name ?? "");
      setAdded(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [product]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleAdd = () => {
    if (!product || !size) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? "/images/hero.jpg",
      size,
      color,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-paper shadow-2xl sm:flex-row"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-paper/80 text-ink backdrop-blur transition-colors hover:bg-ink hover:text-paper"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Gallery */}
            <div className="relative flex-shrink-0 sm:w-1/2">
              <div className="relative aspect-[4/5] w-full bg-cream sm:h-full">
                <Image
                  src={product.images[imageIdx] ?? product.images[0]}
                  alt={product.name}
                  fill
                  sizes="50vw"
                  className="object-cover"
                />
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImageIdx((i) => (i === 0 ? product.images.length - 1 : i - 1))}
                      className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-paper/80 text-ink backdrop-blur hover:bg-paper"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setImageIdx((i) => (i === product.images.length - 1 ? 0 : i + 1))}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-paper/80 text-ink backdrop-blur hover:bg-paper"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col overflow-y-auto p-6 lg:p-8">
              <p className="text-[10px] uppercase tracking-wide-2 text-stone-500">
                {product.gender} · {product.category}
              </p>
              <h2 className="mt-1.5 font-serif text-2xl font-light text-ink lg:text-3xl">{product.name}</h2>

              <div className="mt-2 flex items-center gap-3">
                <StarRating rating={Number(product.rating ?? 0)} size={14} />
                <span className="text-xs text-stone-500">({product.reviewCount})</span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-2xl text-ink">{formatPrice(product.price)}</span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-sm text-stone-400 line-through">{formatPrice(product.compareAtPrice)}</span>
                )}
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-stone-600">
                {product.description}
              </p>

              {/* Colors */}
              {product.colors && (product.colors as { name: string; value: string }[]).length > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-wide-2 text-stone-500">Colour: {color}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(product.colors as { name: string; value: string }[]).map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setColor(c.name)}
                        className={`h-9 w-9 rounded-full ring-1 ring-ink/15 transition-all ${
                          color === c.name ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "hover:ring-ink/40"
                        }`}
                        style={{ backgroundColor: c.value }}
                        aria-label={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-wide-2 text-stone-500">Size: {size}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`min-w-[2.5rem] rounded-md border px-3 py-2 text-sm transition-all ${
                          size === s ? "border-ink bg-ink text-paper" : "border-ink/15 text-ink/80 hover:border-ink/40"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto flex flex-col gap-2 pt-6">
                <button
                  onClick={handleAdd}
                  disabled={!product.inStock || !size || added}
                  className="w-full rounded-full bg-cta-accent py-3.5 text-xs font-semibold uppercase tracking-wide-2 text-accent-ink transition-all duration-500 hover:bg-cta-accent-hover disabled:opacity-60"
                >
                  {added ? "Added ✓" : product.inStock ? "Add to bag" : "Sold out"}
                </button>
                <Link
                  href={`/products/${product.slug}`}
                  onClick={onClose}
                  className="w-full rounded-full border border-ink/15 py-3.5 text-center text-xs font-medium uppercase tracking-wide-2 text-ink transition-colors hover:bg-ink/5"
                >
                  View full details
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
