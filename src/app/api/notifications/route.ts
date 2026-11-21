export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getUserSession } from "@/lib/user-auth";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ notifications: [], unread: 0 });
  }

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(20);

  const unread = rows.filter((n) => !n.read).length;

  return NextResponse.json({ notifications: rows, unread });
}

export async function PATCH() {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, user.id));

  return NextResponse.json({ success: true });
}
