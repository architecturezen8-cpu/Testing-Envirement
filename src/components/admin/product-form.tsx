"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Plus, ImageIcon } from "lucide-react";
import type { Product, Collection } from "@/db/schema";

interface ProductFormProps {
  product?: Product;
  collections: Collection[];
}

type ColorOption = { name: string; value: string };

const emptyProduct: Partial<Product> = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  compareAtPrice: null,
  category: "Clothing",
  gender: "Unisex",
  sizes: [],
  colors: [],
  images: [],
  collectionId: null,
  badge: "",
  inStock: true,
  stock: 0,
  offerActive: false,
  offerLabel: "",
};

export function ProductForm({ product, collections }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;
  const [form, setForm] = useState<Partial<Product>>(emptyProduct);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Inline input state for adding sizes/colors (replaces prompt() which is blocked in iframes)
  const [sizeInput, setSizeInput] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorValue, setColorValue] = useState("#000000");

  // Dynamic categories fetched from API
  const [categoryList, setCategoryList] = useState<string[]>(["Clothing", "Shoes"]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setCategoryList(d.map((c: { name: string }) => c.name));
        }
      })
      .catch(() => {});
  }, []);

  // Variant stock state — keyed by `${size}__${color}` so values persist when
  // sizes/colors are rearranged. This is the single source of truth for stock.
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (product) {
      setForm({
        ...product,
        colors: (product.colors ?? []) as ColorOption[],
        images: product.images ?? [],
      });
      // Fetch existing variant stock for this product
      fetch(`/api/admin/products/${product.id}/variants`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const map: Record<string, number> = {};
            for (const v of data) {
              map[`${v.size}__${v.color}`] = v.stock ?? 0;
            }
            setVariantStocks(map);
          }
        })
        .catch(() => {});
    }
  }, [product]);

  // The variant grid is DERIVED from the live form sizes × colors,
  // so it updates instantly when sizes/colors are added or removed.
  const formSizes = form.sizes ?? [];
  const formColors = (form.colors ?? []) as ColorOption[];

  const getVariantStock = (size: string, color: string) =>
    variantStocks[`${size}__${color}`] ?? 0;

  const setVariantStock = (size: string, color: string, stock: number) => {
    setVariantStocks((prev) => ({
      ...prev,
      [`${size}__${color}`]: Math.max(0, stock),
    }));
  };

  // Live total stock preview
  const totalVariantStock = useMemo(() => {
    let total = 0;
    for (const size of formSizes) {
      for (const color of formColors) {
        total += getVariantStock(size, color.name);
      }
    }
    return total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formSizes, formColors, variantStocks]);

  const setField = <K extends keyof Product>(key: K, value: Product[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  // Images — always ensure at least one editable field visible
  const visibleImages = form.images && form.images.length > 0 ? form.images : [""];
  const updateImage = (idx: number, value: string) => {
    setForm((f) => {
      const arr = [...(f.images && f.images.length > 0 ? f.images : [""])];
      arr[idx] = value;
      return { ...f, images: arr };
    });
  };
  const addImage = () =>
    setForm((f) => ({ ...f, images: [...(f.images ?? []), ""] }));
  const removeImage = (idx: number) => {
    setForm((f) => ({
      ...f,
      images: (f.images ?? []).filter((_, i) => i !== idx),
    }));
  };

  const addSize = () => {
    const newSize = sizeInput.trim();
    if (newSize && !(form.sizes ?? []).includes(newSize)) {
      setForm((f) => ({ ...f, sizes: [...(f.sizes ?? []), newSize] }));
      setSizeInput("");
    }
  };
  const removeSize = (idx: number) => {
    setForm((f) => ({ ...f, sizes: f.sizes?.filter((_, i) => i !== idx) ?? [] }));
  };

  const addColor = () => {
    const name = colorName.trim();
    const value = colorValue.trim();
    if (name && value) {
      const existing = (form.colors ?? []) as ColorOption[];
      if (!existing.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
        setForm((f) => ({
          ...f,
          colors: [...((f.colors ?? []) as ColorOption[]), { name, value }],
        }));
        setColorName("");
        setColorValue("#000000");
      }
    }
  };
  const removeColor = (idx: number) => {
    setForm((f) => ({
      ...f,
      colors: ((f.colors ?? []) as ColorOption[]).filter((_, i) => i !== idx),
    }));
  };

  const generateSlug = () => {
    if (!form.name) return;
    setForm((f) => ({
      ...f,
      slug: f.name!.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Clean images — remove empty strings
    const cleanedImages = (form.images ?? [])
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (cleanedImages.length === 0) {
      setError("Please add at least one image URL.");
      setLoading(false);
      return;
    }

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      category: form.category,
      gender: form.gender,
      sizes: form.sizes ?? [],
      colors: (form.colors ?? []) as ColorOption[],
      images: cleanedImages,
      collectionId: form.collectionId ? Number(form.collectionId) : null,
      badge: form.badge?.trim() || null,
      offerActive: !!form.offerActive,
      offerLabel: form.offerLabel?.trim() || null,
    };

    const url = isEdit ? `/api/admin/products/${product.id}` : "/api/admin/products";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to save product.");
      } else {
        // After saving the product, save the variant stock values.
        // The product API auto-syncs variants, so we just push the stock grid.
        const savedId = isEdit ? product.id : data.id;
        if (savedId && formSizes.length > 0 && formColors.length > 0) {
          const updates = formSizes.flatMap((size) =>
            formColors.map((color) => ({
              size,
              color: color.name,
              stock: getVariantStock(size, color.name),
            }))
          );
          await fetch(`/api/admin/products/${savedId}/variants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ updates }),
          }).catch(() => {});
        }
        router.push("/admin/products");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">Name</label>
          <input
            type="text"
            value={form.name ?? ""}
            onChange={(e) => setField("name", e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">Slug</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.slug ?? ""}
              onChange={(e) => setField("slug", e.target.value)}
              className="flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
              required
            />
            <button
              type="button"
              onClick={generateSlug}
              className="rounded-xl border border-stone-200 px-4 text-xs font-medium text-stone-600 hover:bg-stone-100"
            >
              Generate
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700">Description</label>
        <textarea
          value={form.description ?? ""}
          onChange={(e) => setField("description", e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
          required
        />
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">Price (cents)</label>
          <input
            type="number"
            value={form.price ?? 0}
            onChange={(e) => setField("price", Number(e.target.value))}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
            required
          />
          {form.price ? (
            <p className="text-xs text-stone-400">= ${(form.price / 100).toFixed(2)}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">Compare-at</label>
          <input
            type="number"
            value={form.compareAtPrice ?? ""}
            onChange={(e) =>
              setField("compareAtPrice", e.target.value ? Number(e.target.value) : null)
            }
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">Category</label>
          <select
            value={form.category ?? "Clothing"}
            onChange={(e) => setField("category", e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
          >
            {categoryList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            {/* Include the product's current category if not in list */}
            {form.category && !categoryList.includes(form.category) && (
              <option value={form.category}>{form.category}</option>
            )}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">Gender</label>
          <select
            value={form.gender ?? "Unisex"}
            onChange={(e) => setField("gender", e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
          >
            <option>Men</option>
            <option>Women</option>
            <option>Unisex</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">Collection</label>
          <select
            value={form.collectionId ?? ""}
            onChange={(e) =>
              setField("collectionId", e.target.value ? Number(e.target.value) : null)
            }
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
          >
            <option value="">None</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">
            Badge <span className="text-stone-400">(shows on homepage)</span>
          </label>
          <input
            type="text"
            value={form.badge ?? ""}
            onChange={(e) => setField("badge", e.target.value || null)}
            placeholder="New / Best Seller"
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
          />
        </div>
      </div>

      {/* Offer / Discount badge toggle */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form.offerActive}
            onChange={(e) => setField("offerActive", e.target.checked)}
            className="h-4 w-4 accent-stone-950"
          />
          <span className="text-sm font-medium text-stone-700">
            Show offer badge
          </span>
        </label>
        {form.offerActive && (
          <input
            type="text"
            value={form.offerLabel ?? ""}
            onChange={(e) => setField("offerLabel", e.target.value || null)}
            placeholder="e.g. -20% / Special Offer / Limited"
            className="flex-1 rounded-lg border border-stone-200 bg-surface px-4 py-2 text-sm outline-none focus:border-stone-500"
          />
        )}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-stone-700">Sizes</label>
        <div className="flex flex-wrap gap-2">
          {form.sizes?.map((size, idx) => (
            <span
              key={idx}
              className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-sm"
            >
              {size}
              <button
                type="button"
                onClick={() => removeSize(idx)}
                className="rounded-full p-0.5 hover:bg-stone-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSize();
              }
            }}
            placeholder="e.g. M, L, XL, 42"
            className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-stone-500"
          />
          <button
            type="button"
            onClick={addSize}
            disabled={!sizeInput.trim()}
            className="flex items-center gap-1 rounded-xl bg-cta-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-transform hover:scale-105 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-stone-700">Colors</label>
        <div className="flex flex-wrap gap-2">
          {((form.colors ?? []) as ColorOption[]).map((color, idx) => (
            <span
              key={idx}
              className="flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-sm"
            >
              <span
                className="h-4 w-4 rounded-full border border-stone-300"
                style={{ backgroundColor: color.value }}
              />
              {color.name}
              <button
                type="button"
                onClick={() => removeColor(idx)}
                className="rounded-full p-0.5 hover:bg-stone-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <input
              type="color"
              value={colorValue}
              onChange={(e) => setColorValue(e.target.value)}
              className="h-[42px] w-[52px] cursor-pointer rounded-xl border border-stone-200 bg-surface p-1"
            />
          </div>
          <input
            type="text"
            value={colorName}
            onChange={(e) => setColorName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addColor();
              }
            }}
            placeholder="Color name (e.g. Black)"
            className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-stone-500"
          />
          <button
            type="button"
            onClick={addColor}
            disabled={!colorName.trim()}
            className="flex items-center gap-1 rounded-xl bg-cta-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-transform hover:scale-105 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Images with live preview */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-stone-700">
          Images <span className="text-stone-400">(paste any image URL)</span>
        </label>
        <div className="space-y-3">
          {visibleImages.map((img, idx) => (
            <div key={idx} className="flex items-start gap-3">
              {/* Preview thumbnail */}
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                {img.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.trim()}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-stone-300" />
                  </div>
                )}
              </div>
              <input
                type="text"
                value={img}
                onChange={(e) => updateImage(idx, e.target.value)}
                placeholder="https://images.pexels.com/photos/..."
                className="flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
              />
              {visibleImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="rounded-xl border border-stone-200 px-3 py-3 text-stone-600 hover:bg-stone-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addImage}
          className="flex items-center gap-1 rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-100"
        >
          <Plus className="h-4 w-4" /> Add another image
        </button>
      </div>

      {/* ===== Stock by variant — integrated, updates live with sizes/colors ===== */}
      {formSizes.length > 0 && formColors.length > 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                Stock by variant
              </h3>
              <p className="text-xs text-stone-500">
                Set stock for each size &amp; color. This grid updates live when you add or remove sizes/colors.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-stone-400">Total stock</p>
              <p className={`font-serif text-xl font-medium ${
                totalVariantStock === 0 ? "text-red-600" : totalVariantStock <= 5 ? "text-amber-600" : "text-stone-950"
              }`}>
                {totalVariantStock}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-stone-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Size
                  </th>
                  {formColors.map((c) => (
                    <th key={c.name} className="border-b border-stone-200 px-3 py-2 text-center text-xs font-semibold text-stone-600">
                      <div className="flex flex-col items-center gap-1">
                        <span className="h-4 w-4 rounded-full border border-stone-300" style={{ backgroundColor: c.value }} />
                        {c.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {formSizes.map((size) => (
                  <tr key={size}>
                    <td className="border-b border-stone-100 px-3 py-2 font-medium text-stone-800">{size}</td>
                    {formColors.map((color) => {
                      const stock = getVariantStock(size, color.name);
                      return (
                        <td key={color.name} className="border-b border-stone-100 px-2 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            value={stock}
                            onChange={(e) =>
                              setVariantStock(size, color.name, Number(e.target.value))
                            }
                            className={`w-16 rounded-lg border px-2 py-1.5 text-center text-sm outline-none focus:border-stone-500 ${
                              stock === 0
                                ? "border-red-200 bg-red-50 text-red-600"
                                : stock <= 3
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-stone-200 bg-surface text-stone-800"
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <svg className="h-5 w-5 shrink-0 text-blue-500" viewBox="0 0 24 24" fill="none"><path d="M12 16v-4M12 8h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div>
            <p className="text-sm font-medium text-stone-800">
              Add sizes and colors to manage stock
            </p>
            <p className="text-xs text-stone-500">
              The stock grid appears here once you&apos;ve added at least one size and one color.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-cta-accent px-8 py-3.5 text-sm font-semibold text-accent-ink transition-transform hover:scale-[1.02] disabled:opacity-70"
        >
          {loading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-full border border-stone-200 px-8 py-3.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
