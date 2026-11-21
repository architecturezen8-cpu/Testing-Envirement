"use client";

import { useEffect, useState } from "react";
import { ProductForm } from "@/components/admin/product-form";
import type { Collection } from "@/db/schema";

export default function NewProductPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/collections")
      .then((r) => r.json())
      .then(setCollections)
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-stone-200" />;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-3xl font-medium text-stone-950">
        Add Product
      </h1>
      <p className="mt-1 text-stone-500">Create a new product in your catalog.</p>
      <div className="mt-8 rounded-2xl border border-stone-200 bg-surface p-6 md:p-8">
        <ProductForm collections={collections} />
      </div>
    </div>
  );
}
