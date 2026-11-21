import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { collections } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { asc } from "drizzle-orm";

const collectionSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
  featured: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const result = await db
    .select()
    .from(collections)
    .orderBy(asc(collections.sortOrder));

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

  const parsed = collectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  try {
    const [collection] = await db
      .insert(collections)
      .values(parsed.data)
      .returning();
    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create collection. Slug may already exist." },
      { status: 500 }
    );
  }
}
