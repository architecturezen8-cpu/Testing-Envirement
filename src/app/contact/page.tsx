import { AnimatedSection } from "@/components/ui/animated-section";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 lg:px-8">
      <AnimatedSection>
        <h1 className="font-serif text-4xl font-medium text-stone-950">
          Contact Us
        </h1>
        <p className="mt-4 text-stone-600">
          We are here to help. Reach out and our team will respond within 24
          hours.
        </p>
        <div className="mt-8 space-y-4 text-stone-600">
          <p>
            <span className="font-medium text-stone-900">Email:</span>{" "}
            hello@novastore.com
          </p>
          <p>
            <span className="font-medium text-stone-900">Phone:</span> +1 (555)
            123-4567
          </p>
          <p>
            <span className="font-medium text-stone-900">Hours:</span> Mon–Fri,
            9am–6pm EST
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
}
