export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, orders, reviews, collections } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { count, sum, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const [productStats] = await db
    .select({ count: count(products.id) })
    .from(products);

  const [orderStats] = await db
    .select({ count: count(orders.id), revenue: sum(orders.total) })
    .from(orders);

  const [reviewStats] = await db
    .select({ count: count(reviews.id) })
    .from(reviews);

  const [collectionStats] = await db
    .select({ count: count(collections.id) })
    .from(collections);

  const recentOrders = await db
    .select({
      id: orders.id,
      email: orders.email,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(sql`${orders.createdAt} DESC`)
    .limit(5);

  // Low-stock alerts: products with stock <= 5
  const lowStockProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      stock: products.stock,
    })
    .from(products)
    .where(sql`${products.stock} <= 5`)
    .orderBy(sql`${products.stock} ASC`)
    .limit(6);

  return NextResponse.json({
    products: productStats.count,
    orders: orderStats.count,
    revenue: Number(orderStats.revenue ?? 0),
    reviews: reviewStats.count,
    collections: collectionStats.count,
    recentOrders,
    lowStockProducts,
  });
}
