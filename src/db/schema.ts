import {
  integer,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  sortOrder: integer("sort_order").default(0),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  compareAtPrice: integer("compare_at_price"),
  category: text("category").notNull(),
  gender: text("gender").notNull(),
  sizes: text("sizes").array().notNull().default([]),
  colors: jsonb("colors").$type<{ name: string; value: string }[]>().default([]),
  images: text("images").array().notNull().default([]),
  collectionId: integer("collection_id").references(() => collections.id),
  rating: numeric("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  stock: integer("stock").default(0).notNull(),
  inStock: boolean("in_stock").default(true),
  badge: text("badge"),
  offerActive: boolean("offer_active").default(false).notNull(),
  offerLabel: text("offer_label"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// Per-variant stock: tracks quantity for each (size, color) combination
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  size: text("size").notNull(),
  color: text("color").notNull(),
  stock: integer("stock").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  type: text("type").default("percentage").notNull(), // percentage | fixed
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  minOrder: integer("min_order").default(0).notNull(),
  usageLimit: integer("usage_limit"), // null = unlimited
  usageCount: integer("usage_count").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  author: text("author").notNull(),
  rating: integer("rating").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  helpful: integer("helpful").default(0),
  userId: integer("user_id").references(() => users.id),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  postalCode: text("postal_code").notNull(),
  phone: text("phone"),
  total: integer("total").notNull(),
  status: text("status").default("pending"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "cascade",
  }),
  orderNumber: text("order_number"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  size: text("size"),
  color: text("color"),
  quantity: integer("quantity").notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  collection: one(collections, {
    fields: [products.collectionId],
    references: [collections.id],
  }),
  reviews: many(reviews),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  products: many(products),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [notifications.orderId],
    references: [orders.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export type Collection = typeof collections.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type User = typeof users.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Category = typeof categories.$inferSelect;

/* =====================================================================
   HOME PAGE SETUP (admin-controlled)
   One row (id = 1) holds everything the storefront home page renders.
   Keeping it as a single JSONB-backed row means the admin can rearrange
   sections without new migrations, while product/collection references
   stay as IDs so the live data always comes from the catalogue.
   ===================================================================== */

export const homepageConfig = pgTable("homepage_config", {
  id: integer("id").primaryKey().default(1),

  /** Hero carousel slides, in display order. */
  heroSlides: jsonb("hero_slides")
    .$type<{ imageUrl: string; alt: string; eyebrow?: string; title?: string; subtitle?: string }[]>()
    .notNull()
    .default([]),

  /** How long each hero slide stays on screen. */
  heroIntervalMs: integer("hero_interval_ms").notNull().default(6500),

  /** "Everything a Thomian needs" cards — existing collections and/or custom links. */
  collectionCards: jsonb("collection_cards")
    .$type<{
      label: string;
      href: string;
      imageUrl?: string | null;
      collectionId?: number | null;
      description?: string | null;
    }[]>()
    .notNull()
    .default([]),

  /** "Most popular" — product IDs in display order (resolved from the catalogue). */
  featuredProductIds: jsonb("featured_product_ids").$type<number[]>().notNull().default([]),

  /** "Our community" — reviews pulled in as testimonials, or written by hand. */
  testimonials: jsonb("testimonials")
    .$type<{ quote: string; author: string; role: string; sourceReviewId?: number | null }[]>()
    .notNull()
    .default([]),

  /** Header navigation, fully editable. */
  navLinks: jsonb("nav_links")
    .$type<{ label: string; href: string; children?: { label: string; href: string }[] }[]>()
    .notNull()
    .default([]),

  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export type HomepageConfig = typeof homepageConfig.$inferSelect;

/* =====================================================================
   ISSUED TICKETS — one row per ticket bought, each with a unique QR.
   ===================================================================== */

/**
 * Reference thumbnail: the photo shoppers see in the shop/tickets grid, kept
 * separate from the ticket artwork (which is the printed design the QR is
 * drawn onto).
 */
export const ticketThumbnails = pgTable("ticket_thumbnails", {
  productId: integer("product_id")
    .primaryKey()
    .references(() => products.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export type TicketThumbnail = typeof ticketThumbnails.$inferSelect;

export const issuedTickets = pgTable("issued_tickets", {
  id: serial("id").primaryKey(),

  /** Human-readable reference, e.g. "SCTC-AB12CD". */
  ticketCode: text("ticket_code").notNull().unique(),

  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  orderItemId: integer("order_item_id").references(() => orderItems.id, {
    onDelete: "set null",
  }),

  productId: integer("product_id").references(() => products.id, {
    onDelete: "set null",
  }),

  /** Who the ticket is for (from the shipping details at checkout). */
  attendeeName: text("attendee_name").notNull(),
  email: text("email").notNull(),

  /** Ticket face value / the tier line shown on the pass. */
  eventName: text("event_name").notNull(),
  eventDate: text("event_date"),
  venue: text("venue"),
  tier: text("tier"),

  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull().default(0),

  /** "valid" | "used" | "cancelled" */
  status: text("status").notNull().default("valid"),

  /** Set the first time the QR is scanned at the gate. */
  scannedAt: timestamp("scanned_at", { mode: "date" }),

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export type IssuedTicket = typeof issuedTickets.$inferSelect;
