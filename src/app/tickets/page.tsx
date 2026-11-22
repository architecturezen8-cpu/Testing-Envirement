import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/db";
import { collections, products } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/ui/animated-section";
import { formatPrice } from "@/lib/utils";
import { TicketCard } from "@/components/product/ticket-card";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Event Tickets — St. Thomas' College Matale",
  description:
    "Buy official St. Thomas' College Matale event tickets online: the Big Match, inter-house sports meet, prize day and carols evening.",
};

export default async function TicketsPage() {
  const ticketProducts = await db
    .select()
    .from(products)
    .where(eq(products.category, "Event Tickets"))
    .orderBy(desc(products.badge), products.price);

  const ticketCollection = await db
    .select()
    .from(collections)
    .where(and(eq(collections.slug, "event-tickets")))
    .limit(1);

  const heroImage = ticketCollection[0]?.image ?? "/images/school-1.jpg";

  return (
    <>
      {/* ===== CINEMATIC HERO ===== */}
      <section className="relative h-[78vh] min-h-[520px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="St. Thomas' College Matale — event tickets"
            fill
            priority
            className="animate-kenburns object-cover object-center"
            sizes="100vw"
          />
        </div>

        {/* Scrims blend into the charcoal canvas — no white haze */}
        <div className="absolute inset-0 bg-radial-navy" />
        <div className="absolute inset-0 bg-hero-vignette" />
        <div className="absolute inset-0 bg-[radial-gradient(52rem_22rem_at_50%_62%,rgba(4,7,14,0.72)_0%,rgba(5,9,17,0.42)_45%,transparent_78%)]" />
        <div className="absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-base via-base/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-base via-base/70 to-transparent" />

        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col items-center justify-center px-6 text-center">
          <div className="flex items-center gap-4">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-accent/80 sm:w-14" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.5em] text-accent sm:text-[11px]">
              Est. 1873
            </span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-accent/80 sm:w-14" />
          </div>

          <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.46em] text-paper/85 sm:text-[13px] sm:tracking-[0.5em]">
            College Events
          </p>

          <h1 className="mt-5 max-w-4xl font-serif text-[clamp(2.4rem,6.4vw,5rem)] font-bold leading-[1.02] tracking-[-0.015em] text-paper text-luxe-shadow">
            Event Tickets
          </h1>

          <div className="mt-7 h-px w-24 bg-gradient-to-r from-transparent via-paper/35 to-transparent" />

          <p className="mt-7 max-w-xl text-[15px] font-medium leading-relaxed text-paper text-luxe-shadow sm:text-lg">
            The Big Match, the inter-house sports meet, prize day and the carols
            evening — book your place at the events that make the college year.
          </p>

          <Link
            href="#tickets"
            className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-cta-accent px-8 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-accent-ink shadow-cta transition-all duration-500 hover:bg-cta-accent-hover hover:shadow-cta-hover"
          >
            See what&apos;s on
            <span className="transition-transform duration-500 group-hover:translate-y-0.5">↓</span>
          </Link>
        </div>
      </section>

      {/* ===== TICKETS LIST ===== */}
      <section id="tickets" className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10 lg:py-28">
        <AnimatedSection>
          <div className="mb-14 text-center">
            <p className="text-[11px] uppercase tracking-luxe text-accent">On sale now</p>
            <h2 className="mt-4 font-serif text-[clamp(2rem,4vw,3.25rem)] font-light leading-tight text-ink">
              Upcoming events
            </h2>
            <div className="mx-auto mt-6 h-px w-16 bg-accent/50" />
          </div>
        </AnimatedSection>

        <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ticketProducts.map((t) => (
            <StaggerItem key={t.id} className="h-full">
              <Link
                href={`/products/${t.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-surface-navy bg-sheen-light ring-1 ring-inset ring-panel transition-shadow duration-700 hover:shadow-navy-hover"
              >
                {t.badge && (
                  <span className="absolute right-5 top-4 z-10 rounded-full bg-cta-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wide-2 text-accent-ink">
                    {t.badge}
                  </span>
                )}

                {/* Drawn ticket — no photography */}
                <div className="px-5 pt-7 sm:px-6">
                  <TicketCard
                    eventTitle={t.name}
                    date={t.description.split("Event: ")[1]?.split("\n")[0] ?? "Date to be announced"}
                    venue={t.description.split("Venue: ")[1]?.split("\n")[0] ?? "College grounds"}
                    tier={t.description.split("Tier: ")[1]?.split("\n")[0] ?? "General"}
                    price={formatPrice(t.price)}
                  />
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="mt-auto flex items-end justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-[10px] uppercase tracking-wide-2 text-stone-500">
                        Tap to choose your tickets
                      </p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cta-accent text-accent-ink transition-transform duration-500 group-hover:translate-x-0.5">
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ===== INFO STRIP ===== */}
      <section className="border-y border-ink/8 bg-cream">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-16 sm:grid-cols-3 lg:px-10">
          {[
            { icon: "✦", title: "Instant confirmation", body: "Your ticket reference is shown the moment you pay." },
            { icon: "◈", title: "Collection at the gate", body: "Show the reference at the entrance — no printed ticket needed." },
            { icon: "❧", title: "College proceeds", body: "Every ticket goes straight back into college funds." },
          ].map((v) => (
            <div key={v.title} className="text-center sm:text-left">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 text-xl text-accent sm:mx-0">
                {v.icon}
              </span>
              <h3 className="mt-4 font-serif text-lg text-ink">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{v.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
