import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET all variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, Number(id)))
    .orderBy(productVariants.size, productVariants.color);

  return NextResponse.json(variants);
}

// POST — regenerate all variants for a product based on its sizes/colors,
// or bulk-set stock values
const bulkUpdateSchema = z.object({
  updates: z.array(
    z.object({
      id: z.number().optional(),
      size: z.string(),
      color: z.string(),
      stock: z.number().int().min(0),
    })
  ),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bulkUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const productId = Number(id);

  // Delete existing variants, then re-insert with new stock values
  await db.delete(productVariants).where(eq(productVariants.productId, productId));

  if (parsed.data.updates.length > 0) {
    await db.insert(productVariants).values(
      parsed.data.updates.map((u) => ({
        productId,
        size: u.size,
        color: u.color,
        stock: u.stock,
      }))
    );
  }

  // Recalculate product-level total stock
  const [agg] = await db
    .select({ total: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)::int` })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  await db
    .update(products)
    .set({
      stock: agg.total,
      inStock: agg.total > 0,
    })
    .where(eq(products.id, productId));

  return NextResponse.json({ success: true, totalStock: agg.total });
}
