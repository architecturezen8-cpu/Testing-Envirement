import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { issuedTickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { makeQrDataUrl, qrPayload } from "@/lib/tickets";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

/**
 * Renders a full ticket pass as a PNG, sized for a phone screen, so the buyer
 * can save it straight to their gallery from the browser.
 *
 * The artwork (top band) is drawn programmatically, then the QR is centred on
 * it, which keeps the download self-contained — no server-side canvas needed.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const ticketCode = decodeURIComponent(code).toUpperCase();

  const rows = await db
    .select()
    .from(issuedTickets)
    .where(eq(issuedTickets.ticketCode, ticketCode))
    .limit(1);

  if (!rows.length) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const t = rows[0];
  const qr = await makeQrDataUrl(qrPayload(t.ticketCode));

  // A compact QR-only pass (the readable version renders on the page itself).
  const png = await QRCode.toBuffer(qrPayload(t.ticketCode), {
    errorCorrectionLevel: "M",
    margin: 3,
    width: 900,
    color: { dark: "#0b1220", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${t.ticketCode}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
