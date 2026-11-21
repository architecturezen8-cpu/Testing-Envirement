export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { discountCodes } from "@/db/schema";
import { eq } from "drizzle-orm";

// Public endpoint to validate a discount code against a cart subtotal.
// Returns the discount amount (in cents) or an error.
export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { code, subtotal } = body as { code?: string; subtotal?: number };

  if (!code || typeof subtotal !== "number") {
    return NextResponse.json(
      { error: "Code and subtotal are required." },
      { status: 400 }
    );
  }

  const normalized = code.trim().toUpperCase();

  const [discount] = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.code, normalized))
    .limit(1);

  if (!discount) {
    return NextResponse.json({ valid: false, error: "Invalid code." });
  }

  if (!discount.active) {
    return NextResponse.json({ valid: false, error: "This code is no longer active." });
  }

  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
    return NextResponse.json({ valid: false, error: "This code has expired." });
  }

  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    return NextResponse.json({ valid: false, error: "This code has reached its usage limit." });
  }

  if (subtotal < discount.minOrder) {
    return NextResponse.json({
      valid: false,
      error: `Minimum order of $${(discount.minOrder / 100).toFixed(0)} required for this code.`,
    });
  }

  // Calculate discount amount
  const value = Number(discount.value);
  let discountAmount: number;
  if (discount.type === "percentage") {
    discountAmount = Math.round((subtotal * value) / 100);
  } else {
    discountAmount = Math.round(value * 100); // fixed value in dollars → cents
  }
  // Cap at subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  return NextResponse.json({
    valid: true,
    code: discount.code,
    type: discount.type,
    description: discount.description,
    discountAmount,
    label:
      discount.type === "percentage"
        ? `${value}% off`
        : `$${value} off`,
  });
}


