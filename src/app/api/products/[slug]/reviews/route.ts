import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { reviews, products, orderItems, orders } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { getUserSession } from "@/lib/user-auth";

const reviewSchema = z.object({
  rating: z.number().int().min(1, "Please select a rating.").max(5),
  title: z.string().min(3, "Title must be at least 3 characters.").max(120),
  body: z.string().min(10, "Review must be at least 10 characters.").max(2000),
  author: z.string().min(2, "Please enter your name.").max(80).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Find the product
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const session = await getUserSession();

  // Determine author name: logged-in user's name, or the provided name
  const author = session?.name || parsed.data.author;
  if (!author) {
    return NextResponse.json(
      { error: "Please enter your name." },
      { status: 400 }
    );
  }

  // Check if the logged-in user purchased this product (for "verified" badge)
  let verified = false;
  if (session) {
    const [purchased] = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, session.id),
          eq(orderItems.productId, product.id)
        )
      )
      .limit(1);
    verified = !!purchased;
  }

  // Insert the review
  const [created] = await db
    .insert(reviews)
    .values({
      productId: product.id,
      author,
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      userId: session?.id ?? null,
      verified,
    })
    .returning();

  // Recalculate and update the product's aggregate rating
  const [agg] = await db
    .select({
      avg: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(reviews)
    .where(eq(reviews.productId, product.id));

  await db
    .update(products)
    .set({
      rating: String(Math.round(Number(agg.avg) * 10) / 10),
      reviewCount: agg.count,
    })
    .where(eq(products.id, product.id));

  return NextResponse.json({ review: created }, { status: 201 });
}
