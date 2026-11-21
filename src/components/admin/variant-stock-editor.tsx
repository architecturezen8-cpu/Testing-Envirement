"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";

interface Variant {
  id?: number;
  size: string;
  color: string;
  stock: number;
}

interface VariantStockEditorProps {
  productId: number;
  sizes: string[];
  colors: { name: string; value: string }[];
}

export function VariantStockEditor({
  productId,
  sizes,
  colors,
}: VariantStockEditorProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Stable string keys to avoid unnecessary re-fetches
  const sizesKey = sizes.join(",");
  const colorsKey = colors.map((c) => c.name).join(",");

  // Fetch existing variants
  useEffect(() => {
    if (sizes.length === 0 || colors.length === 0) {
      setVariants([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/admin/products/${productId}/variants`)
      .then((r) => r.json())
      .then((data) => {
        // Guard: ensure data is an array
        const rows = Array.isArray(data) ? (data as Variant[]) : [];
        // Build a complete grid: every size × color combination
        const grid: Variant[] = [];
        for (const size of sizes) {
          for (const color of colors) {
            const existing = rows.find(
              (v) => v.size === size && v.color === color.name
            );
            grid.push({
              id: existing?.id,
              size,
              color: color.name,
              stock: existing?.stock ?? 0,
            });
          }
        }
        setVariants(grid);
      })
      .catch(() => setVariants([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, sizesKey, colorsKey]);

  const updateStock = (size: string, color: string, stock: number) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.size === size && v.color === color
          ? { ...v, stock: Math.max(0, stock) }
          : v
      )
    );
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: variants }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      // ignore network errors
    } finally {
      setSaving(false);
    }
  };

  if (sizes.length === 0 || colors.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        Add sizes and colors to the product first to manage per-variant stock.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading variants...
      </div>
    );
  }

  // Calculate total stock from all variants (live preview)
  const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">
            Stock by variant
          </h3>
          <p className="text-xs text-stone-500">
            Set stock for each size &amp; color combination. Stock = 0 marks it as sold out.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-stone-400">Total stock</p>
            <p className={`font-serif text-xl font-medium ${
              totalStock === 0 ? "text-red-600" : totalStock <= 5 ? "text-amber-600" : "text-stone-950"
            }`}>
              {totalStock}
            </p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-cta-accent px-5 py-2.5 text-xs font-semibold text-accent-ink transition-transform hover:scale-105 disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
            ) : saved ? (
              <>✓ Saved</>
            ) : (
              <><Save className="h-3.5 w-3.5" /> Save stock</>
            )}
          </button>
        </div>
      </div>

      {/* Stock grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-stone-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                Size
              </th>
              {colors.map((c) => (
                <th key={c.name} className="border-b border-stone-200 px-3 py-2 text-center text-xs font-semibold text-stone-600">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className="h-4 w-4 rounded-full border border-stone-300"
                      style={{ backgroundColor: c.value }}
                    />
                    {c.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizes.map((size) => (
              <tr key={size}>
                <td className="border-b border-stone-100 px-3 py-2 font-medium text-stone-800">
                  {size}
                </td>
                {colors.map((color) => {
                  const v = variants.find(
                    (va) => va.size === size && va.color === color.name
                  );
                  const stock = v?.stock ?? 0;
                  return (
                    <td key={color.name} className="border-b border-stone-100 px-2 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={stock}
                        onChange={(e) =>
                          updateStock(size, color.name, Number(e.target.value))
                        }
                        className={`w-16 rounded-lg border px-2 py-1.5 text-center text-sm outline-none focus:border-stone-500 ${
                          stock === 0
                            ? "border-red-200 bg-red-50 text-red-600"
                            : stock <= 3
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-stone-200 text-stone-800"
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

      <div className="mt-3 flex items-center gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-50 ring-1 ring-amber-200" /> Low stock (1-3)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-50 ring-1 ring-red-200" /> Out of stock (0)
        </span>
      </div>
    </div>
  );
}
