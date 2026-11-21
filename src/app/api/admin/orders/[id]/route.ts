export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { orders, orderItems, notifications } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
});

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  pending: {
    title: "Order received",
    body: "We've received your order and it's awaiting confirmation.",
  },
  processing: {
    title: "Order confirmed",
    body: "Great news — your order has been confirmed and is being prepared for shipment.",
  },
  shipped: {
    title: "Order shipped",
    body: "Your order is on its way! Track your delivery with the courier soon.",
  },
  delivered: {
    title: "Order delivered",
    body: "Your order has been delivered. We hope you love it — leave us a review!",
  },
  cancelled: {
    title: "Order cancelled",
    body: "Your order has been cancelled. If you have questions, please contact us.",
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.id, Number(id)));

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return NextResponse.json({ ...order, items });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(orders)
    .set({ status: parsed.data.status })
    .where(eq(orders.id, Number(id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Create a notification for the linked user (if any)
  if (updated.userId) {
    const msg = STATUS_MESSAGES[parsed.data.status] ?? {
      title: "Order update",
      body: `Your order ${updated.number} status is now: ${parsed.data.status}.`,
    };
    await db.insert(notifications).values({
      userId: updated.userId,
      orderId: updated.id,
      orderNumber: updated.number,
      title: msg.title,
      body: msg.body,
      status: parsed.data.status,
      read: false,
    });
  }

  return NextResponse.json(updated);
}
