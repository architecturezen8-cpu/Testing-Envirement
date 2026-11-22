import { Router } from "express";
import { count, sum, sql } from "drizzle-orm";
import { db } from "../db/client";
import { products, orders, reviews, collections } from "../db/schema";
import { asyncHandler } from "../lib/async";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [productStats] = await db
      .select({ count: count(products.id) })
      .from(products);

    const [orderStats] = await db
      .select({ count: count(orders.id), revenue: sum(orders.total) })
      .from(orders);

    const [reviewStats] = await db.select({ count: count(reviews.id) }).from(reviews);

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

    res.json({
      products: productStats.count,
      orders: orderStats.count,
      revenue: Number(orderStats.revenue ?? 0),
      reviews: reviewStats.count,
      collections: collectionStats.count,
      recentOrders,
      lowStockProducts,
    });
  })
);
