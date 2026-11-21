import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Track an order by its order number — no login required
export async function GET(request: NextRequest) {
  const number = request.nextUrl.searchParams.get("number");

  if (!number) {
    return NextResponse.json(
      { error: "Please provide an order number." },
      { status: 400 }
    );
  }

  const normalized = number.trim().toUpperCase();

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.number, normalized))
    .limit(1);

  if (!order) {
    return NextResponse.json(
      { error: "No order found with this number. Please check and try again." },
      { status: 404 }
    );
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return NextResponse.json({
    number: order.number,
    status: order.status,
    total: order.total,
    fullName: order.fullName,
    createdAt: order.createdAt,
    items,
  });
}
