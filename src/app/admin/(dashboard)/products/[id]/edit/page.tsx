"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import type { Product, Collection } from "@/db/schema";

export default function EditProductPage() {
  const { id } = useParams() as { id: string };
  const [product, setProduct] = useState<Product | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/products/${id}`).then((r) => r.json()),
      fetch("/api/admin/collections").then((r) => r.json()),
    ])
      .then(([prod, cols]) => {
        setProduct(prod);
        setCollections(cols);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-stone-200" />;
  if (!product) return <p className="text-stone-500">Product not found.</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-3xl font-medium text-stone-950">
        Edit Product
      </h1>
      <p className="mt-1 text-stone-500">Update product details and inventory.</p>

      {/* Product details form (includes integrated variant stock grid) */}
      <div className="mt-8 rounded-2xl border border-stone-200 bg-surface p-6 md:p-8">
        <ProductForm product={product} collections={collections} />
      </div>
    </div>
  );
}
