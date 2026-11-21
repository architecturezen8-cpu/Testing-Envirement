import { AnimatedSection } from "@/components/ui/animated-section";

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 lg:px-8">
      <AnimatedSection>
        <h1 className="font-serif text-4xl font-medium text-stone-950">
          Shipping & Returns
        </h1>
        <div className="mt-8 space-y-6 leading-relaxed text-stone-600">
          <section>
            <h2 className="text-lg font-semibold text-stone-900">Shipping</h2>
            <p className="mt-2">
              We offer free standard shipping worldwide on orders over $200.
              Orders under $200 ship for a flat rate of $15. Express shipping is
              available at checkout for most destinations.
            </p>
            <p className="mt-2">
              Standard orders are processed within 1–2 business days and typically
              arrive within 5–10 business days depending on your location.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-stone-900">Returns</h2>
            <p className="mt-2">
              If you are not completely satisfied, you may return unworn items
              with original tags attached within 30 days of delivery for a full
              refund. Return shipping is free for all orders.
            </p>
          </section>
        </div>
      </AnimatedSection>
    </div>
  );
}
