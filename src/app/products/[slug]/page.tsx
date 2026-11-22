"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Star, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { StarRating } from "@/components/ui/star-rating";
import { ProductCard } from "@/components/product/product-card";
import { ReviewForm } from "@/components/product/review-form";
import { FavoriteButton } from "@/components/product/favorite-button";
import { ShareButton } from "@/components/product/share-button";
import { ImageZoom } from "@/components/product/image-zoom";
import { TicketCard } from "@/components/product/ticket-card";
import { useRecentlyViewed } from "@/components/product/recently-viewed-context";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/ui/animated-section";
import { formatPrice } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";
import type { Product, Review, ProductVariant } from "@/db/schema";

interface ProductDetailData {
  thumbnail?: string | null;
  product: Product & { collectionName: string | null; collectionSlug: string | null };
  reviews: Review[];
  variants: ProductVariant[];
}

function ProductPageInner() {
  const { slug } = useParams() as { slug: string };
  const { addItem } = useCart();
  const { items: recentItems, add: addRecent } = useRecentlyViewed();

  const [data, setData] = useState<ProductDetailData | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  // Event tickets: how many people a Family Pass covers (not every family is the same size)
  const [familySize, setFamilySize] = useState(4);
  // Event tickets: buyer picks any number with the "Custom" tier
  const [customQty, setCustomQty] = useState(5);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((res: ProductDetailData) => {
        setData(res);
        // Auto-select the first variant that has stock
        const vList = res.variants ?? [];
        const inStockVariant = vList.find((v) => v.stock > 0);
        if (inStockVariant) {
          setSelectedSize(inStockVariant.size);
          setSelectedColor(inStockVariant.color);
        } else {
          setSelectedSize(res.product.sizes[0] ?? "");
          const firstColor = res.product.colors?.[0];
          setSelectedColor(firstColor ? firstColor.name : "");
        }
        setSelectedImage(0);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // Track recently viewed
  useEffect(() => {
    if (data?.product) {
      addRecent({
        slug: data.product.slug,
        name: data.product.name,
        price: data.product.price,
        image: data.product.images[0] ?? "/images/hero.jpg",
        viewedAt: Date.now(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.product?.slug]);

  useEffect(() => {
    if (!data) return;
    fetch(`/api/products?category=${data.product.category}&limit=4`)
      .then((r) => r.json())
      .then((items: Product[]) => {
        setRelated(items.filter((p) => p.slug !== data.product.slug).slice(0, 4));
      })
      .catch(() => setRelated([]));
  }, [data]);

  const product = data?.product;
  const reviews = data?.reviews ?? [];
  const variants = data?.variants ?? [];
  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  // ---- Variant stock logic (simplified & robust) ----
  // Find the stock for the currently selected (size, color) combination
  const currentVariant = variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );
  const currentVariantStock = currentVariant?.stock ?? product?.stock ?? 0;
  const variantAvailable = currentVariantStock > 0;

  // Sizes that have stock across ANY color (for subtle indicator only, NOT disabled)
  const sizesWithStock = useMemo(() => {
    if (!variants.length) return new Set(product?.sizes ?? []);
    return new Set(variants.filter((v) => v.stock > 0).map((v) => v.size));
  }, [variants, product]);

  // Colors that have stock across ANY size (for subtle indicator only, NOT disabled)
  const colorsWithStock = useMemo(() => {
    if (!variants.length) return new Set((product?.colors ?? []).map((c) => c.name));
    return new Set(variants.filter((v) => v.stock > 0).map((v) => v.color));
  }, [variants, product]);

  // ---- Event tickets ----
  // Tickets have no colour dimension; the "size" list is really a set of
  // quantity tiers, and the total re-computes from the base price.
  const isTicket = product?.category === "Event Tickets";

  const ticketQty = useMemo(() => {
    if (!selectedSize) return 1;
    if (selectedSize.toLowerCase().startsWith("family")) return familySize;
    if (selectedSize.toLowerCase() === "custom") return customQty;
    const n = Number.parseInt(selectedSize.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [selectedSize, familySize, customQty]);

  const unitPrice = product?.price ?? 0;
  const ticketTotal = unitPrice * ticketQty;

  // Refetch reviews after a new one is submitted
  const refreshReviews = () => {
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((res: ProductDetailData) => setData(res))
      .catch(() => {});
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!variantAvailable) return;
    if (!selectedSize) return;
    // Tickets have no colour, so only the tier is required.
    if (!isTicket && !selectedColor) return;

    const label = isTicket
      ? selectedSize.toLowerCase().startsWith("family")
        ? `Family Pass (${familySize} people)`
        : selectedSize.toLowerCase() === "custom"
          ? `${customQty} tickets`
          : selectedSize
      : selectedSize;

    setAdding(true);
    addItem({
      productId: product.id,
      slug: product.slug,
      name: isTicket ? `${product.name} — ${label}` : product.name,
      price: isTicket ? ticketTotal : product.price,
      image: product.images[0] ?? "/images/hero.jpg",
      size: isTicket ? label : selectedSize,
      color: isTicket ? "—" : selectedColor,
      quantity: 1,
    });
    setTimeout(() => setAdding(false), 800);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="aspect-[3/4] animate-pulse rounded-2xl bg-cream" />
          <div className="space-y-6">
            <div className="h-8 w-2/3 animate-pulse rounded bg-cream" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-cream" />
            <div className="h-32 w-full animate-pulse rounded bg-cream" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-32 text-center lg:px-10">
        <h1 className="font-serif text-4xl font-light text-ink">Product not found</h1>
        <Link href="/shop" className="mt-6 inline-flex rounded-full bg-ink px-8 py-4 text-xs uppercase tracking-wide-2 text-paper transition-colors hover:bg-bronze">
          Back to shop
        </Link>
      </div>
    );
  }

  const colors = (product.colors as { name: string; value: string }[]) ?? [];

  return (
    <>
      <div className="relative z-20 mx-auto max-w-[1400px] px-6 pb-6 pt-8 lg:px-10">
        <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-wide-2 text-stone-500">
          <Link href="/" className="transition-colors hover:text-ink">Home</Link>
          <span className="text-stone-600">/</span>
          <Link href="/shop" className="transition-colors hover:text-ink">Shop</Link>
          <span className="text-stone-600">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>
      </div>

      <section className="mx-auto max-w-[1400px] px-6 pb-24 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Visual — tickets show a drawn ticket, everything else a gallery */}
          <AnimatedSection>
            {isTicket ? (
              <div className="space-y-6">
                <TicketCard
                  thumbnail={data.thumbnail ?? null}
                  eventTitle={product.name}
                  date={product.description.split("Event: ")[1]?.split("\n")[0] ?? "Date to be announced"}
                  venue={product.description.split("Venue: ")[1]?.split("\n")[0] ?? "College grounds"}
                  tier={selectedSize.startsWith("Family")
                    ? `Family · ${familySize}`
                    : selectedSize === "Custom"
                      ? `${customQty} tickets`
                      : selectedSize}
                  price={formatPrice(ticketTotal)}
                />
                <p className="text-center text-xs text-stone-500">
                  Show this reference at the gate — no printed ticket needed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <ImageZoom
                  src={product.images[selectedImage] ?? "/images/hero.jpg"}
                  alt={product.name}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`relative aspect-square overflow-hidden rounded-xl bg-cream transition-all ${
                          selectedImage === idx
                            ? "ring-2 ring-ink"
                            : "ring-1 ring-ink/15 hover:ring-ink/40"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`${product.name} view ${idx + 1}`}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </AnimatedSection>

          {/* Info */}
          <AnimatedSection delay={0.1}>
            <div className="flex flex-col lg:py-2">
              <div className="flex flex-wrap gap-2">
                {product.badge && (
                  <span className="rounded-full bg-ink px-3 py-1 text-[10px] font-medium uppercase tracking-wide-2 text-paper">
                    {product.badge}
                  </span>
                )}
                {product.offerActive && product.offerLabel && (
                  <span className="rounded-full bg-bronze px-3 py-1 text-[10px] font-medium uppercase tracking-wide-2 text-paper">
                    {product.offerLabel}
                  </span>
                )}
              </div>
              <h1 className="mt-4 font-serif text-4xl font-light leading-tight text-ink lg:text-5xl">
                {product.name}
              </h1>
              <div className="mt-3 flex items-center gap-3">
                <StarRating rating={averageRating} size={16} />
                <span className="text-sm text-stone-500">
                  {averageRating.toFixed(1)} · {reviews.length} reviews
                </span>
              </div>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-serif text-3xl text-ink">
                  {formatPrice(isTicket ? ticketTotal : product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && !isTicket && (
                  <span className="text-lg text-stone-400 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>

              {/* Ticket total — re-computes as the tier / family size changes */}
              {isTicket && (
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="text-stone-500">
                    {formatPrice(unitPrice)} × {ticketQty}
                  </span>
                  <span className="text-stone-300">=</span>
                  <span className="font-semibold text-ink">
                    {formatPrice(ticketTotal)}
                  </span>
                  {ticketQty > 1 && (
                    <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-medium text-accent-ink">
                      {ticketQty} tickets
                    </span>
                  )}
                </div>
              )}

              <p className="mt-6 max-w-prose leading-relaxed text-stone-600">
                {product.description}
              </p>

              {/* Colors — tickets have no colour dimension */}
              {!isTicket && colors.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wide-2 text-ink">
                      Colour
                    </p>
                    <span className="text-sm text-stone-500">{selectedColor}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {colors.map((color) => {
                      const hasAnyStock = variants.length === 0
                        ? true
                        : colorsWithStock.has(color.name);
                      return (
                        <button
                          key={color.name}
                          onClick={() => setSelectedColor(color.name)}
                          className={`group relative flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-ink/15 transition-all ${
                            selectedColor === color.name
                              ? "ring-2 ring-ink ring-offset-2 ring-offset-paper"
                              : "hover:ring-ink/40"
                          } ${!hasAnyStock ? "opacity-40" : ""}`}
                          aria-label={color.name}
                          title={hasAnyStock ? color.name : `${color.name} — low stock`}
                        >
                          <span
                            className="h-8 w-8 rounded-full"
                            style={{ backgroundColor: color.value }}
                          />
                          {!hasAnyStock && (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                              <span className="h-px w-[140%] rotate-45 bg-ink/30" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sizes — or quantity tiers for event tickets */}
              <div className="mt-7">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wide-2 text-ink">
                    {isTicket ? "Tickets" : "Size"}
                  </p>
                  {isTicket && (
                    <span className="text-sm text-stone-500">
                      {selectedSize.toLowerCase().startsWith("family")
                        ? `${familySize} people`
                        : selectedSize}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const hasAnyStock = variants.length === 0
                      ? true
                      : sizesWithStock.has(size);
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[3.5rem] flex-1 rounded-md border px-4 py-3 text-sm transition-all ${
                          selectedSize === size
                            ? "border-ink bg-ink text-paper"
                            : hasAnyStock
                              ? "border-ink/15 text-ink/80 hover:border-ink/40"
                              : "border-ink/10 text-stone-400 hover:border-ink/30"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Family Pass — how many people it should cover */}
              {isTicket && selectedSize.toLowerCase().startsWith("family") && (
                <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-5">
                  <p className="text-[11px] uppercase tracking-wide-2 text-ink">
                    How many people?
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Families come in all sizes — pick the number of tickets the
                    pass should cover.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[3, 4, 5, 6, 7, 8].map((n) => (
                      <button
                        key={n}
                        onClick={() => setFamilySize(n)}
                        className={`h-11 w-11 rounded-full border text-sm font-medium transition-all ${
                          familySize === n
                            ? "border-ink bg-ink text-paper"
                            : "border-ink/15 text-ink/80 hover:border-ink/40"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom amount — any number of tickets */}
              {isTicket && selectedSize.toLowerCase() === "custom" && (
                <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-5">
                  <p className="text-[11px] uppercase tracking-wide-2 text-ink">
                    How many tickets?
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Enter any number — the total updates as you type.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink/40"
                      aria-label="Fewer tickets"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={customQty}
                      onChange={(e) => {
                        const n = Number.parseInt(e.target.value, 10);
                        setCustomQty(Number.isFinite(n) && n > 0 ? Math.min(50, n) : 1);
                      }}
                      className="w-24 rounded-lg border border-ink/15 bg-paper px-4 py-2.5 text-center text-base font-medium tabular-nums text-ink outline-none focus:border-ink/40"
                    />
                    <button
                      onClick={() => setCustomQty((q) => Math.min(50, q + 1))}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink/40"
                      aria-label="More tickets"
                    >
                      +
                    </button>
                    <span className="text-sm text-stone-500">
                      {customQty === 1 ? "ticket" : "tickets"}
                    </span>
                  </div>
                </div>
              )}

              {/* School size guide — helps parents pick by grade, not by guesswork */}
              {!isTicket && (product.category === "Uniforms" || product.category === "Ties") && (
                <div className="mt-6 rounded-xl border border-ink/10 bg-cream/60 p-5">
                  <p className="text-[11px] uppercase tracking-wide-2 text-ink">
                    Which size do I need?
                  </p>
                  <ul className="mt-3 grid gap-1.5 text-[13px] text-stone-500 sm:grid-cols-2">
                    <li>Grade 1 – 2 · size 24–26</li>
                    <li>Grade 3 – 5 · size 28–30</li>
                    <li>Grade 6 – 9 · size 30–32</li>
                    <li>Grade 10 – 11 · size 32–34</li>
                    <li>Grade 12 – 13 · size 34–36</li>
                    <li>Staff &amp; old boys · size 36+</li>
                  </ul>
                </div>
              )}

              {/* Stock status — variant aware */}
              <div className="mt-7 flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    variantAvailable ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <p className="text-sm">
                  {variantAvailable ? (
                    <span className="text-stone-600">
                      <span className="font-medium text-ink">In stock</span>
                      {selectedSize && selectedColor && (
                        <>
                          {" "}— {selectedColor}, Size {selectedSize}:{" "}
                          {currentVariantStock <= 5 ? (
                            <span className="font-medium text-bronze">Only {currentVariantStock} left!</span>
                          ) : (
                            <span>{currentVariantStock} available</span>
                          )}
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="font-medium text-wine">
                      {selectedSize && selectedColor
                        ? `Out of stock — ${selectedColor}, Size ${selectedSize}`
                        : "Out of stock"}
                    </span>
                  )}
                </p>
              </div>

              {/* Ticket purchase summary */}
              {isTicket && (
                <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-wide-2 text-ink">
                      Order summary
                    </span>
                    <span className="text-[11px] uppercase tracking-wide-2 text-stone-500">
                      {selectedSize.startsWith("Family")
                        ? `Family Pass · ${familySize} people`
                        : selectedSize}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm text-stone-600">
                    <div className="flex justify-between">
                      <span>
                        {formatPrice(unitPrice)} × {ticketQty} {ticketQty === 1 ? "ticket" : "tickets"}
                      </span>
                      <span className="tabular-nums">{formatPrice(ticketTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gate collection</span>
                      <span className="text-green-700">Free</span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-ink/10 pt-3">
                    <span className="font-medium text-ink">Total to pay</span>
                    <span className="font-semibold tabular-nums text-ink">
                      {formatPrice(ticketTotal)}
                    </span>
                  </div>
                </div>
              )}

              {/* Quantity & Add — tickets skip the stepper, the tier is the quantity */}
              <div className={`mt-8 flex flex-col gap-3 sm:flex-row ${isTicket ? "sm:flex-row-reverse" : ""}`}>
                {!isTicket && (
                <div
                  className={`flex items-center justify-between rounded-full border border-ink/15 px-2 py-2 ${
                    !variantAvailable ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-bronze"
                    aria-label="Decrease quantity"
                    disabled={!variantAvailable}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-medium tabular-nums">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(currentVariantStock, q + 1))
                    }
                    className="flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-bronze"
                    aria-label="Increase quantity"
                    disabled={!variantAvailable || quantity >= currentVariantStock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                )}
                {variantAvailable ? (
                  <button
                    onClick={handleAddToCart}
                    disabled={adding}
                    className="flex-1 rounded-full bg-cta-accent py-4 text-xs font-semibold uppercase tracking-wide-2 text-accent-ink transition-all duration-500 hover:bg-cta-accent-hover disabled:opacity-70"
                  >
                    {adding
                      ? isTicket
                        ? "Added ✓"
                        : "Added ✓"
                      : isTicket
                        ? "Buy tickets"
                        : "Add to bag"}
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 cursor-not-allowed rounded-full border border-ink/20 py-4 text-xs font-medium uppercase tracking-wide-2 text-stone-500"
                  >
                    Sold out
                  </button>
                )}
              </div>

              {/* Favorite + Share */}
              <div className="mt-6 flex items-center gap-3">
                <FavoriteButton
                  variant="full"
                  slug={product.slug}
                  name={product.name}
                  price={product.price}
                  image={product.images[0] ?? "/images/hero.jpg"}
                />
                <ShareButton variant="full" slug={product.slug} name={product.name} />
              </div>

              {/* Trust badges */}
              <div className={`mt-10 grid grid-cols-3 gap-3 border-t border-ink/10 pt-8 text-center ${isTicket ? "hidden" : ""}`}>
                <div className="flex flex-col items-center gap-1.5">
                  <Truck className="h-5 w-5 text-bronze" />
                  <span className="text-[11px] uppercase tracking-wide-2 text-stone-500">Global shipping</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <RotateCcw className="h-5 w-5 text-bronze" />
                  <span className="text-[11px] uppercase tracking-wide-2 text-stone-500">30-day returns</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <ShieldCheck className="h-5 w-5 text-bronze" />
                  <span className="text-[11px] uppercase tracking-wide-2 text-stone-500">Quality promise</span>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Reviews */}
      <section className="border-t border-ink/10 bg-cream">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10 lg:py-24">
          <AnimatedSection>
            <div className="grid gap-12 lg:grid-cols-3 lg:gap-20">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <p className="text-xs uppercase tracking-wide-2 text-bronze">Customer reviews</p>
                <h2 className="mt-3 font-serif text-4xl font-light text-ink">
                  What people say
                </h2>
                <div className="mt-6 flex items-end gap-4">
                  <span className="font-serif text-6xl font-light text-ink">
                    {averageRating.toFixed(1)}
                  </span>
                  <div className="pb-2">
                    <StarRating rating={averageRating} size={18} />
                    <p className="mt-1 text-sm text-stone-500">
                      Based on {reviews.length} reviews
                    </p>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-2xl border border-ink/10 bg-paper p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-medium text-paper">
                            {review.author.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-serif text-base text-ink">
                                {review.author}
                              </p>
                              {review.verified && (
                                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-green-700">
                                  <BadgeCheck className="h-3 w-3" />
                                  Verified
                                </span>
                              )}
                            </div>
                            <StarRating
                              rating={review.rating}
                              size={13}
                              className="mt-0.5"
                            />
                          </div>
                        </div>
                        <span className="text-xs text-stone-400">
                          {new Date(review.createdAt ?? Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="mt-4 font-serif text-lg text-ink">
                        {review.title}
                      </h4>
                      <p className="mt-2 text-[15px] leading-relaxed text-stone-600">
                        {review.body}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Write a review */}
                {product && (
                  <div className="mt-8">
                    <ReviewForm slug={slug} onSubmitted={refreshReviews} />
                  </div>
                )}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Recently viewed */}
      {recentItems.filter((r) => r.slug !== product.slug).length > 0 && (
        <section className="border-t border-ink/10 bg-cream">
          <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-10">
            <h2 className="mb-8 font-serif text-3xl font-light text-ink">Recently viewed</h2>
            <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar">
              {recentItems
                .filter((r) => r.slug !== product.slug)
                .slice(0, 6)
                .map((r) => (
                  <Link key={r.slug} href={`/products/${r.slug}`} className="group w-40 flex-shrink-0">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-paper">
                      <Image src={r.image} alt={r.name} fill sizes="160px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <h3 className="mt-2.5 font-serif text-sm text-ink line-clamp-1">{r.name}</h3>
                    <p className="text-xs text-stone-500">{formatPrice(r.price)}</p>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10 lg:py-24">
          <AnimatedSection>
            <div className="mb-10">
              <p className="text-xs uppercase tracking-wide-2 text-bronze">Complete the look</p>
              <h2 className="mt-2 font-serif text-4xl font-light text-ink">
                Students also bought
              </h2>
            </div>
          </AnimatedSection>
          <StaggerContainer className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <StaggerItem key={p.id} className="h-full">
                <ProductCard product={p} className="h-full" />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      )}

      {/* Sticky add-to-cart bar (mobile) */}
      {product.inStock && variantAvailable && (
        <div className="sticky bottom-0 z-30 border-t border-ink/10 bg-paper/95 px-6 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-serif text-sm text-ink line-clamp-1">{product.name}</p>
              <p className="text-xs text-stone-500">
                {formatPrice(isTicket ? ticketTotal : product.price)}
                {isTicket ? ` · ${selectedSize}` : ` · ${selectedColor} / ${selectedSize}`}
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-xs font-medium uppercase tracking-wide-2 text-paper transition-colors hover:bg-bronze"
            >
              {adding ? "✓" : "Add"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="pt-24 text-center">Loading product...</div>}>
      <ProductPageInner />
    </Suspense>
  );
}
