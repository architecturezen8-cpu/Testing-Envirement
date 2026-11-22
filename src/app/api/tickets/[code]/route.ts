import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { issuedTickets, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { makeQrDataUrl, qrPayload } from "@/lib/tickets";

export const dynamic = "force-dynamic";

/**
 * Returns a single ticket (matched by its reference code) plus the QR image.
 * The code is unguessable enough for gate access, so no login is required —
 * this is the same link the QR itself encodes.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const ticketCode = decodeURIComponent(code).toUpperCase();

  const rows = await db
    .select({
      ticket: issuedTickets,
      productImage: products.images,
    })
    .from(issuedTickets)
    .leftJoin(products, eq(issuedTickets.productId, products.id))
    .where(eq(issuedTickets.ticketCode, ticketCode))
    .limit(1);

  if (!rows.length) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const { ticket, productImage } = rows[0];
  const qr = await makeQrDataUrl(qrPayload(ticket.ticketCode));

  return NextResponse.json({
    ticket: {
      ticketCode: ticket.ticketCode,
      eventName: ticket.eventName,
      eventDate: ticket.eventDate,
      venue: ticket.venue,
      tier: ticket.tier,
      attendeeName: ticket.attendeeName,
      quantity: ticket.quantity,
      status: ticket.status,
      imageUrl: productImage?.[0] ?? null,
      createdAt: ticket.createdAt,
    },
    qrDataUrl: qr,
  });
}
