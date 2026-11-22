"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, CalendarDays, MapPin, Ticket } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/db/schema";

const field =
  "w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-ink placeholder:text-stone-400 outline-none transition-colors focus:border-accent/60 focus:bg-white/[0.06]";
const btn =
  "inline-flex items-center gap-2 rounded-full bg-cta-accent px-5 py-2.5 text-xs font-semibold text-accent-ink shadow-cta transition-all duration-500 hover:bg-cta-accent-hover hover:shadow-cta-hover disabled:opacity-60";

const ALL_TIERS = ["1 Ticket", "2 Tickets", "3 Tickets", "4 Tickets", "Family Pass", "Custom"];

type TicketDraft = {
  eventName: string;
  eventDate: string;
  venue: string;
  tier: string;
  blurb: string;
  price: number;
  compareAtPrice: number | null;
  badge: string;
  tiers: string[];
  stock: number;
};

const EMPTY: TicketDraft = {
  eventName: "",
  eventDate: "",
  venue: "College Grounds, Matale",
  tier: "General",
  blurb: "",
  price: 1000,
  compareAtPrice: null,
  badge: "",
  tiers: ["1 Ticket", "2 Tickets", "Family Pass", "Custom"],
  stock: 200,
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<TicketDraft | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  // A file picked before the ticket exists is kept here and uploaded right after creation.
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const fetchTickets = () => {
    setLoading(true);
    fetch("/api/admin/tickets")
      .then((r) => r.json())
      .then((d) => setTickets(Array.isArray(d) ? d : []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const flash = (m: string) => {
    setMessage(m);
    window.setTimeout(() => setMessage(""), 2500);
  };

  const openNew = () => {
    setEditingId(null);
    setDraft(EMPTY);
    setError("");
    setUploadedUrl(null);
    setPendingFile(null);
  };

  const openEdit = (t: Product) => {
    setEditingId(t.id);
    setDraft({
      eventName: t.name,
      eventDate: t.description.split("Event: ")[1]?.split("\n")[0] ?? "",
      venue: t.description.split("Venue: ")[1]?.split("\n")[0] ?? "",
      tier: t.description.split("Tier: ")[1]?.split("\n")[0] ?? "General",
      blurb: t.description.split("\n\n")[0] ?? "",
      price: t.price,
      compareAtPrice: t.compareAtPrice ?? null,
      badge: t.badge ?? "",
      tiers: t.sizes?.length ? t.sizes : ["1 Ticket"],
      stock: t.stock,
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...draft,
        compareAtPrice: draft.compareAtPrice || null,
        ...(editingId ? { id: editingId } : {}),
      };
      const res = editingId
        ? await fetch(`/api/admin/products/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: draft.eventName,
              slug: draft.eventName
                .toLowerCase()
                .replace(/['’]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, ""),
              description: [
                draft.blurb.trim(),
                "",
                `Event: ${draft.eventDate}`,
                `Venue: ${draft.venue}`,
                `Tier: ${draft.tier}`,
              ].join("\n"),
              price: draft.price,
              compareAtPrice: draft.compareAtPrice || null,
              category: "Event Tickets",
              gender: "Unisex",
              sizes: draft.tiers,
              colors: [],
              images: ["/images/school-3.jpg"],
              stock: draft.stock,
              inStock: draft.stock > 0,
              badge: draft.badge || null,
              offerActive: Boolean(draft.compareAtPrice && draft.compareAtPrice > draft.price),
              offerLabel:
                draft.compareAtPrice && draft.compareAtPrice > draft.price ? "Early bird" : null,
            }),
          })
        : await fetch("/api/admin/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      flash(editingId ? "Ticket updated ✓" : "Ticket created ✓");

      // A file chosen before the ticket existed is uploaded now that we know
      // the product id.
      const createdId = editingId ?? data.id;
      if (pendingFile && createdId) {
        await uploadArtwork(pendingFile, createdId);
      } else {
        setDraft(null);
        setEditingId(null);
      }

      fetchTickets();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this ticket?")) return;
    await fetch(`/api/admin/tickets?id=${id}`, { method: "DELETE" });
    fetchTickets();
  };

  const uploadArtwork = async (file: File, productId: number) => {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", String(productId));
      const res = await fetch("/api/admin/tickets/image", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Upload failed");
      setUploadedUrl(d.url);
      setPendingFile(null);
      flash("Artwork uploaded ✓");
      fetchTickets();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const toggleTier = (t: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      tiers: draft.tiers.includes(t)
        ? draft.tiers.filter((x) => x !== t)
        : [...draft.tiers, t],
    });
  };

  const filtered = tickets.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-medium text-stone-950">Event Tickets</h1>
          <p className="mt-1 text-stone-500">
            Create real bookable tickets — event, date, venue and tiers.
          </p>
        </div>
        <button onClick={openNew} className={btn}>
          <Plus className="h-4 w-4" /> Add Ticket
        </button>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm text-ink"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Form ---------- */}
      <AnimatePresence>
        {draft && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
              <h2 className="font-serif text-xl text-stone-950">
                {editingId ? "Edit ticket" : "New ticket"}
              </h2>
              <p className="mt-1 text-sm text-stone-400">
                These fields become the printed ticket on the storefront.
              </p>

              {/* ---- Ticket artwork ---- */}
              <div className="mt-6 rounded-xl border border-white/12 bg-white/[0.03] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-950">
                  Ticket artwork
                </p>
                <p className="mt-1 text-sm text-stone-400">
                  Upload the finished ticket design. Leave an empty{" "}
                  <span className="text-ink">white square</span> where the QR code should go — it is
                  detected automatically and the buyer&apos;s QR is drawn there.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-cta-accent px-5 py-2.5 text-xs font-semibold text-accent-ink">
                    {uploading ? "Uploading…" : pendingFile ? "Change image" : "Choose image"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (editingId) {
                          // Ticket already exists — upload straight away.
                          uploadArtwork(f, editingId);
                        } else {
                          // Ticket not created yet — hold it, it is uploaded
                          // automatically right after "Create ticket".
                          setPendingFile(f);
                          setUploadedUrl(URL.createObjectURL(f));
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>

                  {uploadedUrl && <span className="text-xs text-green-700">Artwork ready ✓</span>}
                  {pendingFile && !editingId && (
                    <span className="text-xs text-stone-400">
                      Saved with the ticket when you create it
                    </span>
                  )}
                  {uploading && <span className="text-xs text-stone-400">Uploading…</span>}
                </div>

                {uploadedUrl && (
                  <div className="mt-4 flex flex-wrap gap-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedUrl}
                      alt="Ticket artwork preview"
                      className="h-44 rounded-lg border border-white/12 object-contain"
                    />
                    <div className="max-w-xs text-xs text-stone-400">
                      <p className="font-medium text-stone-950">QR placement</p>
                      <p className="mt-1">
                        The storefront scans this image for the largest white square and paints the
                        buyer&apos;s unique QR over it.
                      </p>
                      <p className="mt-2">
                        No white square? The QR falls back to the right-hand stub.
                      </p>
                      <p className="mt-2 text-stone-950">
                        Tip: keep the square plain white and at least a quarter of the ticket wide.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    Event name
                  </label>
                  <input
                    className={field}
                    value={draft.eventName}
                    placeholder="Big Match — St. Thomas' vs St. Anthony's"
                    onChange={(e) => setDraft({ ...draft, eventName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    Date &amp; time
                  </label>
                  <input
                    className={field}
                    value={draft.eventDate}
                    placeholder="Sat 14 March 2026 · 8.30am"
                    onChange={(e) => setDraft({ ...draft, eventDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    Venue
                  </label>
                  <input
                    className={field}
                    value={draft.venue}
                    onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    Tier (shown on the ticket stub)
                  </label>
                  <select
                    className={field}
                    value={draft.tier}
                    onChange={(e) => setDraft({ ...draft, tier: e.target.value })}
                  >
                    {["General", "Pavilion", "VIP", "Family", "Student", "Old Boys"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    Badge (optional)
                  </label>
                  <input
                    className={field}
                    value={draft.badge}
                    placeholder="Selling fast / Limited"
                    onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    Price per ticket (Rs.)
                  </label>
                  <input
                    type="number"
                    className={field}
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    Early-bird price (optional)
                  </label>
                  <input
                    type="number"
                    className={field}
                    value={draft.compareAtPrice ?? ""}
                    placeholder="Crossed-out original"
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        compareAtPrice: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    Event description
                  </label>
                  <textarea
                    className={field}
                    rows={3}
                    value={draft.blurb}
                    placeholder="What the ticket covers, entry times, what to bring…"
                    onChange={(e) => setDraft({ ...draft, blurb: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    Quantity tiers buyers can choose
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_TIERS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTier(t)}
                        className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                          draft.tiers.includes(t)
                            ? "border-accent/60 bg-accent/15 text-accent"
                            : "border-white/12 text-ink/60 hover:border-accent/30"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    Tickets available
                  </label>
                  <input
                    type="number"
                    className={field}
                    value={draft.stock}
                    onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })}
                  />
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <button onClick={save} disabled={saving} className={btn}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Create ticket"}
                </button>
                <button
                  onClick={() => {
                    setDraft(null);
                    setEditingId(null);
                  }}
                  className="rounded-full border border-white/12 px-5 py-2.5 text-xs font-medium text-ink/80 hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Search ---------- */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Search tickets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-full border border-white/12 bg-white/[0.04] py-3 pl-12 pr-4 text-sm text-ink placeholder:text-stone-400 outline-none focus:border-accent/50"
        />
      </div>

      {/* ---------- List ---------- */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 py-20 text-center">
          <Ticket className="mx-auto h-10 w-10 text-stone-400" />
          <p className="mt-4 text-ink/70">No tickets yet.</p>
          <button onClick={openNew} className={`mt-4 ${btn}`}>
            <Plus className="h-4 w-4" /> Add your first ticket
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((t, i) => {
              const date = t.description.split("Event: ")[1]?.split("\n")[0];
              const venue = t.description.split("Venue: ")[1]?.split("\n")[0];
              const tier = t.description.split("Tier: ")[1]?.split("\n")[0];
              return (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-white/12 bg-white/[0.03] p-4"
                >
                  {t.images?.[0] && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={t.images[0]}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-950">{t.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400">
                      {date && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" /> {date}
                        </span>
                      )}
                      {venue && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {venue}
                        </span>
                      )}
                      {tier && <span className="uppercase tracking-wide">{tier}</span>}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-stone-950">
                      {formatPrice(t.price)}
                    </p>
                    <p className="text-xs text-stone-400">{t.stock} available</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/products/${t.slug}`}
                      target="_blank"
                      className="rounded-lg border border-white/12 px-3 py-1.5 text-xs font-medium text-ink/80 hover:border-accent/50"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => openEdit(t)}
                      className="rounded-lg border border-white/12 px-3 py-1.5 text-xs font-medium text-ink/80 hover:border-accent/50"
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(t.id)}
                      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-600 hover:bg-red-500/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
