import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { issuedTickets, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { renderTicketPass } from "@/lib/ticket-pass";

export const dynamic = "force-dynamic";

/**
 * Downloads a full ticket pass as a PNG.
 *
 * The pass is rendered the same way the email version is: uploaded ticket
 * artwork with the buyer's QR composited over its white square, or a
 * typographic pass when no artwork has been uploaded.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const ticketCode = decodeURIComponent(code).toUpperCase();

  const rows = await db
    .select({ ticket: issuedTickets, artwork: products.images })
    .from(issuedTickets)
    .leftJoin(products, eq(issuedTickets.productId, products.id))
    .where(eq(issuedTickets.ticketCode, ticketCode))
    .limit(1);

  if (!rows.length) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const t = rows[0].ticket;
  const artwork = rows[0].artwork?.[0] ?? null;

  let png: Buffer;
  try {
    png = await renderTicketPass(
      {
        ticketCode: t.ticketCode,
        eventName: t.eventName,
        eventDate: t.eventDate,
        venue: t.venue,
        tier: t.tier,
        attendeeName: t.attendeeName,
        status: t.status,
      },
      artwork,
    );
  } catch (e) {
    console.error("[ticket-image] render failed:", (e as Error).message);
    return NextResponse.json({ error: "Could not render ticket" }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${t.ticketCode}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
