import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, collections, reviews } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getHomeConfig, saveHomeConfig, type HomeConfig } from "@/lib/home-config";
import { requireAuth } from "@/lib/auth";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** GET — everything the home page editor needs in one payload. */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const config = await getHomeConfig();

  const [allProducts, allCollections, allReviews] = await Promise.all([
    db.select().from(products).orderBy(desc(products.createdAt)),
    db.select().from(collections).orderBy(collections.sortOrder),
    db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(30),
  ]);

  return NextResponse.json({
    config,
    products: allProducts.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      image: p.images?.[0] ?? null,
    })),
    collections: allCollections.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      description: c.description,
    })),
    reviews: allReviews.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      author: r.author,
      rating: r.rating,
      productName: r.productId,
    })),
  });
}

/** PUT — saves one or more sections of the home page config. */
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  let body: Partial<HomeConfig> & { section?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const saved = await saveHomeConfig(body);
    return NextResponse.json({ ok: true, config: saved });
  } catch (e) {
    return NextResponse.json(
      { error: "Could not save", detail: (e as Error).message },
      { status: 500 },
    );
  }
}
