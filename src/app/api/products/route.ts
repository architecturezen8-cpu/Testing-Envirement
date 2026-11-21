import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { products, collections } from "@/db/schema";
import { and, asc, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const category = searchParams.get("category");
  const gender = searchParams.get("gender");
  const collection = searchParams.get("collection");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const searchQuery = searchParams.get("q");
  const sort = searchParams.get("sort") ?? "featured";
  const limit = searchParams.get("limit");

  const conditions: ReturnType<typeof eq>[] = [];

  if (category) {
    conditions.push(eq(products.category, category));
  }

  if (gender) {
    conditions.push(eq(products.gender, gender));
  }

  if (collection) {
    if (collection === "featured") {
      conditions.push(sql`${products.badge} IS NOT NULL`);
    } else {
      conditions.push(eq(collections.slug, collection));
    }
  }

  if (minPrice) {
    conditions.push(gte(products.price, Number(minPrice)));
  }

  if (maxPrice) {
    conditions.push(lte(products.price, Number(maxPrice)));
  }

  if (searchQuery) {
    conditions.push(ilike(products.name, `%${searchQuery}%`));
  }

  let orderBy;
  switch (sort) {
    case "price-asc":
      orderBy = asc(products.price);
      break;
    case "price-desc":
      orderBy = desc(products.price);
      break;
    case "newest":
      orderBy = desc(products.createdAt);
      break;
    case "rating":
      orderBy = desc(products.rating);
      break;
    default:
      orderBy = desc(products.createdAt);
  }

  const dbQuery = db
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
    })
    .from(products)
    .leftJoin(collections, eq(products.collectionId, collections.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(orderBy);

  const result = limit
    ? await dbQuery.limit(Number(limit))
    : await dbQuery;

  return NextResponse.json(result);
}
