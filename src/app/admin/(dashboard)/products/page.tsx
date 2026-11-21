"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/db/schema";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchProducts = () => {
    setLoading(true);
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const deleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) fetchProducts();
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-medium text-stone-950">
            Products
          </h1>
          <p className="mt-1 text-stone-500">Manage your product catalog.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center justify-center gap-2 rounded-full bg-cta-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-stone-200 bg-surface py-3 pl-10 pr-4 text-sm outline-none focus:border-stone-500 sm:max-w-md"
        />
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-stone-200" />
      ) : (
        <DataTable headers={["Product", "Category", "Price", "Stock", "Actions"]}>
          {filtered.map((product) => (
            <tr key={product.id} className="border-b border-stone-100 last:border-0">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                    {product.images && product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <div className="font-medium text-stone-900">{product.name}</div>
                    <div className="text-xs text-stone-500">/{product.slug}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-stone-600">
                {product.category} · {product.gender}
              </td>
              <td className="px-6 py-4 font-medium text-stone-900">
                {formatPrice(product.price)}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    !product.inStock || product.stock === 0
                      ? "bg-red-100 text-red-700"
                      : product.stock <= 5
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {!product.inStock || product.stock === 0
                    ? "Out of stock"
                    : product.stock <= 5
                      ? `Low — ${product.stock} left`
                      : `${product.stock} in stock`}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="rounded-lg p-2 text-stone-600 transition-colors hover:bg-stone-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                No products found.
              </td>
            </tr>
          )}
        </DataTable>
      )}
    </div>
  );
}
