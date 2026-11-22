"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { IssuedTicketCard } from "@/components/product/issued-ticket-card";
import { AnimatedSection } from "@/components/ui/animated-section";

type TicketData = {
  ticket: {
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
  qrDataUrl: string;
};

export default function TicketViewPage({ params }: { params: Promise<{ code: string }> }) {
  const [code, setCode] = useState<string>("");
  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((p) => setCode(decodeURIComponent(p.code)));
  }, [params]);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    fetch(`/api/tickets/${encodeURIComponent(code)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Ticket not found");
        return d as TicketData;
      })
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-stone-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your ticket…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="font-serif text-2xl text-ink">Ticket not found</p>
        <p className="mt-3 text-sm text-stone-400">{error}</p>
        <Link
          href="/tickets"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-cta-accent px-7 py-3.5 text-xs font-bold uppercase tracking-wide-2 text-accent-ink shadow-cta"
        >
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
      </div>
    );
  }

  const { ticket } = data;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <AnimatedSection>
        <Link
          href="/tickets"
          className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-wide-2 text-stone-400 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> All events
        </Link>

        <h1 className="font-serif text-3xl font-light text-ink">Your ticket</h1>
        <p className="mt-2 text-sm text-stone-400">
          Show this at the gate. Each QR code scans once — please don&apos;t share it.
        </p>
      </AnimatedSection>

      <AnimatedSection delay={0.12} className="mt-10">
        <IssuedTicketCard
          ticketCode={ticket.ticketCode}
          eventName={ticket.eventName}
          eventDate={ticket.eventDate}
          venue={ticket.venue}
          tier={ticket.tier}
          attendeeName={ticket.attendeeName}
          quantity={ticket.quantity}
          status={ticket.status}
          qrDataUrl={data.qrDataUrl}
          imageUrl={ticket.imageUrl}
          onDownload={() => {
            window.location.href = `/api/tickets/${encodeURIComponent(ticket.ticketCode)}/image`;
          }}
        />
      </AnimatedSection>
    </div>
  );
}
