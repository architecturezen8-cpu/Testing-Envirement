"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/account");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-luxe text-bronze">Welcome back</p>
        <h1 className="mt-3 font-serif text-4xl font-light text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-stone-500">
          Track orders, view history, and check notifications.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide-2 text-stone-600">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-paper px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide-2 text-stone-600">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-paper px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
            placeholder="••••••••"
            required
          />
        </div>
        {error && (
          <p className="rounded-lg bg-wine/10 px-3 py-2 text-xs text-wine">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-cta-accent py-3.5 text-xs font-semibold uppercase tracking-wide-2 text-accent-ink transition-all duration-500 hover:bg-cta-accent-hover disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        New to Nova?{" "}
        <Link href="/account/signup" className="font-medium text-bronze underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-stone-500">
        <Link href="/track" className="text-stone-500 underline-offset-2 hover:text-ink hover:underline">
          Track an order without signing in →
        </Link>
      </p>
    </div>
  );
}
