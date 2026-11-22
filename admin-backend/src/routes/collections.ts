import { Router } from "express";
import { asc } from "drizzle-orm";
import { db } from "../db/client";
import { collections } from "../db/schema";
import { asyncHandler } from "../lib/async";

export const collectionsRouter = Router();

collectionsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await db.select().from(collections).orderBy(asc(collections.sortOrder));
    res.json(result);
  })
);
