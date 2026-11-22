import { Router } from "express";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { products, productVariants } from "../db/schema";
import { asyncHandler } from "../lib/async";

const colorSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
});

const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  price: z.number().int().positive(),
  compareAtPrice: z.number().int().nullish().transform((v) => v ?? null),
  category: z.string().min(1),
  gender: z.string().min(1),
  sizes: z.array(z.string()).min(1),
  colors: z.array(colorSchema).nullish().transform((v) => v ?? []),
  images: z
    .array(z.string())
    .transform((arr) => arr.filter((s) => s.trim().length > 0))
    .pipe(z.array(z.string()).min(1)),
  collectionId: z.number().int().nullish().transform((v) => v ?? null),
  badge: z.string().nullish().transform((v) => (v?.trim() ? v.trim() : null)),
  offerActive: z.boolean().default(false),
  offerLabel: z.string().nullish().transform((v) => (v?.trim() ? v.trim() : null)),
});

const updateProductSchema = createProductSchema.partial();

export const productsRouter = Router();

productsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await db.select().from(products).orderBy(desc(products.createdAt));
    res.json(result);
  })
);

productsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid product id" });
      return;
    }

    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json(product);
  })
);

productsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }

    try {
      const [product] = await db
        .insert(products)
        .values({ ...parsed.data, stock: 0, inStock: false })
        .returning();

      const { sizes, colors } = parsed.data;
      if (sizes.length > 0 && colors.length > 0) {
        const variantRows: { productId: number; size: string; color: string; stock: number }[] = [];
        for (const size of sizes) {
          for (const color of colors) {
            variantRows.push({ productId: product.id, size, color: color.name, stock: 0 });
          }
        }
        await db.insert(productVariants).values(variantRows);
      }

      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Failed to create product. Slug may already exist.",
      });
    }
  })
);

productsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid product id" });
      return;
    }

    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }

    const [product] = await db
      .update(products)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json(product);
  })
);

productsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid product id" });
      return;
    }

    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });

    if (!deleted) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.status(204).send();
  })
);
