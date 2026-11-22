"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";

export type HeroSlide = { imageUrl: string; alt: string };

const FALLBACK_SLIDES: HeroSlide[] = [
  { imageUrl: "/images/school-1.jpg", alt: "St. Thomas' College Matale — the college building" },
  { imageUrl: "/images/school-2.jpg", alt: "St. Thomas' College Matale — students" },
  { imageUrl: "/images/school-3.jpg", alt: "St. Thomas' College Matale — merchandise" },
];

/* Shared easing — the same luxury curve used across the site. */
const EASE = [0.16, 1, 0.3, 1] as const;

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1.15, delay, ease: EASE },
});

export function HeroCarousel({
  slides = FALLBACK_SLIDES,
  intervalMs = 6500,
}: {
  slides?: HeroSlide[];
  intervalMs?: number;
}) {
  // Never render an empty hero — the admin can remove slides, so guard it.
  const SLIDES = slides.length ? slides : FALLBACK_SLIDES;
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), [SLIDES.length]);

  useEffect(() => {
    const t = window.setInterval(next, intervalMs);
    return () => window.clearInterval(t);
  }, [next, intervalMs]);

  return (
    <section className="relative h-[94vh] min-h-[660px] w-full overflow-hidden">
      {/* ---- Cross-fading image stack ---- */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.imageUrl}
          className="absolute inset-0 transition-opacity duration-[2400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ opacity: i === index ? 1 : 0 }}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.imageUrl}
            alt={i === index ? slide.alt : ""}
            fill
            priority={i === 0}
            className="animate-kenburns object-cover object-center"
            sizes="100vw"
          />
        </div>
      ))}

      {/* ---- Scrims: navy bloom + centre vignette + canvas blends ---- */}
      <div className="absolute inset-0 bg-radial-navy" />
      <div className="absolute inset-0 bg-hero-vignette" />
      <div className="absolute inset-x-0 top-0 h-[36%] bg-gradient-to-b from-base via-base/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-t from-base via-base/70 to-transparent" />

      {/* ---- Content ---- */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col items-center justify-center px-6 text-center">
        {/* Eyebrow: EST. 1873 */}
        <motion.div {...rise(0)} className="flex items-center gap-4">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-accent/80 sm:w-14" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.5em] text-accent sm:text-[11px]">
            Est. 1873
          </span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-accent/80 sm:w-14" />
        </motion.div>

        {/* Row 1 — Welcome To */}
        <motion.p
          {...rise(0.12)}
          className="mt-9 text-[11px] font-medium uppercase tracking-[0.46em] text-paper/85 sm:text-[13px] sm:tracking-[0.52em]"
        >
          Welcome To
        </motion.p>

        {/* Row 2 — the college name */}
        <motion.h1
          {...rise(0.24)}
          className="mt-6 max-w-5xl font-serif text-[clamp(2rem,6vw,5.4rem)] font-bold leading-[1.02] tracking-[-0.015em] text-paper text-luxe-shadow sm:mt-7 sm:text-[clamp(2.5rem,6.6vw,5.4rem)]"
        >
          St. Thomas&rsquo; College
          <span className="mt-1 block">
            <span className="text-gradient-navy text-luxe-shadow">Matale</span>
          </span>
        </motion.h1>

        {/* Hairline separating the name from the action */}
        <motion.div
          {...rise(0.36)}
          className="mt-9 h-px w-24 bg-gradient-to-r from-transparent via-paper/35 to-transparent"
        />

        {/* Row 3 — Shop (completes the sentence, flanked by hairlines) */}
        <motion.p
          {...rise(0.44)}
          className="mt-6 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.34em] text-paper/90 sm:mt-7 sm:gap-4 sm:text-lg sm:tracking-[0.4em]"
        >
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-paper/45 sm:w-9" />
          Shop
          <span className="h-px w-6 bg-gradient-to-l from-transparent to-paper/45 sm:w-9" />
        </motion.p>

        {/* Featured CTA — the single gold action */}
        <motion.div {...rise(0.58)} className="mt-7 sm:mt-9">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2.5 rounded-full bg-cta-accent px-6 py-3 text-[10.5px] font-bold uppercase tracking-[0.16em] text-accent-ink shadow-cta transition-all duration-500 hover:bg-cta-accent-hover hover:shadow-cta-hover sm:gap-3 sm:px-8 sm:py-3.5 sm:text-[11px] sm:tracking-[0.2em]"
          >
            Explore the store
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-ink/15 text-[10px] transition-transform duration-500 group-hover:translate-x-1 sm:h-[18px] sm:w-[18px] sm:text-[11px]">
              →
            </span>
          </Link>
        </motion.div>
      </div>

      {/* ---- Slide indicators + counter (bottom of the hero, not mid-stack) ---- */}
      <div className="absolute inset-x-0 bottom-12 z-20 flex flex-col items-center gap-4 px-6 sm:bottom-14">
        <motion.div {...rise(0.8)} className="flex items-center gap-3">
          {SLIDES.map((s, i) => (
            <button
              key={s.imageUrl}
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`h-[2px] rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                i === index ? "w-10 bg-accent" : "w-5 bg-paper/25 hover:bg-paper/55"
              }`}
            />
          ))}
        </motion.div>

        <motion.p {...rise(0.9)} className="font-mono text-[10px] tracking-[0.3em] text-paper/45">
          {String(index + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
        </motion.p>
      </div>
    </section>
  );
}
