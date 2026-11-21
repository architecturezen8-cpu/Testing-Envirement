import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const colorSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
});

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  price: z.number().int().positive(),
  compareAtPrice: z.number().int().optional().nullable(),
  category: z.string().min(1),
  gender: z.string().min(1),
  sizes: z.array(z.string()).min(1),
  colors: z.array(colorSchema).nullish().transform((v) => v ?? []),
  images: z
    .array(z.string())
    .transform((arr) => arr.filter((s) => s.trim().length > 0))
    .pipe(z.array(z.string()).min(1)),
  collectionId: z.number().optional().nullable(),
  badge: z.string().optional().nullable().transform((v) => (v?.trim() ? v.trim() : null)),
  offerActive: z.boolean().default(false),
  offerLabel: z.string().optional().nullable().transform((v) => (v?.trim() ? v.trim() : null)),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const result = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  try {
    // Create product with stock=0 (variants control the real stock)
    const [product] = await db
      .insert(products)
      .values({ ...parsed.data, stock: 0, inStock: false })
      .returning();

    // Auto-generate variants for every size × color combination
    const { sizes, colors } = parsed.data;
    if (sizes.length > 0 && colors.length > 0) {
      const variantRows = [];
      for (const size of sizes) {
        for (const color of colors) {
          variantRows.push({
            productId: product.id,
            size,
            color: color.name,
            stock: 0,
          });
        }
      }
      await db.insert(productVariants).values(variantRows);
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create product. Slug may already exist." },
      { status: 500 }
    );
  }
}
