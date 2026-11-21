export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const result = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));

  const items = await db.select().from(orderItems);

  const ordersWithItems = result.map((order) => ({
    ...order,
    items: items.filter((i) => i.orderId === order.id),
  }));

  return NextResponse.json(ordersWithItems);
}
