"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Check, Loader2, PenLine } from "lucide-react";
import { useUser } from "@/components/auth/user-provider";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  slug: string;
  onSubmitted: () => void;
}

export function ReviewForm({ slug, onSubmitted }: ReviewFormProps) {
  const { user } = useUser();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title,
          body,
          author: user ? user.name : author,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit review.");
      } else {
        setSuccess(true);
        setRating(0);
        setTitle("");
        setBody("");
        setAuthor("");
        onSubmitted();
        window.setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-8 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white">
          <Check className="h-6 w-6" />
        </div>
        <p className="font-serif text-xl text-ink">Review submitted!</p>
        <p className="text-sm text-stone-500">Thank you for sharing your thoughts.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-ink/10 bg-paper p-6 lg:p-8">
      <div className="mb-5 flex items-center gap-2">
        <PenLine className="h-4 w-4 text-bronze" />
        <h3 className="font-serif text-xl text-ink">Write a review</h3>
      </div>

      {/* Star selector */}
      <div className="mb-5">
        <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide-2 text-stone-600">
          Your rating
        </label>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110"
              aria-label={`${star} stars`}
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  (hover || rating) >= star
                    ? "fill-bronze text-bronze"
                    : "fill-stone-200 text-stone-200"
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-stone-500">
              {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide-2 text-stone-600">
          Review title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your experience in a few words"
          maxLength={120}
          className="w-full rounded-xl border border-ink/10 bg-cream/50 px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
          required
        />
      </div>

      {/* Body */}
      <div className="mb-4">
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide-2 text-stone-600">
          Your review
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you like or dislike? How does it fit and feel?"
          rows={4}
          maxLength={2000}
          className="w-full resize-none rounded-xl border border-ink/10 bg-cream/50 px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
          required
        />
        <p className="mt-1 text-right text-[10px] text-stone-400">{body.length} / 2000</p>
      </div>

      {/* Author (only if not logged in) */}
      {!user && (
        <div className="mb-4">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide-2 text-stone-600">
            Your name
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. Jane D."
            maxLength={80}
            className="w-full rounded-xl border border-ink/10 bg-cream/50 px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
            required
          />
        </div>
      )}

      {user && (
        <p className="mb-4 flex items-center gap-1.5 text-xs text-stone-500">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[10px] font-medium text-paper">
            {user.name.charAt(0)}
          </span>
          Posting as <span className="font-medium text-ink">{user.name}</span>
        </p>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-wine/10 px-4 py-2.5 text-xs text-wine">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-full bg-ink px-8 py-3.5 text-xs font-medium uppercase tracking-wide-2 text-paper transition-colors hover:bg-bronze disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit review"
        )}
      </button>
    </form>
  );
}
