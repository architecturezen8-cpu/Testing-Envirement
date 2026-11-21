"use client";

import { useEffect, useState } from "react";
import { StarRating } from "@/components/ui/star-rating";
import { DataTable } from "@/components/admin/data-table";
import { Pencil, Trash2 } from "lucide-react";

interface AdminReview {
  id: number;
  productId: number;
  productName: string | null;
  author: string;
  rating: number;
  title: string;
  body: string;
  helpful: number;
  createdAt: Date | null;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminReview | null>(null);

  const fetchReviews = () => {
    setLoading(true);
    fetch("/api/admin/reviews")
      .then((r) => r.json())
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const deleteReview = async (id: number) => {
    if (!confirm("Delete this review?")) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (res.ok) fetchReviews();
  };

  const saveReview = async (review: AdminReview) => {
    const res = await fetch(`/api/admin/reviews/${review.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: review.author,
        rating: review.rating,
        title: review.title,
        body: review.body,
        helpful: review.helpful,
      }),
    });
    if (res.ok) {
      setEditing(null);
      fetchReviews();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium text-stone-950">Reviews</h1>
        <p className="mt-1 text-stone-500">Moderate customer reviews.</p>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-stone-200" />
      ) : (
        <DataTable
          headers={["Product", "Author", "Rating", "Review", "Date", "Actions"]}
        >
          {reviews.map((review) => (
            <tr key={review.id} className="border-b border-stone-100 last:border-0">
              <td className="px-6 py-4">
                <div className="max-w-xs truncate font-medium text-stone-900">
                  {review.productName}
                </div>
              </td>
              <td className="px-6 py-4 text-stone-600">{review.author}</td>
              <td className="px-6 py-4">
                <StarRating rating={review.rating} size={14} />
              </td>
              <td className="px-6 py-4">
                <div className="max-w-xs">
                  <p className="font-medium text-stone-900">{review.title}</p>
                  <p className="truncate text-xs text-stone-500">{review.body}</p>
                </div>
              </td>
              <td className="px-6 py-4 text-stone-500">
                {review.createdAt
                  ? new Date(review.createdAt).toLocaleDateString()
                  : "—"}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(review)}
                    className="rounded-lg p-2 text-stone-600 transition-colors hover:bg-stone-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {reviews.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                No reviews yet.
              </td>
            </tr>
          )}
        </DataTable>
      )}

      {editing && (
        <ReviewEditModal
          review={editing}
          onClose={() => setEditing(null)}
          onSave={saveReview}
        />
      )}
    </div>
  );
}

function ReviewEditModal({
  review,
  onClose,
  onSave,
}: {
  review: AdminReview;
  onClose: () => void;
  onSave: (r: AdminReview) => void;
}) {
  const [form, setForm] = useState(review);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl">
        <h2 className="font-serif text-2xl font-medium text-stone-950">
          Edit Review
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-700">Author</label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-stone-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Rating</label>
            <select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-stone-500"
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r} stars
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-stone-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={4}
              className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-stone-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">Helpful</label>
            <input
              type="number"
              value={form.helpful}
              onChange={(e) => setForm({ ...form, helpful: Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-stone-500"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full border border-stone-200 px-6 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="rounded-full bg-cta-accent px-6 py-2.5 text-sm font-semibold text-accent-ink hover:scale-105"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
