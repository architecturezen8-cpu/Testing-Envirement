"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-context";
import { formatPrice } from "@/lib/utils";

const FREE_SHIPPING_THRESHOLD = 20000; // $200 in cents

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    subtotal,
  } = useCart();

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-md flex-col bg-paper bg-sheen-light shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <div className="flex items-baseline gap-2">
                <h2 className="font-serif text-xl text-ink">Your Bag</h2>
                <span className="text-sm tabular-nums text-stone-500">
                  ({items.reduce((n, i) => n + i.quantity, 0)})
                </span>
              </div>
              <button
                onClick={closeCart}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
                aria-label="Close cart"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            {/* Free shipping progress */}
            {items.length > 0 && (
              <div className="border-b border-ink/10 px-6 py-4">
                <p className="text-xs text-stone-600">
                  {remaining > 0 ? (
                    <>
                      You&apos;re <span className="font-medium text-ink">{formatPrice(remaining)}</span> away from{" "}
                      <span className="font-medium text-ink">free shipping</span>
                    </>
                  ) : (
                    <span className="font-medium text-bronze">✓ You&apos;ve unlocked free shipping</span>
                  )}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                  <motion.div
                    className="h-full rounded-full bg-bronze"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream">
                  <ShoppingBag className="h-7 w-7 text-stone-400" />
                </div>
                <div>
                  <p className="font-serif text-lg text-ink">Your bag is empty</p>
                  <p className="mt-1 text-sm text-stone-500">Discover pieces worth keeping.</p>
                </div>
                <Link
                  href="/shop"
                  onClick={closeCart}
                  className="mt-2 rounded-full bg-ink px-6 py-3 text-xs font-medium uppercase tracking-wide-2 text-paper transition-colors hover:bg-bronze"
                >
                  Start shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6">
                  <ul className="divide-y divide-ink/8">
                    {items.map((item) => (
                      <li key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 py-5">
                        <div className="relative h-28 w-22 shrink-0 overflow-hidden rounded-lg bg-cream" style={{ width: "5.5rem" }}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="88px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <Link
                              href={`/products/${item.slug}`}
                              onClick={closeCart}
                              className="font-serif text-[15px] leading-tight text-ink transition-colors hover:text-bronze"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-1 text-xs text-stone-500">
                              {item.color} / Size {item.size}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 rounded-full border border-ink/15">
                              <button
                                onClick={() =>
                                  updateQuantity(item.productId, item.size, item.color, item.quantity - 1)
                                }
                                className="flex h-7 w-7 items-center justify-center text-ink transition-colors hover:text-bronze"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-xs tabular-nums">{item.quantity}</span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.productId, item.size, item.color, item.quantity + 1)
                                }
                                className="flex h-7 w-7 items-center justify-center text-ink transition-colors hover:text-bronze"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-sm tabular-nums text-ink">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                              <button
                                onClick={() => removeItem(item.productId, item.size, item.color)}
                                className="text-xs text-stone-400 underline-offset-2 transition-colors hover:text-wine hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer */}
                <div className="border-t border-ink/10 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">Subtotal</span>
                    <span className="font-serif text-xl text-ink">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    Shipping &amp; taxes calculated at checkout.
                  </p>
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-cta-accent py-4 text-xs font-semibold uppercase tracking-wide-2 text-accent-ink transition-all duration-500 hover:bg-cta-accent-hover"
                  >
                    Checkout →
                  </Link>
                  <button
                    onClick={closeCart}
                    className="mt-2 w-full py-2 text-center text-xs uppercase tracking-wide-2 text-stone-500 transition-colors hover:text-ink"
                  >
                    Continue shopping
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
