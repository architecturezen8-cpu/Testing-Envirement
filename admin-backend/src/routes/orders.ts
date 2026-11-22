import { Router } from "express";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { orders } from "../db/schema";
import { asyncHandler } from "../lib/async";

const statusSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
});

export const ordersRouter = Router();

ordersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const result = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
    res.json(result);
  })
);

ordersRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid order id" });
      return;
    }

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const [order] = await db.update(orders).set({ status: parsed.data.status }).where(eq(orders.id, id)).returning();

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json(order);
  })
);
