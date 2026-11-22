"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  Package,
  Layers,
  ShoppingCart,
  Ticket,
  MessageSquare,
  Tag,
  FolderTree,
  Boxes,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Home page setup", href: "/admin/home", icon: Home },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Stock Preview", href: "/admin/stock", icon: Boxes },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Collections", href: "/admin/collections", icon: Layers },
  { label: "Discounts", href: "/admin/discounts", icon: Tag },
  { label: "Event Tickets", href: "/admin/tickets", icon: Ticket },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Reviews", href: "/admin/reviews", icon: MessageSquare },
];

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { username: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-stone-200 bg-surface-navy lg:flex">
        <div className="flex h-16 items-center border-b border-stone-200 px-6">
          <Link
            href="/admin"
            className="text-xl font-semibold tracking-tight text-stone-950"
          >
            Nova Admin
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-stone-950 text-white shadow-[0_0_0_1px_rgba(60,100,170,0.35)]"
                    : "text-stone-600 hover:bg-stone-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-stone-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium text-stone-900">{user.username}</p>
              <p className="text-xs text-stone-500">Administrator</p>
            </div>
            <button
              onClick={logout}
              className="rounded-full p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-red-600"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-surface px-6 lg:hidden">
          <Link
            href="/admin"
            className="text-xl font-semibold tracking-tight text-stone-950"
          >
            Nova Admin
          </Link>
          <button
            onClick={() => setMobileOpen((s) => !s)}
            className="rounded-full p-2 text-stone-700"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>
        {mobileOpen && (
          <nav className="border-b border-stone-200 bg-surface px-4 py-4 lg:hidden">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium",
                    active
                      ? "bg-stone-950 text-white"
                      : "text-stone-600 hover:bg-stone-100"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        )}
        <main className="flex-1 overflow-auto p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
