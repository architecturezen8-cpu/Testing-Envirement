"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronRight, PackageSearch } from "lucide-react";

interface Variant {
  size: string;
  color: string;
  stock: number;
}

interface StockProduct {
  id: number;
  name: string;
  slug: string;
  category: string;
  price: number;
  stock: number;
  inStock: boolean;
  sizes: string[];
  colors: { name: string; value: string }[];
  image: string | null;
  variants: Variant[];
}

export default function StockPreviewPage() {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setCategories(d.map((c: { name: string }) => c.name));
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedCategory
      ? `/api/admin/stock-overview?category=${encodeURIComponent(selectedCategory)}`
      : "/api/admin/stock-overview";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium text-stone-950">
          Stock Preview
        </h1>
        <p className="mt-1 text-stone-500">
          Quick overview of inventory across all products, sizes and colors.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-surface p-5">
          <p className="text-xs uppercase tracking-wide text-stone-500">Products</p>
          <p className="mt-1 font-serif text-2xl font-medium text-stone-950">{products.length}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-surface p-5">
          <p className="text-xs uppercase tracking-wide text-stone-500">Total stock</p>
          <p className="mt-1 font-serif text-2xl font-medium text-stone-950">{totalStock}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs uppercase tracking-wide text-amber-600">Low stock</p>
          <p className="mt-1 font-serif text-2xl font-medium text-amber-700">{lowStock}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-xs uppercase tracking-wide text-red-600">Out of stock</p>
          <p className="mt-1 font-serif text-2xl font-medium text-red-700">{outOfStock}</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedCategory("")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === ""
              ? "bg-stone-950 text-white"
              : "border border-stone-200 text-stone-600 hover:bg-stone-100"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === c
                ? "bg-stone-950 text-white"
                : "border border-stone-200 text-stone-600 hover:bg-stone-100"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Products list */}
      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-stone-200" />
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <PackageSearch className="mx-auto h-10 w-10 text-stone-300" />
          <p className="mt-3 text-sm text-stone-500">No products in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const isOpen = expanded.has(p.id);
            const variantsByColor = p.variants.reduce<Record<string, Variant[]>>((acc, v) => {
              if (!acc[v.color]) acc[v.color] = [];
              acc[v.color].push(v);
              return acc;
            }, {});

            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-surface"
              >
                {/* Product row */}
                <button
                  onClick={() => toggleExpand(p.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-stone-50"
                >
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900">{p.name}</p>
                    <p className="text-xs text-stone-500">{p.category} · {p.sizes.length} sizes · {p.colors.length} colors</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        p.stock === 0
                          ? "bg-red-100 text-red-700"
                          : p.stock <= 5
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {p.stock === 0 ? "Out" : `${p.stock} units`}
                    </span>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-stone-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-stone-400" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-stone-100 bg-stone-50/50 p-5">
                    {Object.entries(variantsByColor).length === 0 ? (
                      <p className="text-sm text-stone-400">No variant data. Set stock in the product editor.</p>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(variantsByColor).map(([colorName, vList]) => {
                          const colorInfo = p.colors.find((c) => c.name === colorName);
                          return (
                            <div key={colorName}>
                              <div className="mb-2 flex items-center gap-2">
                                <span
                                  className="h-4 w-4 rounded-full border border-stone-300"
                                  style={{ backgroundColor: colorInfo?.value ?? "#ccc" }}
                                />
                                <span className="text-xs font-medium uppercase tracking-wide text-stone-600">{colorName}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {vList.map((v) => (
                                  <div
                                    key={`${v.size}-${v.color}`}
                                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${
                                      v.stock === 0
                                        ? "border-red-200 bg-red-50"
                                        : v.stock <= 3
                                          ? "border-amber-200 bg-amber-50"
                                          : "border-stone-200 bg-surface"
                                    }`}
                                  >
                                    <span className="font-medium text-stone-700">{v.size}</span>
                                    <span
                                      className={`text-xs ${
                                        v.stock === 0
                                          ? "text-red-500"
                                          : v.stock <= 3
                                            ? "text-amber-600"
                                            : "text-stone-500"
                                      }`}
                                    >
                                      {v.stock}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-bronze hover:underline"
                    >
                      Edit stock →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
