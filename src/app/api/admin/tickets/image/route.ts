import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, ticketThumbnails } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

/**
 * Ticket artwork upload.
 *
 * The admin uploads the finished ticket design (an image that includes a blank
 * white square where the QR belongs). The file is stored under
 * public/uploads/tickets and the resulting URL is written onto the ticket
 * product's `images` array.
 *
 * Accepted: png / jpg / webp, up to 8 MB.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  const productId = Number(form.get("productId"));
  /** "artwork" = the printed design the QR is drawn onto; "thumbnail" = the
   *  photo shoppers see in the shop grid. */
  const target = form.get("target") === "thumbnail" ? "thumbnail" : "artwork";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "File is larger than 8 MB" }, { status: 400 });
  }

  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PNG, JPG or WebP images are accepted" },
      { status: 400 },
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", "tickets");
  mkdirSync(dir, { recursive: true });

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const name = `ticket-${productId}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  writeFileSync(path.join(dir, name), bytes);

  // Served through an API route rather than /public, so an upload is visible
  // immediately without restarting the server.
  const url = `/api/uploads/tickets/${name}`;

  if (target === "thumbnail") {
    // Reference photo for the shop grid — the ticket artwork is left alone.
    await db
      .insert(ticketThumbnails)
      .values({ productId, imageUrl: url })
      .onConflictDoUpdate({
        target: ticketThumbnails.productId,
        set: { imageUrl: url, updatedAt: new Date() },
      });

    return NextResponse.json({ ok: true, url, target });
  }

  // Store as the first image so it becomes the ticket's artwork everywhere.
  const [existing] = await db
    .select({ images: products.images })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  const previous = (existing?.images ?? []) as string[];
  const images = [url, ...previous.filter((i) => i !== url)];

  await db.update(products).set({ images }).where(eq(products.id, productId));

  return NextResponse.json({ ok: true, url, images, target });
}
