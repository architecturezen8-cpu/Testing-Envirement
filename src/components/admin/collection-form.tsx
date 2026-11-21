"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Collection } from "@/db/schema";

interface CollectionFormProps {
  collection?: Collection;
}

const emptyCollection: Partial<Collection> = {
  name: "",
  slug: "",
  description: "",
  image: "",
  sortOrder: 0,
  featured: false,
};

export function CollectionForm({ collection }: CollectionFormProps) {
  const router = useRouter();
  const isEdit = !!collection;
  const [form, setForm] = useState<Partial<Collection>>(emptyCollection);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (collection) setForm(collection);
  }, [collection]);

  const setField = <K extends keyof Collection>(key: K, value: Collection[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
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

    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder),
    };

    const url = isEdit
      ? `/api/admin/collections/${collection.id}`
      : "/api/admin/collections";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to save collection.");
      } else {
        router.push("/admin/collections");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            value={form.name}
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
              value={form.slug}
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
          onChange={(e) => setField("description", e.target.value || null)}
          rows={3}
          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700">Image URL</label>
        <input
          type="url"
          value={form.image ?? ""}
          onChange={(e) => setField("image", e.target.value || null)}
          placeholder="https://images.pexels.com/..."
          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">Sort Order</label>
          <input
            type="number"
            value={form.sortOrder ?? 0}
            onChange={(e) => setField("sortOrder", Number(e.target.value))}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
          />
        </div>
        <div className="flex items-end gap-2 pb-3">
          <input
            type="checkbox"
            id="featured"
            checked={!!form.featured}
            onChange={(e) => setField("featured", e.target.checked)}
            className="h-4 w-4 accent-stone-950"
          />
          <label htmlFor="featured" className="text-sm font-medium text-stone-700">
            Featured on homepage
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-cta-accent px-8 py-3.5 text-sm font-semibold text-accent-ink transition-transform hover:scale-[1.02] disabled:opacity-70"
        >
          {loading ? "Saving..." : isEdit ? "Update Collection" : "Create Collection"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/collections")}
          className="rounded-full border border-stone-200 px-8 py-3.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
