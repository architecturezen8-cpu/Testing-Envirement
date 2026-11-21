"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/admin/stat-card";
import {
  Package,
  ShoppingCart,
  Star,
  Layers,
  DollarSign,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

interface DashboardData {
  products: number;
  orders: number;
  revenue: number;
  reviews: number;
  collections: number;
  recentOrders: {
    id: number;
    email: string;
    total: number;
    status: string;
    createdAt: Date | null;
  }[];
  lowStockProducts: {
    id: number;
    name: string;
    slug: string;
    stock: number;
  }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-stone-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-medium text-stone-950">
          Dashboard
        </h1>
        <p className="mt-1 text-stone-500">Overview of your Nova store.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Products"
          value={data.products}
          trend="Across all collections"
        />
        <StatCard
          label="Total Orders"
          value={data.orders}
          trend="Lifetime orders"
        />
        <StatCard
          label="Revenue"
          value={formatPrice(data.revenue)}
          trend="Lifetime revenue"
        />
        <StatCard
          label="Reviews"
          value={data.reviews}
          trend="Customer reviews"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-surface p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900">
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-950"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-stone-100">
                    <td className="py-3 font-medium text-stone-900">
                      #{order.id}
                    </td>
                    <td className="py-3 text-stone-600">{order.email}</td>
                    <td className="py-3 font-medium text-stone-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium capitalize text-stone-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-stone-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
                {data.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-500">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-stone-200 bg-surface p-6">
          {/* Low stock alert */}
          {data.lowStockProducts && data.lowStockProducts.length > 0 ? (
            <div className="mb-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low Stock Alerts
              </h2>
              <div className="mt-3 space-y-2">
                {data.lowStockProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/products/${p.id}/edit`}
                    className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 transition-colors hover:bg-amber-100"
                  >
                    <span className="truncate text-sm text-stone-700">{p.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.stock === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <h2 className="text-lg font-semibold text-stone-900">Quick Links</h2>
          <div className="space-y-2">
            <QuickLink href="/admin/products" icon={Package} label="Manage Products" />
            <QuickLink href="/admin/collections" icon={Layers} label="Manage Collections" />
            <QuickLink href="/admin/orders" icon={ShoppingCart} label="View Orders" />
            <QuickLink href="/admin/reviews" icon={Star} label="Moderate Reviews" />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-stone-100"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-stone-700" />
        <span className="font-medium text-stone-900">{label}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-stone-400" />
    </Link>
  );
}
