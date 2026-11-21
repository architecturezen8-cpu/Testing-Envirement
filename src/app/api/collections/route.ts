export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/db";
import { collections } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const result = await db
    .select()
    .from(collections)
    .orderBy(asc(collections.sortOrder));
  return NextResponse.json(result);
}
