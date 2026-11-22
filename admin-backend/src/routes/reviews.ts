import { Router } from "express";
import { desc } from "drizzle-orm";
import { db } from "../db/client";
import { reviews } from "../db/schema";
import { asyncHandler } from "../lib/async";

export const reviewsRouter = Router();

reviewsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const result = await db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(limit);
    res.json(result);
  })
);
