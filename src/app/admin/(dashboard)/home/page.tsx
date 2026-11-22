"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowUp, ArrowDown, Trash2, Plus, Save, Wand2 } from "lucide-react";

type HeroSlide = { imageUrl: string; alt: string };
type CollectionCard = { label: string; href: string; imageUrl?: string | null; collectionId?: number | null; description?: string | null };
type Testimonial = { quote: string; author: string; role: string };
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

const TABS = ["Hero", "Everything a Thomian needs", "Most popular", "Our community", "Navigation"] as const;

const field =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-500";
const btn =
  "inline-flex items-center gap-2 rounded-full bg-cta-accent px-5 py-2.5 text-xs font-semibold text-accent-ink transition-transform hover:scale-[1.02] disabled:opacity-60";
const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100";

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
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading home page setup…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-stone-950">Home page setup</h1>
          <p className="mt-1 text-sm text-stone-500">
            Choose exactly what appears on the storefront home page.
          </p>
        </div>
        <Link href="/" target="_blank" className={btnGhost}>
          View home page ↗
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              tab === t ? "bg-stone-950 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {message && (
        <div className="mb-5 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700">
          {message}
        </div>
      )}

      {/* ---------------- HERO ---------------- */}
      {tab === "Hero" && (
        <div className="space-y-4">
          <p className="text-sm text-stone-500">
            The hero cross-fades these images. Add as many as you like and order them.
          </p>
          {config.heroSlides.map((sl, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-stone-200 bg-white p-4">
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
            </div>
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
            <button onClick={() => save("Hero")} disabled={saving} className={btn}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save hero
            </button>
          </div>
        </div>
      )}

      {/* ---------------- COLLECTIONS ---------------- */}
      {tab === TABS[1] && (
        <div className="space-y-4">
          <p className="text-sm text-stone-500">
            Each card can point at a real collection or be a custom link. Cards without an image
            still render — the title and link are what matter.
          </p>

          {config.collectionCards.map((c, i) => (
            <div key={i} className="rounded-xl border border-stone-200 bg-white p-4">
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
            </div>
          ))}

          <div className="flex flex-wrap gap-3">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white p-3">
              <Wand2 className="h-4 w-4 text-stone-400" />
              <select
                className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
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

            <button onClick={() => save("Collections")} disabled={saving} className={btn}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
          </div>
        </div>
      )}

      {/* ---------------- MOST POPULAR ---------------- */}
      {tab === TABS[2] && (
        <div className="space-y-4">
          <p className="text-sm text-stone-500">
            Pick from the catalogue — the live product is always shown, so price and stock stay in
            sync. Nothing is copied.
          </p>

          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-stone-500">
              Selected ({config.featuredProductIds.length})
            </p>
            {config.featuredProductIds.length === 0 ? (
              <p className="text-sm text-stone-500">
                Nothing picked yet — the four newest products are shown by default.
              </p>
            ) : (
              <ul className="space-y-2">
                {config.featuredProductIds.map((id, i) => {
                  const p = payload.products.find((x) => x.id === id);
                  return (
                    <li key={id} className="flex items-center gap-3 rounded-lg border border-stone-200 p-2.5">
                      {p?.image && /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.image} alt="" className="h-12 w-10 rounded object-cover" />}
                      <span className="flex-1 text-sm text-stone-800">{p?.name ?? `#${id}`}</span>
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
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-stone-500">
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

          <button onClick={() => save("Most popular")} disabled={saving} className={btn}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save most popular
          </button>
        </div>
      )}

      {/* ---------------- TESTIMONIALS ---------------- */}
      {tab === TABS[3] && (
        <div className="space-y-4">
          <p className="text-sm text-stone-500">
            Write your own, or prefill one from a customer review and edit it. What is shown here is
            a quote — it does not affect the review section.
          </p>

          {config.testimonials.map((t, i) => (
            <div key={i} className="rounded-xl border border-stone-200 bg-white p-4">
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
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() =>
                setConfig({
                  ...config,
                  testimonials: [...config.testimonials, { quote: "", author: "", role: "" }],
                })
              }
              className={btnGhost}
            >
              <Plus className="h-3.5 w-3.5" /> Write one
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-3">
              <Wand2 className="h-4 w-4 text-stone-400" />
              <select
                className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
                defaultValue=""
                onChange={(e) => {
                  const r = payload.reviews.find((x) => String(x.id) === e.target.value);
                  if (!r) return;
                  setConfig({
                    ...config,
                    testimonials: [
                      ...config.testimonials,
                      { quote: r.body || r.title, author: r.author, role: "Customer review" },
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

            <button onClick={() => save("Testimonials")} disabled={saving} className={btn}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
          </div>
        </div>
      )}

      {/* ---------------- NAVIGATION ---------------- */}
      {tab === TABS[4] && (
        <div className="space-y-4">
          <p className="text-sm text-stone-500">
            The header links, in order. Add a child link to turn a button into a dropdown.
          </p>

          {config.navLinks.map((l, i) => (
            <div key={i} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className={field}
                  value={l.label}
                  placeholder="Label"
                  onChange={(e) => {
                    const next = [...config.navLinks];
                    next[i] = { ...l, label: e.target.value };
                    setConfig({ ...config, navLinks: next });
                  }}
                />
                <input
                  className={field}
                  value={l.href}
                  placeholder="/shop"
                  onChange={(e) => {
                    const next = [...config.navLinks];
                    next[i] = { ...l, href: e.target.value };
                    setConfig({ ...config, navLinks: next });
                  }}
                />
              </div>

              {(l.children ?? []).length > 0 && (
                <div className="mt-3 space-y-2 border-l-2 border-stone-200 pl-4">
                  {(l.children ?? []).map((ch, ci) => (
                    <div key={ci} className="flex gap-2">
                      <input
                        className={field}
                        value={ch.label}
                        placeholder="Child label"
                        onChange={(e) => {
                          const next = [...config.navLinks];
                          const kids = [...(l.children ?? [])];
                          kids[ci] = { ...ch, label: e.target.value };
                          next[i] = { ...l, children: kids };
                          setConfig({ ...config, navLinks: next });
                        }}
                      />
                      <input
                        className={field}
                        value={ch.href}
                        placeholder="/tickets"
                        onChange={(e) => {
                          const next = [...config.navLinks];
                          const kids = [...(l.children ?? [])];
                          kids[ci] = { ...ch, href: e.target.value };
                          next[i] = { ...l, children: kids };
                          setConfig({ ...config, navLinks: next });
                        }}
                      />
                      <button
                        onClick={() => {
                          const next = [...config.navLinks];
                          next[i] = {
                            ...l,
                            children: (l.children ?? []).filter((_, x) => x !== ci),
                          };
                          setConfig({ ...config, navLinks: next });
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => setConfig({ ...config, navLinks: move(config.navLinks, i, -1) })} className={btnGhost}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setConfig({ ...config, navLinks: move(config.navLinks, i, 1) })} className={btnGhost}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    const next = [...config.navLinks];
                    next[i] = {
                      ...l,
                      children: [...(l.children ?? []), { label: "New link", href: "/shop" }],
                    };
                    setConfig({ ...config, navLinks: next });
                  }}
                  className={btnGhost}
                >
                  <Plus className="h-3.5 w-3.5" /> Child link
                </button>
                <button
                  onClick={() => setConfig({ ...config, navLinks: config.navLinks.filter((_, x) => x !== i) })}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                setConfig({ ...config, navLinks: [...config.navLinks, { label: "New link", href: "/shop" }] })
              }
              className={btnGhost}
            >
              <Plus className="h-3.5 w-3.5" /> Add link
            </button>
            <button onClick={() => save("Navigation")} disabled={saving} className={btn}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save navigation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
