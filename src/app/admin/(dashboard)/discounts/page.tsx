"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, Tag, Power } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { DataTable } from "@/components/admin/data-table";

interface Discount {
  id: number;
  code: string;
  description: string | null;
  type: string;
  value: string;
  minOrder: number;
  usageLimit: number | null;
  usageCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string | null;
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);

  const fetchDiscounts = () => {
    setLoading(true);
    fetch("/api/admin/discounts")
      .then((r) => r.json())
      .then(setDiscounts)
      .catch(() => setDiscounts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const toggleActive = async (d: Discount) => {
    await fetch(`/api/admin/discounts/${d.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: d.code,
        type: d.type,
        value: Number(d.value),
        minOrder: d.minOrder,
        usageLimit: d.usageLimit,
        active: !d.active,
        description: d.description,
        expiresAt: d.expiresAt,
      }),
    });
    fetchDiscounts();
  };

  const deleteDiscount = async (id: number) => {
    if (!confirm("Delete this discount code?")) return;
    await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    fetchDiscounts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-medium text-stone-950">
            Discount Codes
          </h1>
          <p className="mt-1 text-stone-500">
            Create and manage promo codes for your customers.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 rounded-full bg-cta-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" /> Add Code
        </button>
      </div>

      {showForm && (
        <DiscountForm
          discount={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchDiscounts();
          }}
        />
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-stone-200" />
      ) : (
        <DataTable headers={["Code", "Discount", "Usage", "Status", "Actions"]}>
          {discounts.map((d) => (
            <tr key={d.id} className="border-b border-stone-100 last:border-0">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-stone-400" />
                  <span className="font-mono font-medium text-stone-900">
                    {d.code}
                  </span>
                </div>
                {d.description && (
                  <div className="ml-6 text-xs text-stone-500">{d.description}</div>
                )}
              </td>
              <td className="px-6 py-4">
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                  {d.type === "percentage"
                    ? `${d.value}% off`
                    : `$${d.value} off`}
                </span>
                {d.minOrder > 0 && (
                  <div className="mt-1 text-xs text-stone-400">
                    Min {formatPrice(d.minOrder)}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-stone-600">
                {d.usageCount}
                {d.usageLimit ? ` / ${d.usageLimit}` : " / ∞"}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    d.active
                      ? "bg-green-100 text-green-700"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {d.active ? "Active" : "Inactive"}
                </span>
                {d.expiresAt && new Date(d.expiresAt) < new Date() && (
                  <div className="mt-1 text-xs text-red-500">Expired</div>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(d)}
                    title={d.active ? "Deactivate" : "Activate"}
                    className={`rounded-lg p-2 transition-colors ${
                      d.active
                        ? "text-green-600 hover:bg-green-50"
                        : "text-stone-400 hover:bg-stone-100"
                    }`}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditing(d);
                      setShowForm(true);
                    }}
                    className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteDiscount(d.id)}
                    className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {discounts.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                No discount codes yet. Click "Add Code" to create one.
              </td>
            </tr>
          )}
        </DataTable>
      )}
    </div>
  );
}

function DiscountForm({
  discount,
  onClose,
  onSaved,
}: {
  discount: Discount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    code: discount?.code ?? "",
    description: discount?.description ?? "",
    type: discount?.type ?? "percentage",
    value: discount ? discount.value : "10",
    minOrder: discount ? String(discount.minOrder / 100) : "0",
    usageLimit: discount?.usageLimit ? String(discount.usageLimit) : "",
    active: discount?.active ?? true,
    expiresAt: discount?.expiresAt ? discount.expiresAt.split("T")[0] : "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      code: form.code,
      description: form.description || null,
      type: form.type,
      value: Number(form.value),
      minOrder: Number(form.minOrder) * 100,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      active: form.active,
      expiresAt: form.expiresAt || null,
    };

    const url = discount
      ? `/api/admin/discounts/${discount.id}`
      : "/api/admin/discounts";

    const res = await fetch(url, {
      method: discount ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to save.");
    } else {
      onSaved();
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-surface p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-medium text-stone-950">
          {discount ? "Edit Code" : "New Discount Code"}
        </h2>
        <button onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Code <span className="text-stone-400">(customers enter this)</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="SUMMER20"
              className="w-full rounded-xl border border-stone-200 px-4 py-3 font-mono text-sm uppercase outline-none focus:border-stone-500"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Description <span className="text-stone-400">(optional)</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Summer sale 20% off"
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed ($)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              {form.type === "percentage" ? "Percentage off" : "Dollar amount off"}
            </label>
            <input
              type="number"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder={form.type === "percentage" ? "20" : "25"}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Min order ($)
            </label>
            <input
              type="number"
              value={form.minOrder}
              onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
              placeholder="0"
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Usage limit <span className="text-stone-400">(blank = unlimited)</span>
            </label>
            <input
              type="number"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              placeholder="100"
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Expires on <span className="text-stone-400">(optional)</span>
            </label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-500"
            />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="h-4 w-4 accent-stone-950"
          />
          <span className="text-sm font-medium text-stone-700">
            Active (available for customers)
          </span>
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-cta-accent px-8 py-3.5 text-sm font-semibold text-accent-ink transition-transform hover:scale-105 disabled:opacity-70"
          >
            {loading ? "Saving..." : discount ? "Update Code" : "Create Code"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-200 px-8 py-3.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
