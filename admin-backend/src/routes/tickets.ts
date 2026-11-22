import { Router } from "express";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { issuedTickets } from "../db/schema";
import { asyncHandler } from "../lib/async";

const statusSchema = z.object({
  status: z.enum(["valid", "used", "cancelled"]),
});

export const ticketsRouter = Router();

ticketsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const result = await db.select().from(issuedTickets).orderBy(desc(issuedTickets.createdAt)).limit(limit);
    res.json(result);
  })
);

ticketsRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid ticket id" });
      return;
    }

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const [ticket] = await db.update(issuedTickets).set({ status: parsed.data.status }).where(eq(issuedTickets.id, id)).returning();

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    res.json(ticket);
  })
);
