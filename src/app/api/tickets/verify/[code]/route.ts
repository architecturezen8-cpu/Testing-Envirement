import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { issuedTickets } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * What the QR code at the gate resolves to.
 *
 * Scanning the code opens this page, which marks the ticket as used the first
 * time it is loaded and displays the result — a simple gate-check flow that
 * needs no separate scanner app.
 */
async function handle(request: NextRequest, code: string, markUsed: boolean) {
  const ticketCode = decodeURIComponent(code).toUpperCase();

  const rows = await db
    .select()
    .from(issuedTickets)
    .where(eq(issuedTickets.ticketCode, ticketCode))
    .limit(1);

  if (!rows.length) {
    return NextResponse.json({ valid: false, reason: "not-found" }, { status: 404 });
  }

  const t = rows[0];

  if (t.status === "cancelled") {
    return NextResponse.json({ valid: false, reason: "cancelled", ticket: t });
  }

  if (t.status === "used") {
    return NextResponse.json({
      valid: false,
      reason: "already-scanned",
      scannedAt: t.scannedAt,
      ticket: t,
    });
  }

  if (markUsed) {
    await db
      .update(issuedTickets)
      .set({ status: "used", scannedAt: new Date() })
      .where(eq(issuedTickets.id, t.id));
  }

  return NextResponse.json({
    valid: true,
    ticket: { ...t, scannedAt: markUsed ? new Date() : t.scannedAt },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  return handle(request, code, false);
}

/** The gate check-in action. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  return handle(request, code, true);
}
