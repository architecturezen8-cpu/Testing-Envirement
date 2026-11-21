"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Invalid credentials");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink bg-radial-navy px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-serif text-3xl tracking-[0.2em] text-paper">NOVA</p>
          <p className="mt-2 text-[11px] uppercase tracking-luxe text-paper/40">
            Atelier · Admin
          </p>
        </div>
        <div className="rounded-2xl bg-surface-navy bg-sheen-light p-8 shadow-navy ring-1 ring-inset ring-white/10">
          <h1 className="font-serif text-2xl font-light text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-stone-500">
            Access the store management console.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide-2 text-stone-600">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-ink/10 bg-paper px-4 py-3 text-sm outline-none transition-colors focus:border-ink/40"
                placeholder="admin"
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
              <p className="rounded-lg bg-wine/10 px-3 py-2 text-xs text-wine">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-cta-accent py-3.5 text-xs font-semibold uppercase tracking-wide-2 text-accent-ink transition-all duration-500 hover:bg-cta-accent-hover disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
