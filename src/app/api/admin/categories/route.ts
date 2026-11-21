import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).transform((v) => v.trim().toLowerCase()),
  sortOrder: z.number().int().default(0),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const result = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return NextResponse.json(result);
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

  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const [created] = await db
      .insert(categories)
      .values(parsed.data)
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Category already exists or invalid data." },
      { status: 500 }
    );
  }
}
