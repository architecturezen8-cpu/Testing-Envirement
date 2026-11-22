"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Ticket as TicketIcon, ArrowRight } from "lucide-react";
import { useUser } from "@/components/auth/user-provider";
import { AnimatedSection } from "@/components/ui/animated-section";

type IssuedTicket = {
  ticketCode: string;
  eventName: string;
  eventDate: string | null;
  venue: string | null;
  tier: string | null;
  attendeeName: string;
  quantity: number;
  status: string;
  imageUrl: string | null;
};

/**
 * "My tickets" — every pass the signed-in customer has bought, with a link to
 * view/download each one.
 */
export default function MyTicketsPage() {
  const { user, loading: userLoading } = useUser();
  const [tickets, setTickets] = useState<IssuedTicket[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/tickets/mine")
      .then(async (r) => {
        if (!r.ok) throw new Error("Could not load tickets");
        return r.json();
      })
      .then((d) => setTickets(d.tickets ?? []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [user, userLoading]);

  if (userLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-stone-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your tickets…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-28 text-center">
        <TicketIcon className="mx-auto h-12 w-12 text-stone-400" />
        <h1 className="mt-6 font-serif text-3xl font-light text-ink">My tickets</h1>
        <p className="mt-3 text-sm text-stone-400">
          Sign in to see the tickets you have bought.
        </p>
        <Link
          href="/account/login"
          className="mt-8 inline-flex rounded-full bg-cta-accent px-8 py-4 text-xs font-bold uppercase tracking-wide-2 text-accent-ink shadow-cta"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 lg:px-10">
      <AnimatedSection>
        <p className="text-[11px] uppercase tracking-luxe text-accent">Your passes</p>
        <h1 className="mt-4 font-serif text-4xl font-light text-ink">My tickets</h1>
        <p className="mt-3 text-sm text-stone-400">
          Every ticket you have bought — tap one to view or download it.
        </p>
      </AnimatedSection>

      {tickets && tickets.length > 0 ? (
        <ul className="mt-10 space-y-3">
          {tickets.map((t, i) => (
            <li key={t.ticketCode}>
              <AnimatedSection delay={i * 0.05}>
                <Link
                  href={`/tickets/view/${encodeURIComponent(t.ticketCode)}`}
                  className="group flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.03] p-4 transition-all duration-500 hover:border-accent/50 hover:bg-white/[0.06]"
                >
                  {t.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={t.imageUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-white/12 text-stone-400">
                      <TicketIcon className="h-6 w-6" />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-lg text-ink">{t.eventName}</p>
                    <p className="mt-1 truncate font-mono text-xs text-stone-400">
                      {t.ticketCode}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-stone-400">
                      {t.eventDate && <span>{t.eventDate}</span>}
                      {t.tier && <span className="uppercase tracking-wide">{t.tier}</span>}
                      <span className="inline-flex items-center gap-1">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            t.status === "valid"
                              ? "bg-green-500"
                              : t.status === "used"
                                ? "bg-stone-400"
                                : "bg-red-500"
                          }`}
                        />
                        {t.status === "valid" ? "Valid" : t.status === "used" ? "Used" : "Cancelled"}
                      </span>
                    </div>
                  </div>

                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cta-accent text-accent-ink transition-transform duration-500 group-hover:translate-x-0.5">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Link>
              </AnimatedSection>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 py-20 text-center">
          <TicketIcon className="mx-auto h-10 w-10 text-stone-400" />
          <p className="mt-4 text-ink/70">You have no tickets yet.</p>
          <Link
            href="/tickets"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-cta-accent px-7 py-3.5 text-xs font-bold uppercase tracking-wide-2 text-accent-ink shadow-cta"
          >
            Browse events <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
