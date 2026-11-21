"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("number");

  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center lg:px-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-ink text-paper">
        <CheckCircle className="h-10 w-10" />
      </div>
      <p className="mt-8 text-xs uppercase tracking-luxe text-bronze">Order confirmed</p>
      <h1 className="mt-3 font-serif text-4xl font-light text-ink md:text-5xl">
        Thank you for your order
      </h1>
      <p className="mt-4 text-stone-600">
        Your order has been placed successfully. You will receive a confirmation email shortly.
      </p>

      {orderNumber && (
        <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-4 rounded-2xl border border-ink/10 bg-cream px-6 py-4">
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wide-2 text-stone-500">Order number</p>
            <p className="font-serif text-xl text-ink">{orderNumber}</p>
          </div>
          <Link
            href={`/track?number=${orderNumber}`}
            className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-wide-2 text-paper transition-colors hover:bg-bronze"
          >
            Track order
          </Link>
        </div>
      )}

      <p className="mt-6 text-xs text-stone-400">
        Save your order number to track your delivery anytime.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/shop"
          className="rounded-full bg-ink px-8 py-4 text-xs font-medium uppercase tracking-wide-2 text-paper transition-colors hover:bg-bronze"
        >
          Continue shopping
        </Link>
        <Link
          href="/"
          className="rounded-full border border-ink/20 px-8 py-4 text-xs font-medium uppercase tracking-wide-2 text-ink transition-colors hover:border-ink"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="pt-24 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
