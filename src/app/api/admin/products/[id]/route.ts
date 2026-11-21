import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const colorSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
});

const productUpdateSchema = z.object({
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, Number(id)));

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(
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

  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  try {
    const productId = Number(id);
    const { sizes, colors, ...productFields } = parsed.data;

    // Fetch existing variants so we can preserve their stock when sizes/colors haven't changed
    const existingVariants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));

    // Update product fields INCLUDING sizes and colors (the bug was that these
    // were destructured out and never written back to the product record).
    const [product] = await db
      .update(products)
      .set({ ...productFields, sizes, colors, updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Sync variants: ensure every size × color combination exists.
    // Keep existing stock values; create new combos with stock=0; delete removed combos.
    const newCombos: { size: string; color: string }[] = [];
    for (const size of sizes) {
      for (const color of colors) {
        newCombos.push({ size, color: color.name });
      }
    }

    const existingKeys = new Set(
      existingVariants.map((v) => `${v.size}__${v.color}`)
    );
    const newKeys = new Set(newCombos.map((c) => `${c.size}__${c.color}`));

    // Delete variants for combos that no longer exist
    const toDelete = existingVariants.filter(
      (v) => !newKeys.has(`${v.size}__${v.color}`)
    );
    for (const v of toDelete) {
      await db
        .delete(productVariants)
        .where(eq(productVariants.id, v.id));
    }

    // Add new combos that don't exist yet
    const toAdd = newCombos.filter(
      (c) => !existingKeys.has(`${c.size}__${c.color}`)
    );
    if (toAdd.length > 0) {
      await db.insert(productVariants).values(
        toAdd.map((c) => ({
          productId,
          size: c.size,
          color: c.color,
          stock: 0,
        }))
      );
    }

    // Recalculate total stock from all variants (single source of truth)
    const [agg] = await db
      .select({ total: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)::int` })
      .from(productVariants)
      .where(eq(productVariants.productId, productId));

    const [updated] = await db
      .update(products)
      .set({ stock: agg.total, inStock: agg.total > 0 })
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const [deleted] = await db
    .delete(products)
    .where(eq(products.id, Number(id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
