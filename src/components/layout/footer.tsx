"use client";

import Link from "next/link";
import { SchoolCrest } from "@/components/layout/school-crest";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-paper">
      {/* Single navy bloom closing the page */}
      <div className="pointer-events-none absolute inset-0 bg-radial-navy-bottom" />
      {/* Links */}
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-16 md:grid-cols-2 lg:grid-cols-4 lg:px-10">
        <div className="md:col-span-2 lg:col-span-1">
          <span className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-black/10">
              <SchoolCrest className="h-8 w-8 text-navy" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold text-paper">St.Thomas&apos; College</span>
              <span className="mt-1.5 text-[10px] uppercase tracking-wide-2 text-paper/45">
                Matale. Est.1873.
              </span>
            </span>
          </span>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/55">
            The official store of St. Thomas&apos; College, Matale — college
            merchandises and event tickets for Thomians, parents and old boys.
          </p>
          <div className="mt-6 flex gap-3">
            {["IG", "PIN", "TT"].map((s) => (
              <a
                key={s}
                href="/"
                aria-label={s}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-paper/20 text-[10px] font-medium text-paper/70 transition-colors hover:border-gold hover:text-gold"
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-wide-2 text-paper/40">Shop</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/70">
            <li><Link href="/shop" className="transition-colors hover:text-paper">All Products</Link></li>
            <li><Link href="/shop?category=Clothing" className="transition-colors hover:text-paper">Clothing</Link></li>
            <li><Link href="/shop?category=Shoes" className="transition-colors hover:text-paper">Shoes</Link></li>
            <li><Link href="/shop?collection=featured" className="transition-colors hover:text-paper">Collections</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-wide-2 text-paper/40">Help</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/70">
            <li><Link href="/about" className="transition-colors hover:text-paper">About</Link></li>
            <li><Link href="/shipping" className="transition-colors hover:text-paper">Shipping & Returns</Link></li>
            <li><Link href="/contact" className="transition-colors hover:text-paper">Contact</Link></li>
            <li><Link href="/privacy" className="transition-colors hover:text-paper">Privacy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-wide-2 text-paper/40">The House</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/70">
            <li><span className="text-paper/70">We ship worldwide</span></li>
            <li><span className="text-paper/70">Free returns within 30 days</span></li>
            <li className="flex gap-1.5 pt-1">
              {["Visa", "MC", "Amex"].map((p) => (
                <span key={p} className="rounded border border-paper/15 px-1.5 py-0.5 text-[10px] text-paper/60">
                  {p}
                </span>
              ))}
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-paper/50 lg:flex-row lg:px-10">
          <p>© {new Date().getFullYear()} St. Thomas&apos; College, Matale. All rights reserved.</p>
          <p className="italic">&ldquo;Animo Et Fide&rdquo; — Courage &amp; Faith</p>
        </div>
      </div>
    </footer>
  );
}
