"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/utils";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Lock, CreditCard, Truck, Wand2, Tag } from "lucide-react";

// Pre-filled demo test card (Stripe-style test card) so checkout works
// instantly for testing — no real payment is ever processed.
const TEST_CARD = {
  cardNumber: "4242 4242 4242 4242",
  expiry: "12 / 34",
  cvc: "123",
};

const TEST_DETAILS = {
  email: "guest@nova-demo.com",
  fullName: "Alex Morgan",
  address: "123 Atelier Street",
  city: "New York",
  country: "United States",
  postalCode: "10001",
  phone: "+1 555 000 0000",
};

// Format card number with spaces every 4 digits
function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

// Format expiry as MM / YY
function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    fullName: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    phone: "",
    cardNumber: TEST_CARD.cardNumber,
    expiry: TEST_CARD.expiry,
    cvc: TEST_CARD.cvc,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Discount code state
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    label: string;
    amount: number;
  } | null>(null);
  const [discountStatus, setDiscountStatus] = useState<{
    type: "idle" | "checking" | "error" | "success";
    message: string;
  }>({ type: "idle", message: "" });

  const shipping = subtotal >= 20000 ? 0 : 1500;
  const discountAmount = appliedDiscount?.amount ?? 0;
  const total = Math.max(0, subtotal + shipping - discountAmount);

  const applyDiscount = async () => {
    const code = discountInput.trim();
    if (!code) return;
    setDiscountStatus({ type: "checking", message: "" });
    setAppliedDiscount(null);

    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedDiscount({
          code: data.code,
          label: data.label,
          amount: data.discountAmount,
        });
        setDiscountStatus({ type: "success", message: `Code applied: ${data.label}` });
      } else {
        setDiscountStatus({ type: "error", message: data.error || "Invalid code." });
      }
    } catch {
      setDiscountStatus({ type: "error", message: "Could not validate code." });
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput("");
    setDiscountStatus({ type: "idle", message: "" });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.email.includes("@")) next.email = "Please enter a valid email.";
    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    if (!form.address.trim()) next.address = "Address is required.";
    if (!form.city.trim()) next.city = "City is required.";
    if (!form.country.trim()) next.country = "Country is required.";
    if (!form.postalCode.trim()) next.postalCode = "Postal code is required.";
    // Lenient card validation for demo — just needs something entered
    if (form.cardNumber.replace(/\s/g, "").length < 4)
      next.cardNumber = "Please enter a card number.";
    if (!form.expiry.trim()) next.expiry = "Expiry is required.";
    if (!form.cvc.trim()) next.cvc = "CVC is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const fillDemoDetails = () => {
    setForm((f) => ({ ...f, ...TEST_DETAILS, ...TEST_CARD }));
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    // Simulate a brief payment-processing delay for realism
    await new Promise((r) => setTimeout(r, 900));

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
          })),
          shipping: {
            email: form.email,
            fullName: form.fullName,
            address: form.address,
            city: form.city,
            country: form.country,
            postalCode: form.postalCode,
            phone: form.phone,
          },
          total,
          discountCode: appliedDiscount?.code ?? null,
          discountAmount,
        }),
      });
      const data = await res.json();
      if (res.ok && data.orderId) {
        clearCart();
        const codes = (data.issuedTicketCodes ?? []).join(",");
        router.push(
          `/checkout/success?orderId=${data.orderId}&number=${
            data.orderNumber ?? ""
          }&tickets=${encodeURIComponent(codes)}`
        );
      } else {
        setErrors({ submit: data.error || "Checkout failed. Please try again." });
      }
    } catch {
      setErrors({ submit: "Checkout failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-32 text-center lg:px-10">
        <h1 className="font-serif text-4xl font-light text-ink">Your cart is empty</h1>
        <p className="mt-4 text-stone-600">
          Add a few pieces before checking out.
        </p>
        <a
          href="/shop"
          className="mt-6 inline-flex rounded-full bg-ink px-8 py-4 text-xs font-medium uppercase tracking-wide-2 text-paper transition-colors hover:bg-bronze"
        >
          Continue shopping
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <AnimatedSection>
        <p className="text-xs uppercase tracking-wide-2 text-bronze">Secure checkout</p>
        <h1 className="mt-2 font-serif text-4xl font-light text-ink lg:text-5xl">
          Checkout
        </h1>
      </AnimatedSection>

      {/* Demo banner */}
      <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-bronze/30 bg-bronze/5 p-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bronze/15 text-bronze">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">Demo checkout — no real charges</p>
            <p className="text-xs text-stone-500">
              Test card pre-filled. Use it or enter any details — your order will be placed.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fillDemoDetails}
          className="flex shrink-0 items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-wide-2 text-paper transition-colors hover:bg-bronze"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Auto-fill demo
        </button>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          className="space-y-10 lg:col-span-3"
        >
          {/* Shipping */}
          <section className="rounded-2xl border border-ink/10 bg-surface p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Truck className="h-5 w-5 text-ink" />
              <h2 className="font-serif text-xl text-ink">
                Shipping Details
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-ink/80">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-ink/40"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-ink/80">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-ink/40"
                  placeholder="Jane Doe"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-ink/80">
                  Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-ink/40"
                  placeholder="123 Main Street, Apt 4"
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/80">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-ink/40"
                  placeholder="New York"
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/80">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm({ ...form, postalCode: e.target.value })
                  }
                  className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-ink/40"
                  placeholder="10001"
                />
                {errors.postalCode && (
                  <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/80">
                  Country
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-ink/40"
                  placeholder="United States"
                />
                {errors.country && (
                  <p className="mt-1 text-xs text-red-600">{errors.country}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/80">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-ink/40"
                  placeholder="+1 555 000 0000"
                />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-ink/10 bg-surface p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-ink" />
              <h2 className="font-serif text-xl text-ink">
                Payment
              </h2>
            </div>
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-cream px-4 py-2.5 text-xs text-stone-500">
              <span className="flex h-1.5 w-1.5 rounded-full bg-bronze" />
              Demo mode — no real payment is processed. The test card is pre-filled.
            </div>
            <div className="grid gap-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/80">
                  Card Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cardNumber}
                  onChange={(e) =>
                    setForm({ ...form, cardNumber: formatCardNumber(e.target.value) })
                  }
                  className="w-full rounded-xl border border-ink/10 px-4 py-3 font-mono text-sm tracking-wider outline-none focus:border-ink/40"
                  placeholder="4242 4242 4242 4242"
                />
                {errors.cardNumber && (
                  <p className="mt-1 text-xs text-red-600">{errors.cardNumber}</p>
                )}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink/80">
                    Expiry
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.expiry}
                    onChange={(e) =>
                      setForm({ ...form, expiry: formatExpiry(e.target.value) })
                    }
                    className="w-full rounded-xl border border-ink/10 px-4 py-3 font-mono text-sm tracking-wider outline-none focus:border-ink/40"
                    placeholder="12 / 34"
                  />
                  {errors.expiry && (
                    <p className="mt-1 text-xs text-red-600">{errors.expiry}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink/80">
                    CVC
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.cvc}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cvc: e.target.value.replace(/\D/g, "").slice(0, 4),
                      })
                    }
                    className="w-full rounded-xl border border-ink/10 px-4 py-3 font-mono text-sm tracking-wider outline-none focus:border-ink/40"
                    placeholder="123"
                  />
                  {errors.cvc && (
                    <p className="mt-1 text-xs text-red-600">{errors.cvc}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {errors.submit && (
            <div className="flex items-start gap-3 rounded-xl bg-wine/10 px-4 py-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-wine" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <p className="text-sm text-wine">{errors.submit}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-cta-accent py-4 text-xs font-semibold uppercase tracking-wide-2 text-accent-ink transition-all duration-500 hover:bg-cta-accent-hover disabled:opacity-70 lg:hidden"
          >
            <Lock className="h-4 w-4" />
            {submitting ? "Processing..." : `Place order — ${formatPrice(total)}`}
          </button>
        </form>

        {/* Order Summary */}
        <aside className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-ink/10 bg-cream p-6 md:p-8">
            <h2 className="font-serif text-xl text-ink">
              Order Summary
            </h2>
            <ul className="mt-6 space-y-4">
              {items.map((item) => (
                <li key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">
                      {item.name}
                    </p>
                    <p className="text-xs text-stone-500">
                      {item.color} / Size {item.size} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            {/* Discount code input */}
            <div className="mt-6 border-t border-ink/10 pt-5">
              {appliedDiscount ? (
                <div className="flex items-center justify-between rounded-xl bg-bronze/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-bronze" />
                    <div>
                      <p className="font-mono text-sm font-medium text-ink">
                        {appliedDiscount.code}
                      </p>
                      <p className="text-xs text-bronze">{appliedDiscount.label} applied</p>
                    </div>
                  </div>
                  <button
                    onClick={removeDiscount}
                    className="text-xs text-stone-500 underline-offset-2 hover:text-wine hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide-2 text-stone-500">
                    Discount code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyDiscount())}
                      placeholder="Enter code"
                      className="flex-1 rounded-xl border border-ink/10 bg-paper px-4 py-2.5 font-mono text-sm uppercase outline-none focus:border-ink/40"
                    />
                    <button
                      onClick={applyDiscount}
                      disabled={discountStatus.type === "checking" || !discountInput.trim()}
                      className="rounded-xl bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-wide-2 text-paper transition-colors hover:bg-bronze disabled:opacity-60"
                    >
                      {discountStatus.type === "checking" ? "..." : "Apply"}
                    </button>
                  </div>
                  {discountStatus.type === "error" && (
                    <p className="mt-1.5 text-xs text-wine">✗ {discountStatus.message}</p>
                  )}
                  <p className="mt-1.5 text-[10px] text-stone-400">
                    Try <button onClick={() => setDiscountInput("WELCOME10")} className="font-mono underline">WELCOME10</button> or <button onClick={() => setDiscountInput("NOVA20")} className="font-mono underline">NOVA20</button>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3 border-t border-ink/10 pt-6 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-bronze">
                  <span>Discount ({appliedDiscount?.code})</span>
                  <span>−{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-ink/10 pt-3">
                <span className="font-serif text-lg text-ink">Total</span>
                <span className="font-serif text-2xl text-ink">{formatPrice(total)}</span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-6 hidden w-full items-center justify-center gap-2 rounded-full bg-cta-accent py-4 text-xs font-semibold uppercase tracking-wide-2 text-accent-ink transition-all duration-500 hover:bg-cta-accent-hover disabled:opacity-70 lg:flex"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
                    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Place order — {formatPrice(total)}
                </>
              )}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-stone-400">
              <Lock className="h-3 w-3" />
              Encrypted, secure checkout
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
