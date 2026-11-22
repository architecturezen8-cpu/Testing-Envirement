"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection } from "@/components/ui/animated-section";
import Link from "next/link";
import { Loader2, ArrowUp, ArrowDown, Trash2, Plus, Save, Wand2 } from "lucide-react";

type HeroSlide = { imageUrl: string; alt: string };
type CollectionCard = { label: string; href: string; imageUrl?: string | null; collectionId?: number | null; description?: string | null };
type Testimonial = { quote: string; author: string; role: string; stars?: number };
type NavLink = { label: string; href: string; children?: { label: string; href: string }[] };

type Config = {
  heroSlides: HeroSlide[];
  heroIntervalMs: number;
  collectionCards: CollectionCard[];
  featuredProductIds: number[];
  testimonials: Testimonial[];
  navLinks: NavLink[];
};

type ApiPayload = {
  config: Config;
  products: { id: number; name: string; category: string; image: string | null }[];
  collections: { id: number; name: string; slug: string; image: string | null; description: string | null }[];
  reviews: { id: number; title: string; body: string; author: string; rating: number }[];
};

const TABS = ["Hero", "Everything a Thomian needs", "Most popular", "Reviews"] as const;

const field =
  "w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-ink placeholder:text-stone-400 outline-none transition-colors focus:border-accent/60 focus:bg-white/[0.06]";
const btn =
  "inline-flex items-center gap-2 rounded-full bg-cta-accent px-5 py-2.5 text-xs font-semibold text-accent-ink shadow-cta transition-all duration-500 hover:bg-cta-accent-hover hover:shadow-cta-hover disabled:opacity-60";
const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-xs font-medium text-ink/80 transition-colors hover:border-accent/50 hover:text-ink";

export default function HomePageAdmin() {
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/homepage")
      .then((r) => r.json())
      .then((d: ApiPayload) => {
        setPayload(d);
        setConfig(d.config);
      })
      .catch(() => setMessage("Could not load the home page configuration."));
  }, []);

  const flash = (m: string) => {
    setMessage(m);
    window.setTimeout(() => setMessage(""), 2500);
  };

  const save = async (section: string) => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, ...config }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Save failed");
      flash(`${section} saved ✓`);
    } catch (e) {
      flash((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const move = <T,>(list: T[], i: number, dir: -1 | 1): T[] => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const copy = [...list];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  };

  if (!config || !payload) {
    return (
      <div className="flex items-center gap-2 text-sm text-stone-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading home page setup…
      </div>
    );
  }

  return (
    <div>
      <AnimatedSection>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-stone-950">Home page setup</h1>
          <p className="mt-1 text-sm text-stone-400">
            Choose exactly what appears on the storefront home page.
          </p>
        </div>
        <Link href="/" target="_blank" className={btnGhost}>
          View home page ↗
        </Link>
      </div>
      </AnimatedSection>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {TABS.map((t, ti) => (
          <motion.button
            key={t}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: ti * 0.05, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              tab === t ? "bg-stone-950 text-white" : "text-ink/70 hover:bg-white/[0.06]"
            }`}
          >
            {t}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mb-5 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm text-ink"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- HERO ---------------- */}
      {tab === "Hero" && (
        <div className="space-y-4">
          <p className="text-sm text-stone-400">
            The hero cross-fades these images. Add as many as you like and order them.
          </p>
          {config.heroSlides.map((sl, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="flex gap-3 rounded-xl border border-white/12 bg-white/[0.03] p-4">
              {sl.imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={sl.imageUrl} alt="" className="h-24 w-20 rounded-lg object-cover" />
              )}
              <div className="flex-1 space-y-2">
                <input
                  className={field}
                  value={sl.imageUrl}
                  placeholder="Image URL (/images/... or https://...)"
                  onChange={(e) => {
                    const next = [...config.heroSlides];
                    next[i] = { ...sl, imageUrl: e.target.value };
                    setConfig({ ...config, heroSlides: next });
                  }}
                />
                <input
                  className={field}
                  value={sl.alt}
                  placeholder="Alt text (shown if the image fails)"
                  onChange={(e) => {
                    const next = [...config.heroSlides];
                    next[i] = { ...sl, alt: e.target.value };
                    setConfig({ ...config, heroSlides: next });
                  }}
                />
              </div>
              <div className="flex flex-col justify-between">
                <div className="flex gap-1">
                  <button onClick={() => setConfig({ ...config, heroSlides: move(config.heroSlides, i, -1) })} className={btnGhost} aria-label="Move up">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setConfig({ ...config, heroSlides: move(config.heroSlides, i, 1) })} className={btnGhost} aria-label="Move down">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() =>
                    setConfig({ ...config, heroSlides: config.heroSlides.filter((_, x) => x !== i) })
                  }
                  className="text-red-600 hover:underline"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                setConfig({
                  ...config,
                  heroSlides: [...config.heroSlides, { imageUrl: "", alt: "College photograph" }],
                })
              }
              className={btnGhost}
            >
              <Plus className="h-3.5 w-3.5" /> Add slide
            </button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => save("Hero")} disabled={saving} className={btn}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save hero
            </motion.button>
          </div>
        </div>
      )}

      {/* ---------------- COLLECTIONS ---------------- */}
      {tab === TABS[1] && (
        <div className="space-y-4">
          <p className="text-sm text-stone-400">
            Each card can point at a real collection or be a custom link. Cards without an image
            still render — the title and link are what matter.
          </p>

          {config.collectionCards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl border border-white/12 bg-white/[0.03] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className={field}
                  value={c.label}
                  placeholder="Card title"
                  onChange={(e) => {
                    const next = [...config.collectionCards];
                    next[i] = { ...c, label: e.target.value };
                    setConfig({ ...config, collectionCards: next });
                  }}
                />
                <input
                  className={field}
                  value={c.href}
                  placeholder="Link (e.g. /shop?category=Badges)"
                  onChange={(e) => {
                    const next = [...config.collectionCards];
                    next[i] = { ...c, href: e.target.value };
                    setConfig({ ...config, collectionCards: next });
                  }}
                />
                <input
                  className={field}
                  value={c.imageUrl ?? ""}
                  placeholder="Image URL (optional)"
                  onChange={(e) => {
                    const next = [...config.collectionCards];
                    next[i] = { ...c, imageUrl: e.target.value || null };
                    setConfig({ ...config, collectionCards: next });
                  }}
                />
                <input
                  className={field}
                  value={c.description ?? ""}
                  placeholder="Short description (optional)"
                  onChange={(e) => {
                    const next = [...config.collectionCards];
                    next[i] = { ...c, description: e.target.value || null };
                    setConfig({ ...config, collectionCards: next });
                  }}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => setConfig({ ...config, collectionCards: move(config.collectionCards, i, -1) })} className={btnGhost}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setConfig({ ...config, collectionCards: move(config.collectionCards, i, 1) })} className={btnGhost}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() =>
                    setConfig({ ...config, collectionCards: config.collectionCards.filter((_, x) => x !== i) })
                  }
                  className="ml-auto inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </motion.div>
          ))}

          <div className="flex flex-wrap gap-3">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] p-3">
              <Wand2 className="h-4 w-4 text-stone-400" />
              <select
                className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-sm text-ink"
                defaultValue=""
                onChange={(e) => {
                  const col = payload.collections.find((c) => String(c.id) === e.target.value);
                  if (!col) return;
                  setConfig({
                    ...config,
                    collectionCards: [
                      ...config.collectionCards,
                      {
                        label: col.name,
                        href: `/shop?collection=${col.slug}`,
                        imageUrl: col.image,
                        collectionId: col.id,
                        description: col.description,
                      },
                    ],
                  });
                  e.target.value = "";
                }}
              >
                <option value="">Add a collection…</option>
                {payload.collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() =>
                setConfig({
                  ...config,
                  collectionCards: [
                    ...config.collectionCards,
                    { label: "New card", href: "/shop", imageUrl: null, description: null },
                  ],
                })
              }
              className={btnGhost}
            >
              <Plus className="h-3.5 w-3.5" /> Custom card
            </button>

            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => save("Collections")} disabled={saving} className={btn}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </motion.button>
          </div>
        </div>
      )}

      {/* ---------------- MOST POPULAR ---------------- */}
      {tab === TABS[2] && (
        <div className="space-y-4">
          <p className="text-sm text-stone-400">
            Pick from the catalogue — the live product is always shown, so price and stock stay in
            sync. Nothing is copied.
          </p>

          <div className="rounded-xl border border-white/12 bg-white/[0.03] p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-stone-400">
              Selected ({config.featuredProductIds.length})
            </p>
            {config.featuredProductIds.length === 0 ? (
              <p className="text-sm text-stone-400">
                Nothing picked yet — the four newest products are shown by default.
              </p>
            ) : (
              <ul className="space-y-2">
                {config.featuredProductIds.map((id, i) => {
                  const p = payload.products.find((x) => x.id === id);
                  return (
                    <motion.li
                      key={id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center gap-3 rounded-lg border border-white/12 p-2.5">
                      {p?.image && /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.image} alt="" className="h-12 w-10 rounded object-cover" />}
                      <span className="flex-1 text-sm text-ink">{p?.name ?? `#${id}`}</span>
                      <button onClick={() => setConfig({ ...config, featuredProductIds: move(config.featuredProductIds, i, -1) })} className={btnGhost}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setConfig({ ...config, featuredProductIds: move(config.featuredProductIds, i, 1) })} className={btnGhost}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setConfig({
                            ...config,
                            featuredProductIds: config.featuredProductIds.filter((x) => x !== id),
                          })
                        }
                        className="text-red-600 hover:underline"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-white/12 bg-white/[0.03] p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-stone-400">
              Add from the catalogue
            </p>
            <select
              className={field}
              defaultValue=""
              onChange={(e) => {
                const id = Number(e.target.value);
                if (!id || config.featuredProductIds.includes(id)) return;
                setConfig({ ...config, featuredProductIds: [...config.featuredProductIds, id] });
                e.target.value = "";
              }}
            >
              <option value="">Choose a product…</option>
              {payload.products.map((p) => (
                <option key={p.id} value={p.id} disabled={config.featuredProductIds.includes(p.id)}>
                  {p.name} — {p.category}
                </option>
              ))}
            </select>
          </div>

          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => save("Most popular")} disabled={saving} className={btn}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save most popular
          </motion.button>
        </div>
      )}

      {/* ---------------- TESTIMONIALS ---------------- */}
      {tab === TABS[3] && (
        <div className="space-y-4">
          <p className="text-sm text-stone-400">
            Write your own, or prefill one from a customer review and edit it. What is shown here is
            a quote — it does not affect the review section.
          </p>

          {config.testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl border border-white/12 bg-white/[0.03] p-4">
              <textarea
                className={field}
                rows={2}
                value={t.quote}
                placeholder="Quote"
                onChange={(e) => {
                  const next = [...config.testimonials];
                  next[i] = { ...t, quote: e.target.value };
                  setConfig({ ...config, testimonials: next });
                }}
              />
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  className={field}
                  value={t.author}
                  placeholder="Name"
                  onChange={(e) => {
                    const next = [...config.testimonials];
                    next[i] = { ...t, author: e.target.value };
                    setConfig({ ...config, testimonials: next });
                  }}
                />
                <input
                  className={field}
                  value={t.role}
                  placeholder="Role (e.g. Parent, Grade 9 / Old Boys' Union)"
                  onChange={(e) => {
                    const next = [...config.testimonials];
                    next[i] = { ...t, role: e.target.value };
                    setConfig({ ...config, testimonials: next });
                  }}
                />
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-stone-400">
                    Stars
                  </p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          const next = [...config.testimonials];
                          next[i] = { ...t, stars: n };
                          setConfig({ ...config, testimonials: next });
                        }}
                        className={`h-9 w-9 rounded-lg border text-lg leading-none transition-colors ${
                          (t.stars ?? 5) >= n
                            ? "border-accent/50 bg-accent/15 text-accent"
                            : "border-white/12 text-stone-400 hover:border-accent/30"
                        }`}
                        aria-label={`${n} star${n === 1 ? "" : "s"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => setConfig({ ...config, testimonials: move(config.testimonials, i, -1) })} className={btnGhost}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setConfig({ ...config, testimonials: move(config.testimonials, i, 1) })} className={btnGhost}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() =>
                    setConfig({ ...config, testimonials: config.testimonials.filter((_, x) => x !== i) })
                  }
                  className="ml-auto inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </motion.div>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() =>
                setConfig({
                  ...config,
                  testimonials: [...config.testimonials, { quote: "", author: "", role: "", stars: 5 }],
                })
              }
              className={btnGhost}
            >
              <Plus className="h-3.5 w-3.5" /> Write one
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.03] p-3">
              <Wand2 className="h-4 w-4 text-stone-400" />
              <select
                className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-sm text-ink"
                defaultValue=""
                onChange={(e) => {
                  const r = payload.reviews.find((x) => String(x.id) === e.target.value);
                  if (!r) return;
                  setConfig({
                    ...config,
                    testimonials: [
                      ...config.testimonials,
                      {
                        quote: r.body || r.title,
                        author: r.author,
                        role: "Customer review",
                        stars: Number(r.rating) || 5,
                      },
                    ],
                  });
                  e.target.value = "";
                }}
              >
                <option value="">Pull from a review…</option>
                {payload.reviews.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.author} — {r.title?.slice(0, 40)}
                  </option>
                ))}
              </select>
            </div>

            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => save("Reviews")} disabled={saving} className={btn}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </motion.button>
          </div>
        </div>
      )}

    </div>
  );
}
