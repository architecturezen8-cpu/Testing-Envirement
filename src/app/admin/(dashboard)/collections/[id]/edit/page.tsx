"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CollectionForm } from "@/components/admin/collection-form";
import type { Collection } from "@/db/schema";

export default function EditCollectionPage() {
  const { id } = useParams() as { id: string };
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/collections/${id}`)
      .then((r) => r.json())
      .then(setCollection)
      .catch(() => setCollection(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-stone-200" />;
  if (!collection) return <p className="text-stone-500">Collection not found.</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-3xl font-medium text-stone-950">
        Edit Collection
      </h1>
      <p className="mt-1 text-stone-500">Update collection details.</p>
      <div className="mt-8 rounded-2xl border border-stone-200 bg-surface p-6 md:p-8">
        <CollectionForm collection={collection} />
      </div>
    </div>
  );
}
