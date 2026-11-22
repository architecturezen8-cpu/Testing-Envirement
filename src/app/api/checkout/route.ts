import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { orders, orderItems, discountCodes, products, productVariants, issuedTickets } from "@/db/schema";
import { eq, sql, inArray, and } from "drizzle-orm";
import { getUserSession } from "@/lib/user-auth";
import { generateTicketCode, qrPayload, makeQrDataUrl } from "@/lib/tickets";
import { sendTicketEmail } from "@/lib/mailer";

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number(),
      name: z.string(),
      price: z.number(),
      size: z.string(),
      color: z.string(),
      quantity: z.number().min(1),
    })
  ),
  shipping: z.object({
    email: z.string().email(),
    fullName: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    postalCode: z.string().min(1),
    phone: z.string().optional(),
  }),
  total: z.number(),
  discountCode: z.string().optional().nullable(),
  discountAmount: z.number().optional().default(0),
});

function generateOrderNumber() {
  const part = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `NV-${part}${rand}`;
}

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    );
  }

  const { items, shipping, total, discountCode } = parsed.data;

  // Link order to logged-in user if session exists
  const session = await getUserSession();

  // ---- Variant stock validation BEFORE placing the order ----
  const productIds = items.map((i) => i.productId);
  const productRows = await db
    .select({ id: products.id, name: products.name, inStock: products.inStock })
    .from(products)
    .where(inArray(products.id, productIds));
  const productMap = new Map(productRows.map((r) => [r.id, r]));

  // Check each item's specific (size, color) variant has enough stock
  for (const item of items) {
    const prod = productMap.get(item.productId);
    if (!prod) {
      return NextResponse.json(
        { error: `Product "${item.name}" is no longer available.` },
        { status: 400 }
      );
    }

    // Look up the exact variant (size + color)
    const [variant] = await db
      .select({ stock: productVariants.stock })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, item.productId),
          eq(productVariants.size, item.size),
          eq(productVariants.color, item.color)
        )
      )
      .limit(1);

    const variantStock = variant?.stock;

    // If we have variant tracking, use it; otherwise fall back to product stock
    if (variantStock !== undefined) {
      if (variantStock < item.quantity) {
        return NextResponse.json(
          {
            error:
              variantStock === 0
                ? `Sorry, "${prod.name}" in ${item.color} / Size ${item.size} is now out of stock.`
                : `Only ${variantStock} of "${prod.name}" in ${item.color} / Size ${item.size} left (you requested ${item.quantity}).`,
          },
          { status: 400 }
        );
      }
    } else if (!prod.inStock) {
      return NextResponse.json(
        { error: `Sorry, "${prod.name}" is now out of stock.` },
        { status: 400 }
      );
    }
  }

  // ---- Ticket metadata for the event-ticket lines in this order ----
  const ticketRows = await db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      description: products.description,
    })
    .from(products)
    .where(inArray(products.id, productIds));

  const ticketProductIds = new Set(
    ticketRows.filter((r) => r.category === "Event Tickets").map((r) => r.id)
  );

  const ticketMeta = new Map(
    ticketRows.map((r) => [
      r.id,
      {
        name: r.name,
        eventDate: r.description.split("Event: ")[1]?.split("\n")[0] ?? null,
        venue: r.description.split("Venue: ")[1]?.split("\n")[0] ?? null,
        tier: r.description.split("Tier: ")[1]?.split("\n")[0] ?? "General",
      },
    ])
  );

  const issuedCodes: string[] = [];

  try {
    const [order] = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(orders)
        .values({
          number: generateOrderNumber(),
          email: session ? session.email : shipping.email,
          fullName: shipping.fullName,
          address: shipping.address,
          city: shipping.city,
          country: shipping.country,
          postalCode: shipping.postalCode,
          phone: shipping.phone,
          total,
          userId: session ? session.id : null,
        })
        .returning();

      // Increment discount code usage if applied
      if (discountCode) {
        await tx
          .update(discountCodes)
          .set({ usageCount: sql`${discountCodes.usageCount} + 1` })
          .where(eq(discountCodes.code, discountCode.toUpperCase()));
      }

      const insertedItems = await tx
        .insert(orderItems)
        .values(
          items.map((item) => ({
            orderId: created.id,
            productId: item.productId,
            name: item.name,
            price: item.price,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          }))
        )
        .returning();

      // ---- Issue one ticket per event-ticket line item ----
      // Only lines whose product is an Event Ticket get a QR pass; clothing
      // lines are fulfilled physically and need none.
      const ticketLines = insertedItems.filter((item) =>
        ticketProductIds.has(item.productId)
      );

      const issuedPasses: {
        ticketCode: string;
        eventName: string;
        eventDate: string;
        venue: string;
        tier: string;
        attendeeName: string;
        quantity: number;
        qr: string;
      }[] = [];

      for (const line of ticketLines) {
        const meta = ticketMeta.get(line.productId);
        const ticketCode = generateTicketCode();
        const payload = qrPayload(ticketCode);
        const qr = await makeQrDataUrl(payload);

        await tx.insert(issuedTickets).values({
          ticketCode,
          orderId: created.id,
          orderItemId: line.id,
          productId: line.productId,
          attendeeName: shipping.fullName,
          email: created.email,
          eventName: meta?.name ?? line.name,
          eventDate: meta?.eventDate ?? null,
          venue: meta?.venue ?? null,
          tier: meta?.tier ?? "General",
          quantity: line.quantity,
          unitPrice: line.price,
          status: "valid",
        });

        issuedCodes.push(ticketCode);
        issuedPasses.push({
          ticketCode,
          eventName: meta?.name ?? line.name,
          eventDate: meta?.eventDate ?? "",
          venue: meta?.venue ?? "",
          tier: meta?.tier ?? "General",
          attendeeName: shipping.fullName,
          quantity: line.quantity,
          qr,
        });
      }

      // ---- Email the tickets (best effort; never blocks the order) ----
      if (issuedPasses.length) {
        // Deliberately NOT awaited: a slow or unreachable SMTP server must
        // never delay the order confirmation. Failures are logged only.
        void sendTicketEmail({
          to: created.email,
          orderNumber: created.number,
          buyerName: shipping.fullName,
          tickets: issuedPasses,
        }).catch((e) =>
          console.error("[checkout] ticket email failed:", e.message),
        );
      }

      // ---- Decrement stock for each ordered item ----
      // Variant stock is the source of truth; product total is re-derived from it
      for (const item of items) {
        // Decrement the specific variant stock
        await tx
          .update(productVariants)
          .set({ stock: sql`GREATEST(${productVariants.stock} - ${item.quantity}, 0)` })
          .where(
            and(
              eq(productVariants.productId, item.productId),
              eq(productVariants.size, item.size),
              eq(productVariants.color, item.color)
            )
          );

        // Re-derive product total stock = SUM of all its variant stocks (always in sync!)
        const [recount] = await tx
          .select({ total: sql<number>`COALESCE(SUM(${productVariants.stock}), 0)::int` })
          .from(productVariants)
          .where(eq(productVariants.productId, item.productId));

        await tx
          .update(products)
          .set({ stock: recount.total, inStock: recount.total > 0 })
          .where(eq(products.id, item.productId));
      }

      return [created];
    });

    return NextResponse.json(
      {
        orderId: order.id,
        orderNumber: order.number,
        // The buyer is sent straight to their passes when the order
        // contained event tickets.
        issuedTicketCodes: issuedCodes,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Unable to process checkout. Please try again." },
      { status: 500 }
    );
  }
}
