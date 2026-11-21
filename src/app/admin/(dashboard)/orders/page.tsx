"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { DataTable } from "@/components/admin/data-table";
import { Eye } from "lucide-react";

interface AdminOrder {
  id: number;
  number: string;
  email: string;
  fullName: string;
  total: number;
  status: string;
  createdAt: Date | null;
  items: { name: string; quantity: number; price: number }[];
}

const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchOrders();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium text-stone-950">Orders</h1>
        <p className="mt-1 text-stone-500">Manage and fulfill customer orders.</p>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-stone-200" />
      ) : (
        <DataTable
          headers={["Order", "Customer", "Total", "Status", "Date", "Actions"]}
        >
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-stone-100 last:border-0">
              <td className="px-6 py-4">
                <div className="font-medium text-stone-900">{order.number}</div>
                <div className="text-xs text-stone-400">#{order.id}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-stone-900">{order.fullName}</div>
                <div className="text-xs text-stone-500">{order.email}</div>
              </td>
              <td className="px-6 py-4 font-medium text-stone-900">
                {formatPrice(order.total)}
              </td>
              <td className="px-6 py-4">
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="rounded-lg border border-stone-200 bg-surface px-2 py-1 text-xs font-medium capitalize text-stone-700 outline-none"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 text-stone-500">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString()
                  : "—"}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="rounded-lg p-2 text-stone-600 transition-colors hover:bg-stone-100"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                No orders yet.
              </td>
            </tr>
          )}
        </DataTable>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

function OrderDetailModal({
  order,
  onClose,
}: {
  order: AdminOrder;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-medium text-stone-950">
            Order #{order.id}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-600 hover:bg-stone-100"
          >
            Close
          </button>
        </div>
        <div className="mt-4 space-y-4 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-stone-500">Customer</p>
              <p className="font-medium text-stone-900">{order.fullName}</p>
              <p className="text-stone-600">{order.email}</p>
            </div>
            <div>
              <p className="text-stone-500">Status</p>
              <p className="font-medium capitalize text-stone-900">{order.status}</p>
            </div>
          </div>
          <div>
            <p className="text-stone-500">Items</p>
            <ul className="mt-2 space-y-2">
              {order.items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex justify-between rounded-lg bg-stone-50 px-4 py-3"
                >
                  <span className="text-stone-900">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-stone-900">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-4 text-base font-semibold text-stone-950">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
