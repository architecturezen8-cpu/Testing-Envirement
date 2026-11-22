import { Router } from "express";
import { asc } from "drizzle-orm";
import { db } from "../db/client";
import { categories } from "../db/schema";
import { asyncHandler } from "../lib/async";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    res.json(result);
  })
);
