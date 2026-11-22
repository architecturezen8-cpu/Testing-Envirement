import sharp from "sharp";
import QRCode from "qrcode";
import { readFile } from "node:fs";
import { promisify } from "node:util";

const readFileAsync = promisify(readFile);
import path from "node:path";

/**
 * Builds the full ticket pass image (artwork with the QR composited over it).
 *
 * Shared by the email delivery and the downloadable PNG so the buyer sees the
 * same design in both places. When the ticket has no uploaded artwork a clean
 * typographic pass is generated instead.
 */

export type PassTicket = {
  ticketCode: string;
  eventName: string;
  eventDate: string | null;
  venue: string | null;
  tier: string | null;
  attendeeName: string;
  status: string;
};

/** Fetches the uploaded artwork through the local upload route. */
async function loadArtwork(url: string): Promise<Buffer> {
  // Only uploaded artwork is fetched this way; it always lives in
  // public/uploads/tickets and is a bare filename.
  const fileName = path.basename(url);
  const full = path.join(process.cwd(), "public", "uploads", "tickets", fileName);

  try {
    const raw = await readFileAsync(full);
    // Re-encode so a slightly malformed upload still composites cleanly.
    return await sharp(raw, { failOn: "none" }).png().toBuffer();
  } catch (e) {
    // Fall back to fetching through the upload route (hosted deployments).
    const res = await fetch(
      `http://127.0.0.1:${process.env.PORT ?? 3000}/api/uploads/${fileName}`,
    );
    if (!res.ok) throw new Error("artwork unavailable");
    return sharp(Buffer.from(await res.arrayBuffer()), { failOn: "none" })
      .png()
      .toBuffer();
  }
}

/** Finds the largest near-white rectangle, in source pixel coordinates. */
async function findWhiteSquare(
  buffer: Buffer,
  sourceWidth: number,
  sourceHeight: number,
): Promise<{ left: number; top: number; width: number; height: number }> {
  const cw = 200;
  const ch = Math.max(1, Math.round((sourceHeight / sourceWidth) * cw));

  const { data, info } = await sharp(buffer, { failOn: "none" })
    .resize(cw, ch, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const isWhite = (i: number) => {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Strict: a genuinely blank white area, not a light-grey print artefact.
    return r > 235 && g > 235 && b > 235 && Math.abs(r - g) < 8 && Math.abs(g - b) < 8;
  };

  let bestArea = 0;
  let best = {
    left: Math.round(info.width * 0.62),
    top: Math.round(info.height * 0.28),
    width: Math.round(info.width * 0.3),
    height: Math.round(info.height * 0.3),
  };

  for (let y0 = 0; y0 < info.height; y0++) {
    for (let y1 = info.height - 1; y1 > y0; y1--) {
      const rowSpan = y1 - y0 + 1;
      if (rowSpan < 3) break;

      let x0 = -1;
      for (let x = 0; x <= info.width; x++) {
        let full = false;
        if (x < info.width) {
          full = true;
          for (let y = y0; y <= y1; y++) {
            if (!isWhite((y * info.width + x) * info.channels)) {
              full = false;
              break;
            }
          }
        }

        if (full && x0 === -1) x0 = x;
        if (!full && x0 !== -1) {
          const colSpan = x - x0;
          if (colSpan > 3 && rowSpan > 3) {
            const area = rowSpan * colSpan;
            if (area > bestArea) {
              bestArea = area;
              best = { left: x0, top: y0, width: colSpan, height: rowSpan };
            }
          }
          x0 = -1;
        }
      }
    }
  }

  return {
    left: Math.round(best.left * (sourceWidth / info.width)),
    top: Math.round(best.top * (sourceHeight / info.height)),
    width: Math.round(best.width * (sourceWidth / info.width)),
    height: Math.round(best.height * (sourceHeight / info.height)),
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Typographic fallback pass when no artwork has been uploaded. */
async function typographicPass(
  ticket: PassTicket,
  qrBuffer: Buffer,
): Promise<Buffer> {
  const W = 900;
  const H = 500;

  const label = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="#ffffff"/>
      <rect width="${W}" height="90" fill="#0b1220"/>
      <text x="${W / 2}" y="46" font-family="Georgia, serif" font-size="30"
            fill="#ffffff" text-anchor="middle" letter-spacing="6">ST. THOMAS' COLLEGE</text>
      <text x="${W / 2}" y="72" font-family="Arial, sans-serif" font-size="15"
            fill="#9ca3af" text-anchor="middle" letter-spacing="3">MATALE · EST. 1873</text>

      <text x="60" y="160" font-family="Arial, sans-serif" font-size="13"
            fill="#9ca3af" letter-spacing="2">EVENT</text>
      <text x="60" y="190" font-family="Georgia, serif" font-size="26"
            fill="#111827">${escapeXml(ticket.eventName.slice(0, 42))}</text>

      <text x="60" y="245" font-family="Arial, sans-serif" font-size="13"
            fill="#9ca3af" letter-spacing="2">DATE</text>
      <text x="60" y="273" font-family="Arial, sans-serif" font-size="19"
            fill="#111827">${escapeXml(ticket.eventDate || "Date TBA")}</text>

      <text x="60" y="325" font-family="Arial, sans-serif" font-size="13"
            fill="#9ca3af" letter-spacing="2">VENUE</text>
      <text x="60" y="353" font-family="Arial, sans-serif" font-size="19"
            fill="#111827">${escapeXml(ticket.venue || "")}</text>

      <text x="60" y="420" font-family="Arial, sans-serif" font-size="13"
            fill="#9ca3af" letter-spacing="2">ATTENDEE</text>
      <text x="60" y="448" font-family="Arial, sans-serif" font-size="19"
            fill="#111827">${escapeXml(ticket.attendeeName)}</text>

      <text x="${W - 60}" y="420" font-family="Arial, sans-serif" font-size="13"
            fill="#9ca3af" letter-spacing="2" text-anchor="end">TIER</text>
      <text x="${W - 60}" y="448" font-family="Arial, sans-serif" font-size="19"
            fill="#111827" text-anchor="end">${escapeXml(ticket.tier || "")}</text>

      <text x="${W / 2}" y="${H - 28}" font-family="monospace" font-size="20"
            fill="#111827" text-anchor="middle" letter-spacing="3">${ticket.ticketCode}</text>
    </svg>`,
  );

  const qrResized = await sharp(qrBuffer)
    .resize(260, 260, { fit: "contain", background: "#ffffff" })
    .png()
    .toBuffer();

  return sharp(label)
    .composite([{ input: qrResized, left: W - 320, top: 150 }])
    .png()
    .toBuffer();
}

/**
 * Renders the full pass as a PNG buffer.
 *
 * `artworkUrl` is the ticket product's first image. When it is an uploaded
 * ticket design the QR is composited over the detected white square; otherwise
 * a typographic pass is generated.
 */
export async function renderTicketPass(
  ticket: PassTicket,
  artworkUrl: string | null | undefined,
): Promise<Buffer> {
  // margin 0: the white square in the artwork already provides padding, so
  // the code fills 80% of the detected square rather than shrinking further.
  const qrBuffer = await QRCode.toBuffer(qrCodePayload(ticket.ticketCode), {
    errorCorrectionLevel: "M",
    margin: 0,
    width: 420,
    color: { dark: "#0b1220", light: "#ffffff" },
  });

  const isUploadedArtwork = Boolean(artworkUrl?.startsWith("/api/uploads/"));

  if (isUploadedArtwork) {
    try {
      const art = await loadArtwork(artworkUrl as string);
      const base = sharp(art).rotate();
      const meta = await base.metadata();
      const width = meta.width ?? 800;
      const height = meta.height ?? Math.round(width * 1.25);

      const square = await findWhiteSquare(await base.toBuffer(), width, height);

      // The QR has to sit INSIDE the white square the artwork leaves for it.
      // Take the smaller of the square's two dimensions (so a tall thin block
      // still yields a square QR) and keep a little padding around it.
      const fitSize = Math.min(square.width, square.height);
      // 80% of the square, leaving visible padding around the code.
      const qrSize = Math.max(
        72,
        Math.round(fitSize * 0.8),
      );

      // Clamp to the artwork bounds.
      const maxByArt = Math.min(width, height);
      const finalSize = Math.min(qrSize, maxByArt);

      const qrResized = await sharp(qrBuffer)
        .resize(finalSize, finalSize, { fit: "contain", background: "#ffffff" })
        .png()
        .toBuffer();

      // Centred on the square, then clamped so the QR never runs off the edge.
      let left = Math.round(square.left + square.width / 2 - finalSize / 2);
      let top = Math.round(square.top + square.height / 2 - finalSize / 2);
      left = Math.max(0, Math.min(left, width - finalSize));
      top = Math.max(0, Math.min(top, height - finalSize));

      return await base
        .composite([
          { input: qrResized, left, top },
        ])
        .png()
        .toBuffer();
    } catch (e) {
      console.error("[ticket-pass] artwork compositing failed:", (e as Error).message, "\nSTACK:", (e as Error).stack?.split("\n").slice(0,4).join(" <- "));
    }
  }

  return typographicPass(ticket, qrBuffer);
}

function qrCodePayload(ticketCode: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base}/tickets/verify/${ticketCode}`;
}

export { makeQrDataUrl, qrPayload } from "./tickets";
