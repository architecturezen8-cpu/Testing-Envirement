import { db } from "@/db";
import { homepageConfig, products, collections } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export type HeroSlide = {
  imageUrl: string;
  alt: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

export type CollectionCard = {
  label: string;
  href: string;
  imageUrl?: string | null;
  collectionId?: number | null;
  description?: string | null;
};

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
  sourceReviewId?: number | null;
};

export type NavLink = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export type HomeConfig = {
  heroSlides: HeroSlide[];
  heroIntervalMs: number;
  collectionCards: CollectionCard[];
  featuredProductIds: number[];
  testimonials: Testimonial[];
  navLinks: NavLink[];
};

/** Fallback used until the admin saves anything, or if the row is missing. */
export const DEFAULT_CONFIG: HomeConfig = {
  heroSlides: [
    { imageUrl: "/images/school-1.jpg", alt: "St. Thomas' College Matale — the college building" },
    { imageUrl: "/images/school-2.jpg", alt: "St. Thomas' College Matale — students" },
    { imageUrl: "/images/school-3.jpg", alt: "St. Thomas' College Matale — merchandise" },
  ],
  heroIntervalMs: 6500,
  collectionCards: [],
  featuredProductIds: [],
  testimonials: [],
  navLinks: [],
};

function coerce(value: unknown): HomeConfig {
  const r = (value ?? {}) as Partial<HomeConfig>;
  return {
    heroSlides: Array.isArray(r.heroSlides) ? r.heroSlides : DEFAULT_CONFIG.heroSlides,
    heroIntervalMs:
      typeof r.heroIntervalMs === "number" && r.heroIntervalMs >= 2000
        ? r.heroIntervalMs
        : DEFAULT_CONFIG.heroIntervalMs,
    collectionCards: Array.isArray(r.collectionCards) ? r.collectionCards : [],
    featuredProductIds: Array.isArray(r.featuredProductIds)
      ? r.featuredProductIds.filter((n) => typeof n === "number")
      : [],
    testimonials: Array.isArray(r.testimonials) ? r.testimonials : [],
    navLinks: Array.isArray(r.navLinks) ? r.navLinks : [],
  };
}

/** Reads the config row, creating it on first use. Never throws. */
export async function getHomeConfig(): Promise<HomeConfig> {
  try {
    const rows = await db.select().from(homepageConfig).where(eq(homepageConfig.id, 1)).limit(1);
    if (rows.length) return coerce(rows[0]);
    await db.insert(homepageConfig).values({ id: 1 }).onConflictDoNothing();
    return DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveHomeConfig(patch: Partial<HomeConfig>): Promise<HomeConfig> {
  const current = await getHomeConfig();
  const next = coerce({ ...current, ...patch });

  await db
    .insert(homepageConfig)
    .values({ id: 1, ...next, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: homepageConfig.id,
      set: { ...next, updatedAt: new Date() },
    });

  return next;
}

/**
 * Resolves the "Most popular" section: the admin stores product IDs so the
 * catalogue stays the single source of truth. If nothing has been picked yet,
 * fall back to the newest products so the section is never empty.
 */
export async function getFeaturedProducts() {
  const config = await getHomeConfig();

  if (config.featuredProductIds.length) {
    const all = await db.select().from(products);
    const byId = new Map(all.map((p) => [p.id, p]));
    const picked = config.featuredProductIds
      .map((id) => byId.get(id))
      .filter((p): p is (typeof all)[number] => Boolean(p));
    if (picked.length) return picked;
  }

  return db.select().from(products).orderBy(desc(products.createdAt)).limit(4);
}

/**
 * Resolves the "Everything a Thomian needs" cards. Cards the admin linked to a
 * real collection pull the live name/description/image from that collection;
 * fully custom cards render exactly as entered.
 */
export async function getCollectionCards() {
  const config = await getHomeConfig();

  if (config.collectionCards.length) return config.collectionCards;

  const rows = await db
    .select()
    .from(collections)
    .orderBy(collections.sortOrder);

  return rows.map((c) => ({
    label: c.name,
    href: `/shop?collection=${c.slug}`,
    imageUrl: c.image,
    collectionId: c.id,
    description: c.description,
  }));
}
