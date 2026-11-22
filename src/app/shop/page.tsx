"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { QuickView } from "@/components/product/quick-view";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/ui/animated-section";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/db/schema";
import type { Collection } from "@/db/schema";

const genders = ["Men", "Women", "Unisex"];
const priceRanges = [
  { label: "Under $150", min: 0, max: 14999 },
  { label: "$150 – $300", min: 15000, max: 29999 },
  { label: "$300 – $500", min: 30000, max: 49999 },
  { label: "$500+", min: 50000, max: 10000000 },
];
const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

function ShopPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const filters = useMemo(
    () => ({
      category: searchParams.get("category") ?? "",
      gender: searchParams.get("gender") ?? "",
      collection: searchParams.get("collection") ?? "",
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
      sort: searchParams.get("sort") ?? "featured",
      q: searchParams.get("q") ?? "",
    }),
    [searchParams]
  );

  useEffect(() => {
    fetch("/api/collections")
      .then((r) => r.json())
      .then(setCollections)
      .catch(() => setCollections([]));
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setCategories(d.map((c: { name: string }) => c.name));
      })
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, [filters]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  const activeFilters = [
    filters.category && { key: "category", label: filters.category },
    filters.gender && { key: "gender", label: filters.gender },
    filters.collection && {
      key: "collection",
      label:
        collections.find((c) => c.slug === filters.collection)?.name ??
        filters.collection,
    },
    filters.minPrice && {
      key: "price",
      label: `${formatPrice(Number(filters.minPrice))} – ${formatPrice(
        Number(filters.maxPrice)
      )}`,
    },
  ].filter(Boolean) as { key: string; label: string }[];

  const FilterPanel = () => (
    <div className="space-y-7">
      {/* --- Category --- */}
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wide-2 text-ink">
          Category
        </h3>
        <div className="mt-3 space-y-1.5">
          {categories.map((c: string) => {
            const active = filters.category === c;
            return (
              <button
                key={c}
                onClick={() => updateFilter("category", active ? "" : c)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-ink/8 font-medium text-ink"
                    : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                <span>{c}</span>
                {active && <X className="h-3.5 w-3.5 text-stone-400" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-ink/8" />

      {/* --- Who it is for --- */}
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wide-2 text-ink">
          Who&apos;s it for
        </h3>
        <div className="mt-3 space-y-1.5">
          {genders.map((g: string) => {
            const active = filters.gender === g;
            const label =
              g === "Boys"
                ? "Boys’ uniform"
                : g === "Girls"
                  ? "Girls’ uniform"
                  : "All students";
            return (
              <label
                key={g}
                className="flex cursor-pointer items-center gap-3 text-sm text-ink/70 transition-colors hover:text-ink"
              >
                <input
                  type="radio"
                  name="who"
                  checked={active}
                  onChange={() => updateFilter("gender", active ? "" : g)}
                  className="h-4 w-4 accent-stone-950"
                />
                {label}
              </label>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-ink/8" />

      {/* --- Price --- */}
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wide-2 text-ink">
          Price
        </h3>
        <div className="mt-3 space-y-1.5">
          {priceRanges.map((range) => {
            const active =
              filters.minPrice === String(range.min) &&
              filters.maxPrice === String(range.max);
            return (
              <button
                key={range.label}
                onClick={() =>
                  active
                    ? (updateFilter("minPrice", ""), updateFilter("maxPrice", ""))
                    : (updateFilter("minPrice", String(range.min)),
                      updateFilter("maxPrice", String(range.max)))
                }
                className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-ink/8 font-medium text-ink"
                    : "text-ink/60 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-ink/8" />

      {/* --- Group --- */}
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wide-2 text-ink">
          Group
        </h3>
        <div className="mt-3 space-y-1.5">
          {collections.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-3 text-sm text-ink/70 transition-colors hover:text-ink"
            >
              <input
                type="radio"
                name="collection"
                checked={filters.collection === c.slug}
                onChange={() => updateFilter("collection", c.slug)}
                className="h-4 w-4 accent-stone-950"
              />
              {c.name}
            </label>
          ))}
          <button
            onClick={() => updateFilter("collection", "")}
            className="mt-1 text-xs text-bronze underline-offset-2 hover:underline"
          >
            Clear group
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
    <section className="border-b border-ink/10 bg-cream">
      <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10 lg:py-16">
        <AnimatedSection>
          <div>
            <p className="text-xs uppercase tracking-wide-2 text-bronze">
              Shop
            </p>
            <h1 className="mt-2 font-serif text-4xl font-light text-ink lg:text-5xl">
              All Products
            </h1>
          </div>
        </AnimatedSection>
      </div>
    </section>
    <div className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Desktop filters */}
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <FilterPanel />
        </aside>

        {/* Mobile filter toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileFiltersOpen((s) => !s)}
            className="flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-xs font-medium uppercase tracking-wide-2 text-ink"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
          {mobileFiltersOpen && (
            <div className="mt-4 rounded-2xl border border-ink/10 bg-cream p-6">
              <FilterPanel />
            </div>
          )}
        </div>

        <section className="flex-1">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-sm text-stone-500">
              {loading ? "Loading..." : <><span className="text-ink">{products.length}</span> {products.length === 1 ? "piece" : "pieces"}</>}
            </p>
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => updateFilter("sort", e.target.value)}
                className="appearance-none rounded-full border border-ink/15 bg-paper py-2 pl-4 pr-10 text-xs font-medium uppercase tracking-wide-2 text-ink outline-none focus:border-ink/40"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {activeFilters.map((f) => (
                <button
                  key={f.key + f.label}
                  onClick={() => {
                    if (f.key === "price") {
                      updateFilter("minPrice", "");
                      updateFilter("maxPrice", "");
                    } else {
                      updateFilter(f.key, "");
                    }
                  }}
                  className="flex items-center gap-1 rounded-full bg-ink/8 px-3 py-1 text-xs font-medium text-ink/80"
                >
                  {f.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-bronze underline-offset-2 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-2xl bg-cream"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 py-24 text-center">
              <p className="text-ink/70">No products match your filters.</p>
              <button
                onClick={clearFilters}
                className="mt-3 rounded-full bg-ink px-6 py-3 text-xs font-medium uppercase tracking-wide-2 text-paper transition-colors hover:bg-bronze"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <StaggerContainer className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} onQuickView={setQuickViewProduct} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </section>
      </div>
      </div>

      <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="pt-24 text-center">Loading shop...</div>}>
      <ShopPageInner />
    </Suspense>
  );
}
