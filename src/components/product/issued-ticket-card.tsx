"use client";

import { useState } from "react";
import { SchoolCrest } from "@/components/layout/school-crest";
import { useWhiteSquareDetector } from "@/lib/use-white-square";

/**
 * A booked ticket.
 *
 * Layout: the admin's uploaded ticket artwork fills the card, and the QR code
 * is painted over the white square the artwork leaves for it. When no artwork
 * (or no white square) is present the QR falls back to the right-hand stub.
 */

type Props = {
  ticketCode: string;
  eventName: string;
  eventDate?: string | null;
  venue?: string | null;
  tier?: string | null;
  attendeeName: string;
  quantity: number;
  status: string;
  qrDataUrl: string;
  imageUrl?: string | null;
  onDownload?: () => void;
};

export function IssuedTicketCard({
  ticketCode,
  eventName,
  eventDate,
  venue,
  tier,
  attendeeName,
  quantity,
  status,
  qrDataUrl,
  imageUrl,
  onDownload,
}: Props) {
  const box = useWhiteSquareDetector(imageUrl ?? "");
  const [imgFailed, setImgFailed] = useState(false);
  const valid = status === "valid";

  return (
    <div className="relative select-none">
      <div className="relative overflow-hidden rounded-xl bg-paper shadow-[0_18px_44px_-18px_rgba(0,0,0,0.8)] ring-1 ring-black/10">
        {/* ---------- Artwork (or default) ---------- */}
        <div className="relative">
          {imageUrl && !imgFailed ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt={`${eventName} ticket`}
              className="block w-full"
              onError={() => setImgFailed(true)}
            />
          ) : (
            // Default artwork when no upload exists yet
            <div className="flex flex-col justify-between gap-4 p-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-black/10 text-navy">
                  <SchoolCrest className="h-6 w-6" />
                </span>
                <p className="text-[9px] font-semibold uppercase leading-none tracking-[0.18em] text-navy">
                  St. Thomas&apos; College
                  <span className="mt-0.5 block text-[7px] font-medium tracking-[0.14em] opacity-70">
                    Matale · Est. 1873
                  </span>
                </p>
              </div>
              <h4 className="font-serif text-lg font-semibold leading-snug text-navy">
                {eventName}
              </h4>
              <div className="flex items-end justify-between gap-3">
                <div className="space-y-1 text-[11px] text-stone-600">
                  {eventDate && <p>■ {eventDate}</p>}
                  {venue && <p>○ {venue}</p>}
                </div>
                <div className="flex h-10 items-stretch gap-[1.5px] opacity-70">
                  {[3, 1, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 2, 1].map((w, i) => (
                    <span
                      key={i}
                      className="block h-full"
                      style={{ width: `${w}px`, backgroundColor: i % 2 ? "transparent" : "#1f2937" }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ---------- QR painted over the artwork ---------- */}
        {(() => {
          const style = box
            ? {
                left: `${box.left}%`,
                top: `${box.top}%`,
                transform: "translate(-50%, -50%)",
                width: `${Math.min(box.width, 42)}%`,
              }
            : { right: "6%", top: "50%", transform: "translateY(-50%)", width: "22%" };

          return (
            <div
              className="absolute flex flex-col items-center justify-center gap-1 rounded-md bg-white p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.18)]"
              style={style}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt={`QR for ${ticketCode}`} className="h-auto w-full" />
              <p className="text-center font-mono text-[6px] leading-none tracking-tight text-stone-700">
                {ticketCode}
              </p>
            </div>
          );
        })()}

        {/* ---------- Status ribbon ---------- */}
        {!valid && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/70">
            <span className="rounded-full bg-paper px-4 py-2 text-xs font-bold uppercase tracking-wide-2 text-ink">
              {status === "used" ? "Already scanned" : "Cancelled"}
            </span>
          </div>
        )}
      </div>

      {/* ---------- Details under the ticket ---------- */}
      <div className="mt-4 space-y-1.5 rounded-lg border border-white/12 bg-white/[0.03] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide-2 text-stone-400">Ticket reference</p>
            <p className="font-mono text-sm font-semibold text-ink">{ticketCode}</p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              valid ? "bg-green-500/15 text-green-700" : "bg-wine/20 text-wine"
            }`}
          >
            {valid ? "Valid" : status === "used" ? "Used" : "Cancelled"}
          </span>
        </div>

        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
          <div>
            <dt className="text-stone-400">Attendee</dt>
            <dd className="text-ink">{attendeeName}</dd>
          </div>
          <div>
            <dt className="text-stone-400">People</dt>
            <dd className="tabular-nums text-ink">{quantity}</dd>
          </div>
          {eventDate && (
            <div>
              <dt className="text-stone-400">Date</dt>
              <dd className="text-ink">{eventDate}</dd>
            </div>
          )}
          {venue && (
            <div>
              <dt className="text-stone-400">Venue</dt>
              <dd className="text-ink">{venue}</dd>
            </div>
          )}
          {tier && (
            <div>
              <dt className="text-stone-400">Tier</dt>
              <dd className="text-ink">{tier}</dd>
            </div>
          )}
        </dl>

        {onDownload && valid && (
          <button
            onClick={onDownload}
            className="mt-3 w-full rounded-full bg-cta-accent py-3 text-xs font-bold uppercase tracking-wide-2 text-accent-ink shadow-cta transition-all duration-500 hover:bg-cta-accent-hover hover:shadow-cta-hover"
          >
            Download ticket ↓
          </button>
        )}
      </div>
    </div>
  );
}
