import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

export const dynamic = "force-dynamic";

const readFileAsync = promisify(readFile);
const statAsync = promisify(stat);

/**
 * Serves ticket artwork uploaded through the admin panel.
 *
 * Files dropped into `public/` after the server has booted are not served by
 * `next start` (the directory is snapshotted at startup), which made freshly
 * uploaded artwork 404. Serving it through this route means an upload is
 * visible immediately, on any host, without a restart.
 *
 * Only files inside public/uploads/tickets are readable, and the name is
 * validated so nothing outside that folder can be requested.
 */
const ROOT = path.join(process.cwd(), "public", "uploads", "tickets");

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;

  // Strip any path segments — we only accept a bare filename.
  const safe = path.basename(file);
  const ext = path.extname(safe).toLowerCase();

  const contentType = TYPES[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const full = path.join(ROOT, safe);

  try {
    const info = await statAsync(full);
    if (!info.isFile()) throw new Error("not a file");

    const data = await readFileAsync(full);

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(data.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
  }
}
