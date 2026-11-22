"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { SchoolCrest } from "@/components/layout/school-crest";
import { AnimatedSection } from "@/components/ui/animated-section";

type Result = {
  valid: boolean;
  reason?: string;
  scannedAt?: string;
  ticket?: {
    ticketCode: string;
    eventName: string;
    eventDate: string | null;
    venue: string | null;
    tier: string | null;
    attendeeName: string;
    quantity: number;
  };
};

/** Gate check — the page a scanned QR lands on. */
export default function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let done = false;
    params.then(async (p) => {
      const code = decodeURIComponent(p.code);
      try {
        // POST marks the ticket as used on first scan.
        const r = await fetch(`/api/tickets/verify/${encodeURIComponent(code)}`, {
          method: "POST",
        });
        const d = await r.json();
        if (!done) setResult(d);
      } catch {
        if (!done) setResult({ valid: false, reason: "error" });
      } finally {
        if (!done) setLoading(false);
      }
    });
    return () => {
      done = true;
    };
  }, [params]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-stone-400">
        <Loader2 className="h-6 w-6 animate-spin" /> Checking ticket…
      </div>
    );
  }

  const ok = result?.valid;
  const t = result?.ticket;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <AnimatedSection className="w-full max-w-md text-center">
        <span
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${
            ok ? "bg-green-500/15 text-green-700" : "bg-wine/20 text-wine"
          }`}
        >
          {ok ? <CheckCircle2 className="h-12 w-12" /> : <XCircle className="h-12 w-12" />}
        </span>

        <h1
          className={`mt-8 font-serif text-4xl font-light ${
            ok ? "text-ink" : "text-wine"
          }`}
        >
          {ok ? "Admit" : result?.reason === "already-scanned" ? "Already scanned" : "Not valid"}
        </h1>

        {t && (
          <>
            <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-white ring-1 ring-black/10">
              <SchoolCrest className="h-14 w-14 text-navy" />
            </div>

            <p className="mt-6 font-serif text-2xl font-light text-ink">{t.eventName}</p>

            <dl className="mx-auto mt-6 grid max-w-xs gap-2 text-sm">
              <div className="flex justify-between border-b border-ink/8 pb-2">
                <dt className="text-stone-400">Reference</dt>
                <dd className="font-mono text-ink">{t.ticketCode}</dd>
              </div>
              <div className="flex justify-between border-b border-ink/8 pb-2">
                <dt className="text-stone-400">Attendee</dt>
                <dd className="text-ink">{t.attendeeName}</dd>
              </div>
              <div className="flex justify-between border-b border-ink/8 pb-2">
                <dt className="text-stone-400">People</dt>
                <dd className="tabular-nums text-ink">{t.quantity}</dd>
              </div>
              {t.eventDate && (
                <div className="flex justify-between border-b border-ink/8 pb-2">
                  <dt className="text-stone-400">Date</dt>
                  <dd className="text-ink">{t.eventDate}</dd>
                </div>
              )}
              {t.tier && (
                <div className="flex justify-between">
                  <dt className="text-stone-400">Tier</dt>
                  <dd className="text-ink">{t.tier}</dd>
                </div>
              )}
            </dl>
          </>
        )}

        <Link
          href="/tickets"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-cta-accent px-7 py-3.5 text-xs font-bold uppercase tracking-wide-2 text-accent-ink shadow-cta"
        >
          College events
        </Link>
      </AnimatedSection>
    </div>
  );
}
