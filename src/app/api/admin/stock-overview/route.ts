import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const category = request.nextUrl.searchParams.get("category");

  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      category: products.category,
      price: products.price,
      stock: products.stock,
      inStock: products.inStock,
      sizes: products.sizes,
      colors: products.colors,
      image: products.images,
    })
    .from(products)
    .orderBy(products.name);

  const filtered = category
    ? productRows.filter((p) => p.category === category)
    : productRows;

  const variants = await db.select().from(productVariants);

  const result = filtered.map((p) => {
    const pVariants = variants
      .filter((v) => v.productId === p.id)
      .map((v) => ({ size: v.size, color: v.color, stock: v.stock }));
    return {
      ...p,
      image: Array.isArray(p.image) ? p.image[0] : null,
      variants: pVariants,
    };
  });

  return NextResponse.json(result);
}
