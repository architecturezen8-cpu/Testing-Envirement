import { AnimatedSection } from "@/components/ui/animated-section";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 lg:px-8">
      <AnimatedSection>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
          About Nova
        </p>
        <h1 className="mt-4 font-serif text-4xl font-medium text-stone-950">
          Fewer, better pieces for a life in motion.
        </h1>
        <div className="mt-8 space-y-5 leading-relaxed text-stone-600">
          <p>
            Nova was founded with a simple belief: the modern wardrobe should be
            smaller, better made, and endlessly versatile. We design clothing and
            shoes for people who move between cities, cultures, and moments — and
            need their wardrobe to keep up.
          </p>
          <p>
            Every collection is built around premium materials, responsible
            production, and timeless silhouettes that transcend seasons. From
            Italian wool tailoring to full-grain leather footwear, each piece is
            chosen to last.
          </p>
          <p>
            We ship globally, offer free returns within 30 days, and stand behind
            every product with a two-year quality promise. Welcome to Nova.
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
}
