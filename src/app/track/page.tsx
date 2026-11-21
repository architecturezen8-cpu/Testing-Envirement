"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Search, Package, CheckCircle2, Truck, Clock, XCircle } from "lucide-react";

interface TrackedOrder {
  number: string;
  status: string;
  total: number;
  fullName: string;
  createdAt: string | null;
  items: {
    id: number;
    name: string;
    price: number;
    size: string | null;
    color: string | null;
    quantity: number;
  }[];
}

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "processing", label: "Confirmed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function getStepIndex(status: string) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function TrackContent() {
  const searchParams = useSearchParams();
  const [number, setNumber] = useState(searchParams.get("number") ?? "");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`/api/track?number=${encodeURIComponent(number.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setOrder(data);
      } else {
        setError(data.error || "Order not found");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if number in URL
  if (searchParams.get("number") && !order && !loading && !error) {
    const num = searchParams.get("number")!;
    search({ preventDefault: () => {} } as React.FormEvent);
    setNumber(num);
  }

  const currentStep = order ? getStepIndex(order.status) : 0;
  const isCancelled = order?.status === "cancelled";

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <div className="text-center">
        <p className="text-xs uppercase tracking-luxe text-bronze">Order tracking</p>
        <h1 className="mt-3 font-serif text-4xl font-light text-ink">Track your order</h1>
        <p className="mt-2 text-sm text-stone-500">
          Enter your order number to check its status.
        </p>
      </div>

      <form onSubmit={search} className="mt-8">
        <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-5 py-3 focus-within:border-ink/40">
          <Search className="h-4 w-4 shrink-0 text-stone-luxe" />
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="e.g. NV-ABCD123"
            className="w-full bg-transparent text-sm text-ink placeholder:text-stone-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-full bg-ink px-6 py-2 text-xs font-medium uppercase tracking-wide-2 text-paper transition-colors hover:bg-bronze disabled:opacity-70"
          >
            {loading ? "..." : "Track"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 rounded-2xl bg-wine/10 px-6 py-5 text-center">
          <p className="text-sm text-wine">{error}</p>
        </div>
      )}

      {order && (
        <div className="mt-8 animate-[fadeIn_0.4s_ease] rounded-2xl border border-ink/10 bg-paper p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif text-2xl text-ink">{order.number}</p>
              <p className="text-xs text-stone-500">
                {order.fullName} ·{" "}
                {new Date(order.createdAt ?? Date.now()).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide-2 ${
                isCancelled ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}
            >
              {order.status}
            </span>
          </div>

          {/* Progress tracker */}
          {isCancelled ? (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-red-50 px-5 py-4">
              <XCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700">This order has been cancelled.</p>
            </div>
          ) : (
            <div className="mt-8 flex items-center justify-between">
              {STATUS_STEPS.map((step, idx) => {
                const isComplete = idx <= currentStep;
                const isCurrent = idx === currentStep;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      {idx > 0 && (
                        <div
                          className={`h-0.5 flex-1 ${idx <= currentStep ? "bg-bronze" : "bg-ink/10"}`}
                        />
                      )}
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                          isComplete ? "bg-bronze text-paper" : "bg-ink/8 text-stone-400"
                        } ${isCurrent ? "ring-4 ring-bronze/20" : ""}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 ${idx < currentStep ? "bg-bronze" : "bg-ink/10"}`}
                        />
                      )}
                    </div>
                    <p
                      className={`mt-2 text-center text-[10px] uppercase tracking-wide-2 ${
                        isComplete ? "font-medium text-ink" : "text-stone-400"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Items */}
          <div className="mt-8 border-t border-ink/10 pt-6">
            <h3 className="mb-4 text-[11px] font-medium uppercase tracking-wide-2 text-stone-500">
              Items in this order
            </h3>
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-stone-500">
                      {item.color} · Size {item.size} × {item.quantity}
                    </p>
                  </div>
                  <span className="tabular-nums text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t border-ink/10 pt-4">
              <span className="font-serif text-lg text-ink">Total</span>
              <span className="font-serif text-xl text-ink">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="pt-24 text-center text-stone-500">Loading...</div>}>
      <TrackContent />
    </Suspense>
  );
}
