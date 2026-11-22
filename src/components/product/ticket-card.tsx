import { SchoolCrest } from "@/components/layout/school-crest";

/**
 * A drawn event ticket — no photography.
 *
 * Styled after a printed event ticket: a perforated stub on the right, a
 * barcode, event details on the body and the college crest as the mark. The
 * whole thing is CSS + inline SVG, so it scales cleanly and always looks
 * intentional next to the photographic product cards used elsewhere.
 */

type TicketCardProps = {
  eventTitle: string;
  date: string;
  venue: string;
  tier: string;
  price: string;
  /** Reference photo shown to shoppers in the grid (not printed on the pass). */
  thumbnail?: string | null;
  accent?: string;
  className?: string;
};

export function TicketCard({
  eventTitle,
  date,
  venue,
  tier,
  price,
  thumbnail,
  accent = "#f4be38",
  className = "",
}: TicketCardProps) {
  return (
    <div className={`relative select-none ${className}`}>
      <div className="relative flex overflow-hidden rounded-xl bg-paper shadow-[0_16px_40px_-18px_rgba(0,0,0,0.75)] ring-1 ring-black/10">
        {/* ---------- Main body ---------- */}
        <div className="relative flex min-w-0 flex-1 flex-col justify-between gap-4 p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-black/10"
                style={{ color: "#12294a" }}
              >
                <SchoolCrest className="h-5 w-5" />
              </span>
              <p
                className="text-[9px] font-semibold uppercase leading-none tracking-[0.18em]"
                style={{ color: "#12294a" }}
              >
                St. Thomas&apos; College
                <span className="block text-[7px] font-medium tracking-[0.14em] opacity-70">
                  Matale · Est. 1873
                </span>
              </p>
            </div>

            <h4
              className="mt-3 line-clamp-2 font-serif text-[15px] font-semibold leading-snug sm:text-base"
              style={{ color: "#12294a" }}
            >
              {eventTitle}
            </h4>
          </div>

          <div className="space-y-1 text-[10px] leading-tight text-stone-600 sm:text-[11px]">
            <p className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
              {date}
            </p>
            <p className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full border" style={{ borderColor: accent }} />
              {venue}
            </p>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[8px] uppercase tracking-[0.14em] text-stone-400">
                {tier} · Admit
              </p>
              <p className="font-serif text-2xl font-bold leading-none" style={{ color: "#12294a" }}>
                {price}
              </p>
            </div>
            {/* Barcode */}
            <div className="flex h-8 items-stretch gap-[1.5px] opacity-70">
              {[3, 1, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2].map(
                (w, i) => (
                  <span
                    key={i}
                    className="block h-full"
                    style={{
                      width: `${w}px`,
                      backgroundColor: i % 2 ? "transparent" : "#1f2937",
                    }}
                  />
                ),
              )}
            </div>
          </div>
        </div>

        {/* ---------- Perforated divider ---------- */}
        <div className="relative w-px shrink-0 bg-stone-300">
          {/* punch holes top and bottom */}
          <span
            className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-surface-navy"
            aria-hidden
          />
          <span
            className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-surface-navy"
            aria-hidden
          />
          {/* dashed perforation */}
          <span
            className="absolute inset-y-1 left-1/2 -translate-x-1/2 border-l border-dashed border-stone-400"
            aria-hidden
          />
        </div>

        {/* ---------- Stub ---------- */}
        <div
          className="relative flex w-[86px] shrink-0 flex-col items-center justify-between gap-3 px-3 py-4 sm:w-[96px]"
          style={{
            backgroundImage: `linear-gradient(165deg, ${accent} 0%, ${accent}dd 55%, ${accent}99 100%)`,
          }}
        >
          <p className="text-center text-[8px] font-bold uppercase leading-tight tracking-[0.14em] text-[#1a1305]">
            Admit
            <span className="mt-0.5 block text-[7px] font-medium tracking-[0.1em] opacity-75">
              {tier}
            </span>
          </p>

          <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#1a1305]" fill="none" aria-hidden>
            <path
              d="M12 3.5c2.6 0 4.7 2 4.7 4.5 0 1.2-.4 2.2-1.2 3.1.5.6.8 1.4.8 2.2 0 2.3-1.9 4.2-4.3 4.2s-4.3-1.9-4.3-4.2c0-.8.3-1.6.8-2.2-.8-.9-1.2-1.9-1.2-3.1 0-2.5 2.1-4.5 4.7-4.5Z"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path d="M9.4 11.2h5.2M9.4 13.6h5.2" stroke="currentColor" strokeWidth="1.2" />
          </svg>

          <p className="text-center text-[7px] font-medium leading-tight tracking-wide text-[#1a1305]/80">
            VALID
            <span className="block">ONLY WITH</span>
            <span className="block">STUDENT ID</span>
          </p>
        </div>
      </div>
    </div>
  );
}
