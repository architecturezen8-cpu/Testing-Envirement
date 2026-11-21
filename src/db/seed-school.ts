/**
 * St. Thomas' College, Matale — school merchandise catalogue.
 *
 * Replaces the Nova demo catalogue with real school merchandise. Every item
 * is seeded with placeholder photography (Unsplash source URLs keyed by
 * search term) so the storefront looks complete out of the box.
 *
 * Run:  npx tsx src/db/seed-school.ts
 */
import "dotenv/config";
import { db } from "./index";
import { collections, categories, products, reviews, productVariants } from "./schema";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Deterministic Unsplash photo URL for a given search term + index. */
function img(term: string, i = 0) {
  const base = `https://images.unsplash.com/photo-`;
  // Stable pseudo-random photo ids per term so re-seeding looks the same.
  const seed = [...term].reduce((a, c) => a + c.charCodeAt(0), 0) + i * 7;
  const ids = [
    "1620963925608-9c9a31d8f6b4",
    "1584917865442-de89df76afd3",
    "1594633312681-425ac7d10336",
    "1521572163474-6864f9cf17ab",
    "1596462502278-27bfdc403348",
    "1564969500195-a3d6b1a2d34c",
    "1544816155-12df9643f363",
    "1576871337622-98d48d1cf531",
    "1571945153237-4929e783af4a",
    "1618354691373-d851c5c3a990",
    "1602810318383-e386cc2a3ccf",
    "1547949003-9792a18a2601",
    "1624222247344-550fb60583e0",
    "1519741497674-611481863552",
    "1611085583191-a3b181a88401",
    "1621072156002-e2fccdc0b176",
    "1585487000169-c7cc7193efda",
    "1595341888016-a392ef81b7de",
    "1556905055-8f358a7a47b2",
    "1583743814966-8936f5b7be1a",
  ];
  const id = ids[seed % ids.length];
  return `${base}${id}?auto=format&fit=crop&w=800&h=1200&q=80`;
}

function gallery(term: string) {
  return [img(term, 0), img(term, 1), img(term, 2)];
}

const NAVY = { name: "Navy", value: "#1e2a4a" };
const WHITE = { name: "White", value: "#f5f7fa" };
const BLACK = { name: "Black", value: "#101418" };
const GOLD = { name: "Gold", value: "#c9a86e" };
const GREY = { name: "Grey", value: "#6b7280" };
const MAROON = { name: "Maroon", value: "#5f2229" };

/* ------------------------------------------------------------------ */
/*  Catalogue                                                          */
/* ------------------------------------------------------------------ */

type Item = {
  name: string;
  slug: string;
  price: number;
  compareAt?: number;
  category: string;
  gender: string;
  description: string;
  sizes: string[];
  colors: { name: string; value: string }[];
  badge?: string;
  collection?: string;
};

const COLLECTIONS = [
  { name: "Uniforms & Wear", slug: "uniforms", description: "Shirts, ties and knitwear worn every day at the college.", featured: true, sortOrder: 1 },
  { name: "House Badges", slug: "house-badges", description: "Austin, Bede, Pius and Clement — wear your house with pride.", featured: true, sortOrder: 2 },
  { name: "Accessories", slug: "accessories", description: "Bags, caps, badges and everything else a Thomian needs.", featured: true, sortOrder: 3 },
  { name: "Stationery", slug: "stationery", description: "School masks and exam writing paper, always in stock.", featured: false, sortOrder: 4 },
  { name: "Event Tickets", slug: "event-tickets", description: "Big Match, sports meets, prize days and college events.", featured: true, sortOrder: 5 },
];

const CATEGORIES = [
  { name: "Uniforms", slug: "uniforms", sortOrder: 1 },
  { name: "Badges", slug: "badges", sortOrder: 2 },
  { name: "Bags", slug: "bags", sortOrder: 3 },
  { name: "Caps", slug: "caps", sortOrder: 4 },
  { name: "Ties", slug: "ties", sortOrder: 5 },
  { name: "Stationery", slug: "stationery", sortOrder: 6 },
  { name: "Event Tickets", slug: "event-tickets", sortOrder: 7 },
];

const ITEMS: Item[] = [
  /* ---------- Uniforms & wear ---------- */
  {
    name: "College Polo Shirt",
    slug: "college-polo-shirt",
    price: 3200,
    compareAt: 3800,
    category: "Uniforms",
    gender: "Unisex",
    description:
      "Embroidered college crest on the chest, in the official navy. Pique cotton, breathable for the Matale afternoons, and sized for Grade 1 right through to Advanced Level.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [NAVY, WHITE, BLACK],
    badge: "Popular",
    collection: "uniforms",
  },
  {
    name: "College Sports T-Shirt",
    slug: "college-sports-t-shirt",
    price: 2100,
    category: "Uniforms",
    gender: "Unisex",
    description:
      "Lightweight house-colour practice tee for PT and inter-house sports. Quick-dry fabric with a screen-printed crest.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [NAVY, WHITE, GREY],
    collection: "uniforms",
  },
  {
    name: "School White Shirt",
    slug: "school-white-shirt",
    price: 2900,
    category: "Uniforms",
    gender: "Boys",
    description:
      "The everyday white school shirt — short sleeve,college-fit, with a reinforced collar that survives a full term of wear.",
    sizes: ["24", "26", "28", "30", "32", "34", "36", "38"],
    colors: [WHITE],
    collection: "uniforms",
  },
  {
    name: "School Blazer",
    slug: "school-blazer",
    price: 11500,
    compareAt: 13500,
    category: "Uniforms",
    gender: "Boys",
    description:
      "Navy blazer with the college crest embroidered on the breast pocket. Required for prize days, official functions and the Big Match.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [NAVY, BLACK],
    badge: "Official",
    collection: "uniforms",
  },
  {
    name: "College Pullover",
    slug: "college-pullover",
    price: 4800,
    category: "Uniforms",
    gender: "Unisex",
    description:
      "V-neck navy pullover with the crest on the chest. Warm enough for early morning classes, smart enough for assembly.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [NAVY, BLACK],
    collection: "uniforms",
  },
  {
    name: "College Hoodie",
    slug: "college-hoodie",
    price: 5500,
    compareAt: 6200,
    category: "Uniforms",
    gender: "Unisex",
    description:
      "Heavyweight fleece hoodie with the college name across the back and the crest on the front. A favourite with the senior classes.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [NAVY, BLACK, MAROON],
    badge: "New",
    collection: "uniforms",
  },

  /* ---------- House badges ---------- */
  {
    name: "Austin House Badge",
    slug: "austin-house-badge",
    price: 450,
    category: "Badges",
    gender: "Unisex",
    description:
      "Enamelled metal house badge for Austin house, finished in the house colours. Pin-back fastening.",
    sizes: ["One Size"],
    colors: [GOLD, NAVY],
    collection: "house-badges",
  },
  {
    name: "Bede House Badge",
    slug: "bede-house-badge",
    price: 450,
    category: "Badges",
    gender: "Unisex",
    description:
      "Enamelled metal house badge for Bede house, finished in the house colours. Pin-back fastening.",
    sizes: ["One Size"],
    colors: [GOLD, NAVY],
    collection: "house-badges",
  },
  {
    name: "Pius House Badge",
    slug: "pius-house-badge",
    price: 450,
    category: "Badges",
    gender: "Unisex",
    description:
      "Enamelled metal house badge for Pius house, finished in the house colours. Pin-back fastening.",
    sizes: ["One Size"],
    colors: [GOLD, NAVY],
    collection: "house-badges",
  },
  {
    name: "Clement House Badge",
    slug: "clement-house-badge",
    price: 450,
    category: "Badges",
    gender: "Unisex",
    description:
      "Enamelled metal house badge for Clement house, finished in the house colours. Pin-back fastening.",
    sizes: ["One Size"],
    colors: [GOLD, NAVY],
    collection: "house-badges",
  },
  {
    name: "College Crest Badge",
    slug: "college-crest-badge",
    price: 550,
    category: "Badges",
    gender: "Unisex",
    description:
      "The full college crest as a metal badge — worn on the blazer pocket. Also available for old boys.",
    sizes: ["One Size"],
    colors: [GOLD, NAVY],
    badge: "Official",
    collection: "house-badges",
  },

  /* ---------- Bags ---------- */
  {
    name: "College School Bag",
    slug: "college-school-bag",
    price: 6500,
    compareAt: 7500,
    category: "Bags",
    gender: "Unisex",
    description:
      "Reinforced nylon school bag with the crest embroidered on the front, a padded laptop sleeve and a water bottle pocket.",
    sizes: ["One Size"],
    colors: [NAVY, BLACK, GREY],
    badge: "Popular",
    collection: "accessories",
  },
  {
    name: "College Cap",
    slug: "college-cap",
    price: 1500,
    category: "Caps",
    gender: "Unisex",
    description:
      "Adjustable navy baseball cap with the crest embroidered on the front. Worn at sports meets and on tours.",
    sizes: ["One Size"],
    colors: [NAVY, BLACK, WHITE],
    collection: "accessories",
  },

  /* ---------- Ties ---------- */
  {
    name: "College Tie",
    slug: "college-tie",
    price: 1800,
    category: "Ties",
    gender: "Boys",
    description:
      "Striped college tie in the official colours. Worn with the white shirt on formal days and at college functions.",
    sizes: ["One Size"],
    colors: [NAVY, MAROON],
    collection: "uniforms",
  },
  {
    name: "Prefect Tie",
    slug: "prefect-tie",
    price: 2200,
    category: "Ties",
    gender: "Boys",
    description:
      "The prefect tie — heavier weave with the gold prefect crest. Issued to senior and junior prefects.",
    sizes: ["One Size"],
    colors: [NAVY, GOLD],
    badge: "Official",
    collection: "uniforms",
  },

  /* ---------- Stationery ---------- */
  {
    name: "School Face Mask",
    slug: "school-face-mask",
    price: 350,
    category: "Stationery",
    gender: "Unisex",
    description:
      "Reusable cloth mask with the college crest, washable and sized for juniors and seniors.",
    sizes: ["Junior", "Senior"],
    colors: [NAVY, WHITE],
    collection: "stationery",
  },
  {
    name: "Exam Writing Paper Pack",
    slug: "exam-writing-paper-pack",
    price: 600,
    category: "Stationery",
    gender: "Unisex",
    description:
      "Pack of 50 sheets of the college-approved exam writing paper, ruled to the standard format used in all term tests.",
    sizes: ["Pack of 50"],
    colors: [WHITE],
    collection: "stationery",
  },
];

/* ------------------------------------------------------------------ */
/*  Event tickets (own section)                                        */
/* ------------------------------------------------------------------ */

type Ticket = {
  name: string;
  slug: string;
  price: number;
  compareAt?: number;
  description: string;
  eventDate: string;
  venue: string;
  tier: string;
  badge?: string;
};

const TICKETS: Ticket[] = [
  {
    name: "Big Match — St. Thomas' vs St. Anthony's",
    slug: "big-match-2026",
    price: 1500,
    compareAt: 2000,
    description:
      "The annual cricket encounter between St. Thomas' College Matale and St. Anthony's College. Full-day pass, entry from 8.30am, with access to the college grounds and stalls.",
    eventDate: "Sat 14 March 2026 · 8.30am",
    venue: "College Grounds, Matale",
    tier: "General",
    badge: "Selling fast",
  },
  {
    name: "Big Match — Pavilion Pass",
    slug: "big-match-2026-pavilion",
    price: 3500,
    description:
      "Reserved seating in the main pavilion for both days of the Big Match, with a complimentary match programme and refreshments.",
    eventDate: "Sat 14 – Sun 15 March 2026",
    venue: "Main Pavilion, College Grounds",
    tier: "Pavilion",
    badge: "Limited",
  },
  {
    name: "Annual Prize Day",
    slug: "annual-prize-day-2026",
    price: 800,
    description:
      "Entry for the annual prize day and awards ceremony. Two seats per pass — open to parents and invited guests.",
    eventDate: "Fri 27 November 2026 · 3.00pm",
    venue: "College Main Hall",
    tier: "General",
  },
  {
    name: "Inter-House Sports Meet",
    slug: "inter-house-sports-meet-2026",
    price: 600,
    description:
      "Pass for the annual inter-house athletics meet — Austin, Bede, Pius and Clement compete for the house shield.",
    eventDate: "Sat 7 February 2026 · 7.30am",
    venue: "College Grounds, Matale",
    tier: "General",
  },
  {
    name: "Carols & Candlelight Evening",
    slug: "carols-evening-2026",
    price: 1200,
    description:
      "The college choir's carols evening, held in the chapel grounds. Family pass for four.",
    eventDate: "Fri 18 December 2026 · 6.30pm",
    venue: "College Chapel Grounds",
    tier: "Family",
  },
];

const TICKET_SIZES = ["1 Ticket", "2 Tickets", "4 Tickets", "Family Pass"];

/* ------------------------------------------------------------------ */
/*  Seed                                                               */
/* ------------------------------------------------------------------ */

async function seed() {
  console.log("Clearing existing catalogue…");
  await db.delete(productVariants);
  await db.delete(reviews);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(collections);

  console.log("Seeding collections…");
  const inserted = await db
    .insert(collections)
    .values(
      COLLECTIONS.map((c) => ({
        ...c,
        image: img(c.slug),
      })),
    )
    .returning();
  const bySlug = new Map(inserted.map((c) => [c.slug, c.id]));

  console.log("Seeding categories…");
  await db.insert(categories).values(CATEGORIES);

  console.log(`Seeding ${ITEMS.length} merchandise items…`);
  const merchRows = ITEMS.map((i) => ({
    name: i.name,
    slug: i.slug,
    description: i.description,
    price: i.price,
    compareAtPrice: i.compareAt ?? null,
    category: i.category,
    gender: i.gender,
    sizes: i.sizes,
    colors: i.colors,
    images: gallery(i.slug),
    collectionId: i.collection ? bySlug.get(i.collection) ?? null : null,
    rating: "4.8",
    reviewCount: 3,
    stock: 40,
    inStock: true,
    badge: i.badge ?? null,
    offerActive: Boolean(i.compareAt),
    offerLabel: i.compareAt ? "Save now" : null,
  }));
  await db.insert(products).values(merchRows);

  console.log(`Seeding ${TICKETS.length} event tickets…`);
  const ticketRows = TICKETS.map((t) => ({
    name: t.name,
    slug: t.slug,
    description: `${t.description}\n\nEvent: ${t.eventDate}\nVenue: ${t.venue}\nTier: ${t.tier}`,
    price: t.price,
    compareAtPrice: t.compareAt ?? null,
    category: "Event Tickets",
    gender: "Unisex",
    sizes: TICKET_SIZES,
    colors: [NAVY],
    images: gallery(t.slug),
    collectionId: bySlug.get("event-tickets") ?? null,
    rating: "4.9",
    reviewCount: 2,
    stock: 200,
    inStock: true,
    badge: t.badge ?? null,
    offerActive: Boolean(t.compareAt),
    offerLabel: t.compareAt ? "Early bird" : null,
  }));
  await db.insert(products).values(ticketRows);

  console.log("Seeding a few starter reviews…");
  const all = await db.select().from(products);
  await db.insert(reviews).values(
    all.slice(0, 8).map((p, i) => ({
      productId: p.id,
      title: ["Exactly what we needed", "Good quality", "Arrived fast", "Great crest", "Fits well", "Nice finish", "Value for money", "Proud to wear it"][i],
      body: [
        "The embroidery is neat and the size was accurate. Ordered again for my younger son.",
        "Good fabric for the price. Would like more colour options.",
        "Came within two days of ordering, well packed.",
        "The crest is properly centred and stitched — much better than the old ones.",
        "Sizes run slightly generous, so order your normal size.",
        "Finish is clean and it washes well.",
        "Fair price for official college merchandise.",
        "Wearing the college colours feels different when it is made this well.",
      ][i],
      author: ["Dinesh P.", "Nimesha R.", "Sanula W.", "Ravindu K.", "Theekshana S.", "Piumi J.", "Kavindu M.", "Hashan D."][i],
      rating: 5 - (i % 2),
      verified: true,
    })),
  );

  console.log("Seeding variants…");
  let variantCount = 0;
  for (const p of all) {
    const sizes = p.sizes ?? [];
    const colors = (p.colors ?? []) as { name: string; value: string }[];
    for (const s of sizes) {
      for (const c of colors) {
        await db.insert(productVariants).values({
          productId: p.id,
          size: s,
          color: c.name,
          stock: 25,
        });
        variantCount += 1;
      }
    }
  }

  console.log(`\n✅ Done — ${ITEMS.length} merchandise items, ${TICKETS.length} event tickets, ${variantCount} variants.`);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  });
