import { Router } from "express";
import { sql, asc } from "drizzle-orm";
import { db } from "../db/client";
import { products, productVariants } from "../db/schema";
import { asyncHandler } from "../lib/async";

export const stockRouter = Router();

stockRouter.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    const productRows = await db
      .select({ id: products.id, name: products.name, slug: products.slug, stock: products.stock })
      .from(products)
      .where(sql`${products.stock} <= 10`)
      .orderBy(asc(products.stock))
      .limit(20);

    const [variantTotals] = await db
      .select({
        productCount: sql<number>`COUNT(DISTINCT ${productVariants.productId})`,
        stockTotal: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)`,
      })
      .from(productVariants);

    res.json({
      lowStockProducts: productRows,
      variants: {
        productCount: Number(variantTotals?.productCount ?? 0),
        stockTotal: Number(variantTotals?.stockTotal ?? 0),
      },
    });
  })
);
