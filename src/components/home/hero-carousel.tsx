"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SLIDES = [
  { src: "/images/school-1.jpg", alt: "St. Thomas' College Matale — the college building" },
  { src: "/images/school-2.jpg", alt: "St. Thomas' College Matale — students" },
  { src: "/images/school-3.jpg", alt: "St. Thomas' College Matale — merchandise" },
];

const SLIDE_MS = 6500;

/**
 * Cinematic hero: the three college photographs cross-fade slowly into one
 * another with a subtle Ken Burns drift, so the imagery feels like a film
 * cut rather than a slideshow.
 */
export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  const next = useCallback(
    () => setIndex((i) => (i + 1) % SLIDES.length),
    [],
  );

  useEffect(() => {
    const t = window.setInterval(next, SLIDE_MS);
    return () => window.clearInterval(t);
  }, [next]);

  // Reset the timer whenever the user picks a slide manually.
  useEffect(() => {
    return () => undefined;
  }, [index]);

  return (
    <section className="relative h-[92vh] min-h-[640px] w-full overflow-hidden">
      {/* Cross-fading image stack */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className="absolute inset-0 transition-opacity duration-[2200ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ opacity: i === index ? 1 : 0 }}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.src}
            alt={i === index ? slide.alt : ""}
            fill
            priority={i === 0}
            className="animate-kenburns object-cover object-center"
            sizes="100vw"
          />
        </div>
      ))}

      {/* Navy bloom keeps the mood; top and bottom fade into the page canvas
          (charcoal) instead of a white haze. */}
      <div className="absolute inset-0 bg-radial-navy" />
      <div className="absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-base via-base/55 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-base via-base/70 to-transparent" />

      {/* Centered content */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-accent/70" />
              <p className="text-[11px] font-semibold uppercase tracking-luxe text-paper">
                Est. 1873
              </p>
              <span className="h-px w-10 bg-accent/70" />
            </div>

            <p className="mt-7 text-base font-semibold uppercase tracking-[0.42em] text-paper sm:text-lg">
              Welcome To
            </p>

            <h1 className="mt-4 max-w-4xl font-serif text-[clamp(2.6rem,7vw,5.6rem)] font-bold leading-[0.98] text-paper text-luxe-shadow text-balance">
              St. Thomas&rsquo; College
              <br />
              <span className="text-gradient-gold">Matale</span>
            </h1>
          </motion.div>
        </AnimatePresence>

        {/* Featured CTA */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-11 flex flex-col items-center gap-5"
        >
          {/* Third row of the sentence: Welcome to St.Thomas' College Matale — Shop */}
          <p className="text-2xl font-bold uppercase tracking-[0.34em] text-paper sm:text-3xl">
            Shop
          </p>

          <Link
            href="/shop"
            className="group flex items-center gap-3 rounded-full bg-cta-accent px-10 py-4 text-xs font-semibold uppercase tracking-wide-2 text-accent-ink shadow-cta transition-all duration-500 hover:bg-cta-accent-hover hover:shadow-cta-hover"
          >
            Shop
            <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
          </Link>

          {/* Slide indicator */}
          <div className="flex items-center gap-2.5">
            {SLIDES.map((s, i) => (
              <button
                key={s.src}
                onClick={() => setIndex(i)}
                aria-label={`Show slide ${i + 1}`}
                className={`h-[3px] rounded-full transition-all duration-700 ${
                  i === index
                    ? "w-9 bg-accent"
                    : "w-4 bg-paper/30 hover:bg-paper/60"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
