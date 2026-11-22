import QRCode from "qrcode";
import crypto from "node:crypto";

/**
 * Ticket issuing helpers.
 *
 * QR codes are generated server-side as data URLs so they can be embedded in
 * the ticket page and the email without any extra asset hosting.
 */

export function generateTicketCode(): string {
  // SCTC-<6 random uppercase chars> — unambiguous for reading out over a phone.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  let s = "";
  const bytes = crypto.randomBytes(6);
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return `SCTC-${s}`;
}

/** Payload encoded inside the QR — what the gate scanner would read. */
export function qrPayload(ticketCode: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base}/tickets/verify/${ticketCode}`;
}

export async function makeQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#0b1220", light: "#ffffff" },
  });
}

export type IssuedTicketLike = {
  ticketCode: string;
  eventName: string;
  eventDate: string | null;
  venue: string | null;
  tier: string | null;
  attendeeName: string;
  quantity: number;
  status: string;
};
