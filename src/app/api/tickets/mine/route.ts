import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { issuedTickets, products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getUserSession } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

/**
 * All tickets belonging to the signed-in customer, newest first. Each row
 * carries the artwork so the list can show a thumbnail.
 */
export async function GET(request: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      ticketCode: issuedTickets.ticketCode,
      eventName: issuedTickets.eventName,
      eventDate: issuedTickets.eventDate,
      venue: issuedTickets.venue,
      tier: issuedTickets.tier,
      attendeeName: issuedTickets.attendeeName,
      quantity: issuedTickets.quantity,
      status: issuedTickets.status,
      createdAt: issuedTickets.createdAt,
      imageUrl: products.images,
    })
    .from(issuedTickets)
    .leftJoin(products, eq(issuedTickets.productId, products.id))
    .where(eq(issuedTickets.email, session.email))
    .orderBy(desc(issuedTickets.createdAt));

  return NextResponse.json({
    tickets: rows.map((r) => ({
      ...r,
      imageUrl: r.imageUrl?.[0] ?? null,
    })),
  });
}
