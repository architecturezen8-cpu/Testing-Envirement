"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import type { Collection } from "@/db/schema";

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = () => {
    setLoading(true);
    fetch("/api/admin/collections")
      .then((r) => r.json())
      .then(setCollections)
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const deleteCollection = async (id: number) => {
    if (!confirm("Are you sure? Products in this collection will become uncategorized.")) return;
    const res = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
    if (res.ok) fetchCollections();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-medium text-stone-950">
            Collections
          </h1>
          <p className="mt-1 text-stone-500">Organize products into collections.</p>
        </div>
        <Link
          href="/admin/collections/new"
          className="flex items-center justify-center gap-2 rounded-full bg-cta-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" /> Add Collection
        </Link>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-stone-200" />
      ) : (
        <DataTable headers={["Collection", "Slug", "Featured", "Actions"]}>
          {collections.map((collection) => (
            <tr key={collection.id} className="border-b border-stone-100 last:border-0">
              <td className="px-6 py-4">
                <div className="font-medium text-stone-900">{collection.name}</div>
                <div className="text-xs text-stone-500">{collection.description}</div>
              </td>
              <td className="px-6 py-4 text-stone-600">{collection.slug}</td>
              <td className="px-6 py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    collection.featured
                      ? "bg-stone-950 text-white"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {collection.featured ? "Featured" : "No"}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/collections/${collection.id}/edit`}
                    className="rounded-lg p-2 text-stone-600 transition-colors hover:bg-stone-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => deleteCollection(collection.id)}
                    className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {collections.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-stone-500">
                No collections found.
              </td>
            </tr>
          )}
        </DataTable>
      )}
    </div>
  );
}
