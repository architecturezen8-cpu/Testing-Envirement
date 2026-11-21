import { AnimatedSection } from "@/components/ui/animated-section";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 lg:px-8">
      <AnimatedSection>
        <h1 className="font-serif text-4xl font-medium text-stone-950">
          Privacy Policy
        </h1>
        <div className="mt-8 space-y-5 leading-relaxed text-stone-600">
          <p>
            Nova respects your privacy. This policy outlines how we collect, use,
            and protect your personal information when you shop with us.
          </p>
          <p>
            We collect information necessary to process orders, communicate with
            you, and improve your shopping experience. We never sell your data to
            third parties.
          </p>
          <p>
            For questions about your data, contact us at privacy@novastore.com.
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
}
