export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { discountCodes } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { desc } from "drizzle-orm";

const discountSchema = z.object({
  code: z.string().min(2).transform((v) => v.trim().toUpperCase()),
  description: z.string().optional().nullable(),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive(),
  minOrder: z.number().int().min(0).default(0),
  usageLimit: z.number().int().positive().optional().nullable(),
  active: z.boolean().default(true),
  expiresAt: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const result = await db
    .select()
    .from(discountCodes)
    .orderBy(desc(discountCodes.createdAt));

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

  const parsed = discountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const { expiresAt, value, ...rest } = parsed.data;
    const [created] = await db
      .insert(discountCodes)
      .values({
        ...rest,
        value: String(value),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Code already exists or invalid data." },
      { status: 500 }
    );
  }
}
