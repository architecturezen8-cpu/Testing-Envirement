"use client";

import Link from "next/link";
import { ShoppingBag, Menu, X, Search, Heart, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/components/cart/cart-context";
import { useUser } from "@/components/auth/user-provider";
import { useFavorites } from "@/components/favorites/favorites-context";
import { NotificationBell } from "@/components/auth/notification-bell";
import { SchoolCrest } from "@/components/layout/school-crest";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { User as UserIcon } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

const navLinks: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Shop",
    href: "/shop",
    children: [
      { label: "Merchandises", href: "/shop?category=Clothing" },
      { label: "Event Tickets", href: "/shop?category=Shoes" },
    ],
  },
  { label: "Contact", href: "/contact" },
  { label: "Track My Order", href: "/track" },
];

export function Header() {
  const { itemCount, openCart } = useCart();
  const { user, loading } = useUser();
  const { count: favCount } = useFavorites();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShopOpen(false);
  }, [pathname]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(query.trim() ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-300",
          scrolled
            ? "border-b border-navy-hairline bg-paper/85 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl"
            : "border-b border-transparent bg-paper/60 backdrop-blur-md",
        )}
      >
        {/* 1fr / auto / 1fr grid keeps the nav dead-centre on the page */}
        <div className="mx-auto grid h-20 max-w-[1400px] grid-cols-[auto_1fr_auto] items-center gap-4 px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
          {/* ---- Left: white circle crest + two-line wordmark ---- */}
          <Link href="/" className="group flex shrink-0 items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_6px_20px_-8px_rgba(0,0,0,0.55)] ring-1 ring-black/10 transition-transform duration-500 group-hover:scale-105">
              <SchoolCrest className="h-9 w-9 text-navy" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-tight text-ink">
                St.Thomas&apos; College
              </span>
              <span className="mt-1.5 text-[10px] uppercase tracking-wide-2 text-stone-400">
                Matale. Est.1873.
              </span>
            </span>
          </Link>

          {/* ---- Center: navigation (centred in its own column) ---- */}
          <nav className="hidden items-center justify-center gap-9 lg:flex">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setShopOpen(true)}
                  onMouseLeave={() => setShopOpen(false)}
                >
                  <button
                    onClick={() => setShopOpen((o) => !o)}
                    className={cn(
                      "link-underline flex items-center gap-1.5 text-[12.5px] uppercase tracking-wide-2 transition-colors",
                      pathname === link.href ? "text-ink" : "text-ink/70 hover:text-ink",
                    )}
                    aria-expanded={shopOpen}
                  >
                    {link.label}
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-300",
                        shopOpen && "rotate-180",
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {shopOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 pt-3"
                      >
                        <div className="overflow-hidden rounded-2xl border border-navy-hairline bg-surface-navy bg-sheen-light shadow-navy">
                          {link.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="block px-5 py-3 text-[12.5px] uppercase tracking-wide-2 text-ink/80 transition-colors hover:bg-ink/10 hover:text-ink"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "link-underline text-[12.5px] uppercase tracking-wide-2 transition-colors",
                    pathname === link.href ? "text-ink" : "text-ink/70 hover:text-ink",
                  )}
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          {/* ---- Right: search + account + favourites + cart ---- */}
          <div className="flex flex-1 items-center justify-end gap-1">
            <button
              className="flex h-10 w-10 items-center justify-center text-ink lg:hidden"
              onClick={() => setMobileOpen((s) => !s)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <form onSubmit={onSearch} className="hidden items-center lg:flex">
              <div className="flex items-center rounded-full border border-ink/15 px-3 py-1.5 transition-colors focus-within:border-ink/40">
                <Search className="h-3.5 w-3.5 text-stone-luxe" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-20 bg-transparent px-2 text-sm text-ink placeholder:text-stone-400 focus:outline-none"
                />
              </div>
            </form>

            <NotificationBell />

            {/* Account — desktop only; mobile & tablet use the drawer */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
                aria-label="Account"
              >
                {user ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cta-accent text-xs font-semibold text-accent-ink">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <UserIcon className="h-[18px] w-[18px]" />
                )}
              </button>
              <AnimatePresence>
                {accountOpen && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    onMouseLeave={() => setAccountOpen(false)}
                    className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-navy-hairline bg-surface-navy bg-sheen-light shadow-navy"
                  >
                    {user ? (
                      <div className="py-1">
                        <div className="border-b border-ink/8 px-4 py-3">
                          <p className="text-sm font-medium text-ink">{user.name}</p>
                          <p className="truncate text-xs text-stone-500">{user.email}</p>
                        </div>
                        <Link href="/account" className="block px-4 py-2.5 text-sm text-ink/80 hover:bg-ink/10">
                          My orders
                        </Link>
                        <Link href="/track" className="block px-4 py-2.5 text-sm text-ink/80 hover:bg-ink/10">
                          Track an order
                        </Link>
                        <button
                          onClick={async () => {
                            await fetch("/api/auth/logout", { method: "POST" });
                            window.location.href = "/";
                          }}
                          className="block w-full px-4 py-2.5 text-left text-sm text-wine hover:bg-wine/5"
                        >
                          Sign out
                        </button>
                      </div>
                    ) : (
                      <div className="py-1">
                        <Link href="/account/login" className="block px-4 py-2.5 text-sm text-ink/80 hover:bg-ink/10">
                          Sign in
                        </Link>
                        <Link href="/account/signup" className="block px-4 py-2.5 text-sm text-ink/80 hover:bg-ink/10">
                          Create account
                        </Link>
                        <div className="my-1 border-t border-ink/8" />
                        <Link href="/track" className="block px-4 py-2.5 text-sm text-ink/80 hover:bg-ink/10">
                          Track an order
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Favorites — hidden on mobile/tablet (lives in the drawer) */}
            <Link
              href="/favorites"
              className="relative hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 lg:flex"
              aria-label="Favorites"
            >
              <Heart className="h-[18px] w-[18px]" />
              {favCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-wine px-1 text-[9px] font-semibold text-paper">
                  {favCount}
                </span>
              )}
            </Link>

            {/* Cart — hidden on mobile/tablet (lives in the drawer) */}
            <button
              onClick={openCart}
              className="relative hidden h-10 items-center gap-1.5 rounded-full px-2.5 text-ink transition-colors hover:bg-ink/5 lg:flex"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-5 w-5" />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-bronze px-1 text-[10px] font-semibold text-paper"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              className="absolute left-0 top-0 h-[100dvh] w-[82%] max-w-sm bg-surface-navy bg-sheen-light p-6 shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-black/10">
                  <SchoolCrest className="h-8 w-8 text-navy" />
                </span>
                <span className="flex flex-col leading-none">
                  <span className="text-[14px] font-semibold text-ink">St.Thomas&apos; College</span>
                  <span className="mt-1.5 text-[10px] uppercase tracking-wide-2 text-stone-400">
                    Matale. Est.1873.
                  </span>
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="ml-auto flex h-9 w-9 items-center justify-center text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={onSearch} className="mt-6">
                <div className="flex items-center rounded-full border border-ink/15 px-4 py-2.5">
                  <Search className="h-4 w-4 text-stone-luxe" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full bg-transparent px-2 text-sm text-ink placeholder:text-stone-400 focus:outline-none"
                  />
                </div>
              </form>

              <ul className="mt-6 space-y-1">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="block border-b border-ink/8 py-3.5 text-lg font-medium text-ink"
                    >
                      {link.label}
                    </Link>

                    {/* Sub-navigation sits *inside* its parent, indented —
                        only Shop has children. */}
                    {link.children && (
                      <ul className="pb-2 pl-5">
                        {link.children.map((child) => (
                          <li key={child.label}>
                            <Link
                              href={child.href}
                              className="block border-l-2 border-ink/12 py-2.5 pl-4 text-[15px] text-ink/75 transition-colors hover:border-accent hover:text-ink"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}

                <li className="pt-6 pb-1 text-[11px] uppercase tracking-wide-2 text-stone-400">
                  My account
                </li>
                <li>
                  <Link
                    href={user ? "/account" : "/account/login"}
                    className="flex items-center gap-3 border-b border-ink/8 py-3.5 text-base text-ink"
                  >
                    <UserIcon className="h-[18px] w-[18px] text-stone-400" />
                    {user ? "My orders" : "Sign in"}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/favorites"
                    className="flex items-center gap-3 border-b border-ink/8 py-3.5 text-base text-ink"
                  >
                    <Heart className="h-[18px] w-[18px] text-stone-400" />
                    Favourites
                    {favCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-wine px-1.5 text-[10px] font-semibold text-paper">
                        {favCount}
                      </span>
                    )}
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      openCart();
                    }}
                    className="flex w-full items-center gap-3 border-b border-ink/8 py-3.5 text-left text-base text-ink"
                  >
                    <ShoppingBag className="h-[18px] w-[18px] text-stone-400" />
                    Bag
                    {itemCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-bronze px-1.5 text-[10px] font-semibold text-paper">
                        {itemCount}
                      </span>
                    )}
                  </button>
                </li>
                {user && (
                  <li>
                    <button
                      onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        window.location.href = "/";
                      }}
                      className="flex w-full items-center gap-3 py-3.5 text-left text-base text-wine"
                    >
                      Sign out
                    </button>
                  </li>
                )}
              </ul>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
