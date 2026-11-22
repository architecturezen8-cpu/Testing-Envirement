import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { desc, eq, sql, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Event tickets live in the same `products` table (so the cart, checkout and
 * stock logic stay shared), but they are created only through this endpoint,
 * which composes the ticket-specific fields the storefront reads:
 *
 *   description:  "<blurb>\n\nEvent: <date>\nVenue: <venue>\nTier: <tier>"
 *   category:     "Event Tickets"
 *   colors:       []          (tickets have no colour dimension)
 *   sizes:        the quantity tiers the buyer can choose
 */

const TICKET_TIERS = [
  { value: "1 Ticket", count: 1 },
  { value: "2 Tickets", count: 2 },
  { value: "3 Tickets", count: 3 },
  { value: "4 Tickets", count: 4 },
  { value: "Family Pass", count: 4, family: true },
  { value: "Custom", count: 1, custom: true },
];

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function composeDescription(
  blurb: string,
  eventDate: string,
  venue: string,
  tier: string,
) {
  return [
    blurb.trim(),
    "",
    `Event: ${eventDate.trim() || "Date to be announced"}`,
    `Venue: ${venue.trim() || "College grounds"}`,
    `Tier: ${tier.trim() || "General"}`,
  ].join("\n");
}

const ticketSchema = z.object({
  eventName: z.string().min(2),
  eventDate: z.string().min(1),
  venue: z.string().min(1),
  tier: z.string().min(1),
  blurb: z.string().min(1),
  price: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().optional().nullable(),
  badge: z.string().optional().nullable(),
  tiers: z.array(z.string()).min(1),
  stock: z.number().int().min(0).default(200),
  slug: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const tickets = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      category: products.category,
      gender: products.gender,
      sizes: products.sizes,
      colors: products.colors,
      images: products.images,
      stock: sql<number>`(
        select coalesce(min(v.stock), products.stock)
        from product_variants v
        where v.product_id = products.id
      )::int`,
      inStock: products.inStock,
      badge: products.badge,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(eq(products.category, "Event Tickets"))
    .orderBy(desc(products.createdAt));

  return NextResponse.json(tickets);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ticketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  const t = parsed.data;
  const slug = slugify(t.slug || t.eventName);

  // Guard against duplicate slugs.
  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  if (existing.length) {
    return NextResponse.json(
      { error: `A ticket with the URL slug "${slug}" already exists.` },
      { status: 409 },
    );
  }

  const [created] = await db
    .insert(products)
    .values({
      name: t.eventName,
      slug,
      description: composeDescription(t.blurb, t.eventDate, t.venue, t.tier),
      price: t.price,
      compareAtPrice: t.compareAtPrice ?? null,
      category: "Event Tickets",
      gender: "Unisex",
      sizes: t.tiers,
      colors: [],
      images: ["/images/school-3.jpg"],
      rating: "5",
      reviewCount: 0,
      stock: t.stock,
      inStock: t.stock > 0,
      badge: t.badge?.trim() ? t.badge.trim() : null,
      offerActive: Boolean(t.compareAtPrice && t.compareAtPrice > t.price),
      offerLabel:
        t.compareAtPrice && t.compareAtPrice > t.price ? "Early bird" : null,
    })
    .returning();

  // One variant per tier, so the storefront's tier picker works out of the box.
  const tierRows = t.tiers.map((size) => ({
    productId: created.id,
    size,
    color: "—",
    stock: t.stock,
  }));
  if (tierRows.length) {
    await db.insert(productVariants).values(tierRows);
  }

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.delete(productVariants).where(eq(productVariants.productId, id));
  await db.delete(products).where(and(eq(products.id, id), eq(products.category, "Event Tickets")));

  return NextResponse.json({ ok: true });
}

export { TICKET_TIERS };
