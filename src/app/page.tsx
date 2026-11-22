import Image from "next/image";
import Link from "next/link";
import { db } from "@/db";
import { collections, products } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { ProductCard } from "@/components/product/product-card";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/ui/animated-section";
import { HeroCarousel } from "@/components/home/hero-carousel";

export const dynamic = "force-dynamic";

const TESTIMONIALS = [
  {
    quote:
      "The quality of the college merchandises is outstanding — the crest embroidery is beautiful and the fit is perfect.",
    author: "Dinesh P.",
    location: "Old Boys' Union",
  },
  {
    quote:
      "Ordered event tickets and a polo set for the big match. Everything arrived quickly and beautifully packed.",
    author: "Nimesha R.",
    location: "Parent, Grade 9",
  },
  {
    quote:
      "Wearing the college colours feels different when it is made this well. Proud to be a Thomian.",
    author: "Sanula W.",
    location: "Student, Grade 13",
  },
];

const CREST_MOTTO = {
  title: "Animo Et Fide",
  translation: "Courage & Faith",
};

export default async function HomePage() {
  const featuredCollections = await db
    .select()
    .from(collections)
    .where(eq(collections.featured, true))
    .orderBy(collections.sortOrder);

  const featuredProducts = await db
    .select()
    .from(products)
    .orderBy(desc(products.badge), desc(products.createdAt))
    .limit(4);

  const productCount = await db.select({ c: sql`count(*)` }).from(products);

  return (
    <>
      {/* ===== HERO — cinematic college imagery ===== */}
      <HeroCarousel />

      {/* ===== SHOP BY CATEGORY ===== */}
      <section className="mx-auto max-w-[1400px] px-6 pb-4 pt-4 lg:px-10">
        <StaggerContainer className="grid gap-5 sm:grid-cols-3">
          {[
            {
              label: "Badges",
              href: "/shop?category=Badges",
              note: "House & college crests",
              image: "https://images.pexels.com/photos/8066708/pexels-photo-8066708.png?auto=compress&cs=tinysrgb&fit=crop&w=900&h=1100",
            },
            {
              label: "Uniforms & Wear",
              href: "/shop?category=Uniforms",
              note: "Shirts, ties & knitwear",
              image: "https://images.pexels.com/photos/32148986/pexels-photo-32148986.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=1100",
            },
            {
              label: "Batch Shirts",
              href: "/shop?category=Batch%20Shirts",
              note: "Signed batch tees",
              image: "https://images.pexels.com/photos/29275615/pexels-photo-29275615.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=1100",
            },
          ].map((c) => (
            <StaggerItem key={c.label} className="h-full">
              <Link
                href={c.href}
                className="group relative flex h-full min-h-[300px] flex-col justify-end overflow-hidden rounded-2xl bg-surface-navy ring-1 ring-inset ring-panel transition-shadow duration-700 hover:shadow-navy-hover"
              >
                <Image
                  src={c.image}
                  alt={c.label}
                  fill
                  className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/88 via-ink/35 to-ink/10" />
                <div className="relative z-10 p-7 text-paper">
                  <p className="text-[10px] uppercase tracking-luxe text-paper/60">
                    College store
                  </p>
                  <h3 className="mt-2 font-serif text-2xl font-light lg:text-3xl">{c.label}</h3>
                  <p className="mt-1.5 text-sm text-paper/70">{c.note}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-wide-2 text-paper/90 transition-all duration-500 group-hover:gap-4">
                    Shop now
                    <span>→</span>
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ===== FEATURED PRODUCTS (equal-height cards) ===== */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10 lg:py-28">
          <AnimatedSection>
            <div className="mb-14 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-luxe text-accent">Most popular</p>
                <h2 className="mt-4 font-serif text-[clamp(2rem,4vw,3.5rem)] font-light text-ink">
                  Uniforms &amp; college kit
                </h2>
              </div>
              <Link
                href="/shop"
                className="hidden items-center gap-2 text-xs uppercase tracking-wide-2 text-ink/70 transition-colors hover:text-ink sm:flex"
              >
                View all
                <span>→</span>
              </Link>
            </div>
          </AnimatedSection>

          <StaggerContainer className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <StaggerItem key={product.id} className="h-full">
                <ProductCard product={product} className="h-full" />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ===== CREST MOTTO — Animo Et Fide ===== */}
      <section className="relative overflow-hidden bg-ink bg-radial-navy-bottom py-32 text-paper lg:py-40">
        <div className="pointer-events-none absolute inset-0 bg-sheen-light" />
        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <AnimatedSection>
            <div className="mx-auto mb-12 flex h-24 w-24 items-center justify-center rounded-full bg-white ring-1 ring-black/10">
              <svg viewBox="0 0 64 64" className="h-16 w-16 text-navy" fill="none" aria-hidden>
                <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M20 17h24v16.5c0 8.2-5.1 14-12 17.5-6.9-3.5-12-9.3-12-17.5V17Z"
                  fill="currentColor"
                  fillOpacity="0.14"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path d="M32 20.5v22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M25.5 27h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path
                  d="M23.5 36.5c2.8-1.3 5.7-1.3 8.5 0 2.8-1.3 5.7-1.3 8.5 0v6.2c-2.8-1.3-5.7-1.3-8.5 0-2.8-1.3-5.7-1.3-8.5 0v-6.2Z"
                  fill="currentColor"
                  fillOpacity="0.85"
                />
              </svg>
            </div>

            <h2 className="font-serif text-[clamp(3rem,9vw,7rem)] font-bold italic leading-[0.95] tracking-tight text-paper text-balance">
              {CREST_MOTTO.title}
            </h2>

            <div className="mx-auto mt-8 flex max-w-xs items-center justify-center gap-4">
              <span className="h-px flex-1 bg-paper/25" />
              <p className="text-lg italic text-paper/60">
                &ldquo;{CREST_MOTTO.translation}&rdquo;
              </p>
              <span className="h-px flex-1 bg-paper/25" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="border-y border-ink/8 bg-cream">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10 lg:py-28">
          <AnimatedSection>
            <div className="mb-14 text-center">
              <p className="text-[11px] uppercase tracking-luxe text-accent">Our community</p>
              <h2 className="mt-4 font-serif text-[clamp(2rem,4vw,3.5rem)] font-light text-ink">
                Thomians worldwide
              </h2>
            </div>
          </AnimatedSection>
          <StaggerContainer className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <StaggerItem key={t.author} className="h-full">
                <div className="flex h-full flex-col rounded-2xl border border-ink/8 bg-paper bg-sheen-light ring-1 ring-inset ring-panel p-8">
                  <div className="mb-4 flex gap-0.5 text-accent">
                    {"★★★★★".split("").map((s, i) => (
                      <span key={i}>{s}</span>
                    ))}
                  </div>
                  <p className="flex-1 font-serif text-lg font-light leading-relaxed text-ink/80">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-6 border-t border-ink/8 pt-4">
                    <p className="font-medium text-ink">{t.author}</p>
                    <p className="text-xs text-stone-500">{t.location}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ===== VALUES ===== */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
        <StaggerContainer className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {[
            { title: "Island-wide delivery", body: "Dispatched from the college within 3 days.", icon: "✦" },
            { title: "Official crest", body: "Every piece carries the college emblem.", icon: "◈" },
            { title: "Student prices", body: "Fair pricing for every Thomian family.", icon: "❧" },
            { title: "Supports the college", body: "Proceeds go back into college funds.", icon: "↻" },
          ].map((v) => (
            <StaggerItem key={v.title} className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 text-2xl text-accent">
                {v.icon}
              </span>
              <h3 className="mt-4 font-serif text-lg text-ink">{v.title}</h3>
              <p className="mt-1.5 max-w-[200px] text-sm leading-relaxed text-stone-500">
                {v.body}
              </p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>
    </>
  );
}
