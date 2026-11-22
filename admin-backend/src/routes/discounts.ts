import { Router } from "express";
import { asc } from "drizzle-orm";
import { db } from "../db/client";
import { discountCodes } from "../db/schema";
import { asyncHandler } from "../lib/async";

export const discountsRouter = Router();

discountsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await db.select().from(discountCodes).orderBy(asc(discountCodes.code));
    res.json(result);
  })
);
