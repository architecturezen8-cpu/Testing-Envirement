"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, FolderTree, Pencil } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";

interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const fetchCats = () => {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCats(Array.isArray(d) ? d : []))
      .catch(() => setCats([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const deleteCat = async (id: number) => {
    if (!confirm("Delete this category? Products using it will keep their text value.")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    fetchCats();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-medium text-stone-950">
            Categories
          </h1>
          <p className="mt-1 text-stone-500">
            Manage product categories. These appear as filter options on the shop.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 rounded-full bg-cta-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <CategoryForm
          category={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchCats();
          }}
        />
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-stone-200" />
      ) : (
        <DataTable headers={["Category", "Slug", "Order", "Actions"]}>
          {cats.map((c) => (
            <tr key={c.id} className="border-b border-stone-100 last:border-0">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-stone-400" />
                  <span className="font-medium text-stone-900">{c.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 font-mono text-sm text-stone-500">
                {c.slug}
              </td>
              <td className="px-6 py-4 text-sm text-stone-600">{c.sortOrder}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditing(c);
                      setShowForm(true);
                    }}
                    className="rounded-lg p-2 text-stone-600 transition-colors hover:bg-stone-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteCat(c.id)}
                    className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {cats.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-stone-500">
                No categories yet.
              </td>
            </tr>
          )}
        </DataTable>
      )}
    </div>
  );
}

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const generateSlug = () => {
    setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      sortOrder: Number(sortOrder) || 0,
    };

    const url = category ? `/api/admin/categories/${category.id}` : "/api/admin/categories";
    const res = await fetch(url, {
      method: category ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to save.");
    } else {
      onSaved();
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-surface p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-medium text-stone-950">
          {category ? "Edit Category" : "New Category"}
        </h2>
        <button onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Accessories"
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Slug</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="accessories"
                className="flex-1 rounded-xl border border-stone-200 px-4 py-3 font-mono text-sm outline-none focus:border-stone-500"
                required
              />
              <button
                type="button"
                onClick={generateSlug}
                className="rounded-xl border border-stone-200 px-4 text-xs font-medium text-stone-600 hover:bg-stone-100"
              >
                Auto
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">Sort order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="0"
            className="w-32 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-cta-accent px-8 py-3.5 text-sm font-semibold text-accent-ink transition-transform hover:scale-105 disabled:opacity-70"
          >
            {loading ? "Saving..." : category ? "Update Category" : "Create Category"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-200 px-8 py-3.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
