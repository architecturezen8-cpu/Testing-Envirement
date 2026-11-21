import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, reviews, collections, productVariants } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      category: products.category,
      gender: products.gender,
      sizes: products.sizes,
      colors: products.colors,
      images: products.images,
      rating: products.rating,
      reviewCount: products.reviewCount,
      badge: products.badge,
      offerActive: products.offerActive,
      offerLabel: products.offerLabel,
      inStock: products.inStock,
      stock: products.stock,
      createdAt: products.createdAt,
      collectionName: collections.name,
      collectionSlug: collections.slug,
    })
    .from(products)
    .leftJoin(collections, eq(products.collectionId, collections.id))
    .where(eq(products.slug, slug));

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const productReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, product.id))
    .orderBy(desc(reviews.createdAt));

  // Fetch per-variant stock (size + color combinations)
  const variants = await db
    .select({
      id: productVariants.id,
      size: productVariants.size,
      color: productVariants.color,
      stock: productVariants.stock,
    })
    .from(productVariants)
    .where(eq(productVariants.productId, product.id));

  return NextResponse.json({ product, reviews: productReviews, variants });
}
