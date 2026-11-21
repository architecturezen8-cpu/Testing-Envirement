-- ============================================================
-- NOVA STOREFRONT — Full Database Setup & Seed Data
-- ============================================================
-- Paste this ENTIRE file into Vercel Neon SQL Editor
-- (or any PostgreSQL client like DBeaver, pgAdmin, psql)
--
-- This creates ALL tables AND seeds demo data (products,
-- collections, categories, discount codes, reviews, variants).
-- ============================================================

-- Clear existing data (safe — order respects FK constraints)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS discount_codes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. CREATE TABLES
-- ============================================================

CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  sort_order INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  compare_at_price INTEGER,
  category TEXT NOT NULL,
  gender TEXT NOT NULL,
  sizes TEXT[] NOT NULL DEFAULT '{}',
  colors JSONB DEFAULT '[]',
  images TEXT[] NOT NULL DEFAULT '{}',
  collection_id INTEGER REFERENCES collections(id),
  rating NUMERIC(2,1) DEFAULT '0',
  review_count INTEGER DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  in_stock BOOLEAN DEFAULT true,
  badge TEXT,
  offer_active BOOLEAN NOT NULL DEFAULT false,
  offer_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE discount_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'percentage',
  value NUMERIC(10,2) NOT NULL,
  min_order INTEGER NOT NULL DEFAULT 0,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  phone TEXT,
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  order_number TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  author TEXT NOT NULL,
  rating INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  helpful INTEGER DEFAULT 0,
  user_id INTEGER REFERENCES users(id),
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. SEED: COLLECTIONS
-- ============================================================

INSERT INTO collections (name, slug, description, sort_order, featured) VALUES
('New Arrivals', 'new-arrivals', 'The latest arrivals from Nova studios.', 1, true),
('Essentials', 'essentials', 'Timeless pieces designed for everyday elegance.', 2, true),
('Footwear', 'footwear', 'Sneakers, loafers and boots crafted for the global city.', 4, true),
('Tailoring', 'tailoring', 'Precision-cut silhouettes and modern suiting.', 3, false);

-- ============================================================
-- 3. SEED: CATEGORIES
-- ============================================================

INSERT INTO categories (name, slug, sort_order) VALUES
('Clothing', 'clothing', 1),
('Shoes', 'shoes', 2)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. SEED: DISCOUNT CODES
-- ============================================================

INSERT INTO discount_codes (code, description, type, value, min_order, active) VALUES
('WELCOME10', '10% off your first order', 'percentage', '10', 0, true),
('NOVA20', '20% off — limited time', 'percentage', '20', 10000, true),
('FREESHIP', '$15 off', 'fixed', '15', 0, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. SEED: PRODUCTS
-- ============================================================
-- NOTE: images use Pexels URLs. Update with your own if needed.

INSERT INTO products (name, slug, description, price, compare_at_price, category, gender, sizes, colors, images, collection_id, rating, review_count, stock, in_stock, badge, offer_active, offer_label) VALUES

('Wool Overcoat', 'wool-overcoat', 'A full-length overcoat in double-faced wool. Unlined for lightness, with an internal pocket for travel.', 59000, 9000, 'Clothing', 'Men',
  ARRAY['36','38','40','42','44'],
  '[{"name":"Camel","value":"#c29b61"},{"name":"Charcoal","value":"#374151"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/1643025/pexels-photo-1643025.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        'https://images.pexels.com/photos/19454627/pexels-photo-19454627.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600'],
  4, '4.8', 8, 1, true, NULL, false, NULL),

('Leather Biker Jacket', 'leather-biker-jacket', 'Italian lamb nappa leather biker jacket with asymmetric zip and quilted shoulder panels.', 68000, NULL, 'Clothing', 'Men',
  ARRAY['S','M','L','XL'],
  '[{"name":"Black","value":"#111111"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/18038131/pexels-photo-18038131.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        'https://images.pexels.com/photos/8422512/pexels-photo-8422512.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600'],
  1, '4.7', 6, 29, true, 'Best Seller', true, '-20% OFF'),

('Belted Trench Coat', 'belted-trench-coat', 'A timeless belted trench in water-resistant cotton gabardine with storm flap and removable belt.', 45000, NULL, 'Clothing', 'Women',
  ARRAY['XS','S','M','L'],
  '[{"name":"Beige","value":"#d4c5b5"},{"name":"Navy","value":"#1e293b"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/7237200/pexels-photo-7237200.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        'https://images.pexels.com/photos/7312540/pexels-photo-7312540.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600'],
  2, '4.6', 4, 28, true, NULL, false, NULL),

('Structured Wool Blazer', 'structured-wool-blazer', 'A sharp double-breasted blazer in Italian wool, fully canvassed with horn buttons.', 52000, NULL, 'Clothing', 'Women',
  ARRAY['XS','S','M','L','XL'],
  '[{"name":"Black","value":"#111111"},{"name":"Cream","value":"#f5f5dc"},{"name":"Sage","value":"#8fa395"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/33401555/pexels-photo-33401555.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        'https://images.pexels.com/photos/33401556/pexels-photo-33401556.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600'],
  4, '4.9', 5, 29, true, 'New', false, NULL),

('Hourglass Wool Blazer', 'hourglass-wool-blazer', 'A cinched-waist wool blazer with a feminine hourglass silhouette and darted back.', 48000, NULL, 'Clothing', 'Women',
  ARRAY['XS','S','M','L'],
  '[{"name":"Black","value":"#111111"},{"name":"Burgundy","value":"#722f37"},{"name":"Camel","value":"#c29b61"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/7871177/pexels-photo-7871177.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800'],
  4, '4.5', 3, 41, true, NULL, false, NULL),

('Silk Band-Collar Blouse', 'silk-band-collar-blouse', 'A fluid silk blouse with a modern band collar and mother-of-pearl buttons.', 18000, NULL, 'Clothing', 'Women',
  ARRAY['XS','S','M','L'],
  '[{"name":"Cream","value":"#f5f5dc"},{"name":"Black","value":"#111111"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/9031629/pexels-photo-9031629.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        'https://images.pexels.com/photos/7624388/pexels-photo-7624388.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600'],
  2, '4.7', 5, 28, true, NULL, false, NULL),

('Relaxed Silk Shirt', 'relaxed-silk-shirt', 'An easy-fitting silk shirt with a soft point collar and natural shell buttons.', 16000, NULL, 'Clothing', 'Men',
  ARRAY['S','M','L','XL'],
  '[{"name":"Sage","value":"#8fa395"},{"name":"Cream","value":"#f5f5dc"},{"name":"Black","value":"#111111"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/19189082/pexels-photo-19189082.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        'https://images.pexels.com/photos/7705920/pexels-photo-7705920.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600'],
  1, '4.6', 4, 34, true, NULL, false, NULL),

('Nova Essential Tee', 'nova-essential-tee', 'A heavyweight organic cotton tee in a clean, slightly boxy fit. Pre-shrunk and built to last.', 6500, NULL, 'Clothing', 'Unisex',
  ARRAY['XS','S','M','L','XL'],
  '[{"name":"White","value":"#f8f8f8"},{"name":"Black","value":"#111111"},{"name":"Sage","value":"#8fa395"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/30710033/pexels-photo-30710033.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        'https://images.pexels.com/photos/12095148/pexels-photo-12095148.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600'],
  2, '4.8', 7, 12, true, 'Best Seller', true, 'SPECIAL OFFER'),

('Cashmere Crew Knit', 'cashmere-crew-knit', 'Grade-A Mongolian cashmere in a versatile mid-weight gauge with ribbed trims.', 17000, NULL, 'Clothing', 'Women',
  ARRAY['XS','S','M','L'],
  '[{"name":"Cream","value":"#f5f5dc"},{"name":"Camel","value":"#c29b61"},{"name":"Charcoal","value":"#374151"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/8801067/pexels-photo-8801067.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        'https://images.pexels.com/photos/5789010/pexels-photo-5789010.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600'],
  2, '4.9', 6, 3, true, 'New', true, 'SPECIAL OFFER'),

('Merino Roll-Neck', 'merino-roll-neck', 'Extra-fine merino wool roll-neck that layers seamlessly under tailoring.', 15000, NULL, 'Clothing', 'Men',
  ARRAY['S','M','L','XL','XXL'],
  '[{"name":"Cream","value":"#f5f5dc"},{"name":"Charcoal","value":"#374151"},{"name":"Burgundy","value":"#722f37"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/3596953/pexels-photo-3596953.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        'https://images.pexels.com/photos/34685799/pexels-photo-34685799.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600'],
  2, '4.7', 4, 41, true, NULL, false, NULL),

('Pleated Wide-Leg Trousers', 'pleated-wide-leg-trousers', 'Tailored wide-leg trousers with pressed pleats in a fluid wool blend.', 23000, NULL, 'Clothing', 'Women',
  ARRAY['XS','S','M','L','XL'],
  '[{"name":"Black","value":"#111111"},{"name":"Cream","value":"#f5f5dc"},{"name":"Sage","value":"#8fa395"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/7444977/pexels-photo-7444977.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        'https://images.pexels.com/photos/6764124/pexels-photo-6764124.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600'],
  4, '4.5', 3, 35, true, NULL, false, NULL),

('Tailored Pleat Trousers', 'tailored-pleat-trousers', 'A modern pleated trouser with a tapered leg and clean break.', 20000, NULL, 'Clothing', 'Men',
  ARRAY['S','M','L','XL','XXL'],
  '[{"name":"Charcoal","value":"#374151"},{"name":"Black","value":"#111111"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/17139455/pexels-photo-17139455.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800'],
  4, '4.4', 2, 9, true, NULL, false, NULL),

('Nova Minimalist Sneaker', 'nova-minimalist-sneaker', 'A clean court sneaker in full-grain Italian leather on a cushioned Margom sole.', 22000, NULL, 'Shoes', 'Unisex',
  ARRAY['39','40','41','42','43','44'],
  '[{"name":"White","value":"#f8f8f8"},{"name":"Black","value":"#111111"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/12628400/pexels-photo-12628400.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800',
        'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600'],
  3, '4.9', 8, 2, true, 'Best Seller', true, '-20% OFF'),

('Court Trainer', 'court-trainer', 'Minimalist leather trainer in soft calf leather with a rubber cup sole.', 19000, NULL, 'Shoes', 'Men',
  ARRAY['40','41','42','43','44'],
  '[{"name":"White","value":"#f8f8f8"},{"name":"Black","value":"#111111"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800'],
  3, '4.3', 2, 0, false, NULL, false, NULL),

('Leather Penny Loafer', 'leather-penny-loafer', 'Hand-stitched penny loafer in soft calf leather with a leather sole.', 28000, NULL, 'Shoes', 'Men',
  ARRAY['40','41','42','43','44','45'],
  '[{"name":"Black","value":"#111111"},{"name":"Camel","value":"#c29b61"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/8069881/pexels-photo-8069881.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800'],
  3, '4.8', 5, 19, true, NULL, false, NULL),

('Suede Tassel Loafer', 'suede-tassel-loafer', 'A refined tassel loafer in rich Italian suede with a Blake-stitched sole.', 26000, NULL, 'Shoes', 'Men',
  ARRAY['40','41','42','43','44','45'],
  '[{"name":"Camel","value":"#c29b61"},{"name":"Black","value":"#111111"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/4637874/pexels-photo-4637874.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800'],
  3, '4.6', 3, 9, true, NULL, false, NULL),

('Leather Ankle Boot', 'leather-ankle-boot', 'A sleek Chelsea-inspired ankle boot in calf leather with elastic gore panels.', 32000, NULL, 'Shoes', 'Women',
  ARRAY['36','37','38','39','40','41'],
  '[{"name":"Black","value":"#111111"},{"name":"Camel","value":"#c29b61"}]'::jsonb,
  ARRAY['https://images.pexels.com/photos/6316211/pexels-photo-6316211.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800'],
  3, '4.7', 4, 43, true, NULL, false, NULL);

-- ============================================================
-- 6. SEED: PRODUCT VARIANTS (size + color stock)
-- ============================================================
-- Auto-generates a variant row for every product × size × color combo.
-- Stock is distributed evenly across variants.

INSERT INTO product_variants (product_id, size, color, stock)
SELECT
  p.id,
  s.size,
  c.color_name,
  GREATEST(0, FLOOR(p.stock / GREATEST(array_length(p.sizes, 1) * color_count, 1)))::int
    + CASE WHEN (s.ord + c.cord) % 3 = 0 THEN 2 ELSE 0 END
FROM products p
CROSS JOIN LATERAL (
  SELECT size, ord - 1 AS ord FROM unnest(p.sizes) WITH ORDINALITY AS t(size, ord)
) s
CROSS JOIN LATERAL (
  SELECT elem->>'name' AS color_name, row_number() OVER () - 1 AS cord, count(*) OVER () AS color_count
  FROM jsonb_array_elements(p.colors) AS elem
) AS c
WHERE p.in_stock = true;

-- ============================================================
-- 7. SEED: REVIEWS
-- ============================================================

INSERT INTO reviews (product_id, author, rating, title, body, helpful, verified) VALUES
(1, 'Eleanor V.', 5, 'Quietly perfect', 'The fit is impeccable and the fabric feels luxurious. It has quickly become the most reached-for piece in my wardrobe.', 12, true),
(1, 'Marcus T.', 4, 'Excellent, runs slightly large', 'Quality is outstanding and it looks even better in person. I would suggest sizing down for a closer fit.', 8, true),
(1, 'Sofia R.', 5, 'A modern essential', 'Versatile, comfortable and elegant. I have worn it from the office straight into the weekend.', 5, true),
(2, 'James O.', 5, 'My new favourite jacket', 'The leather is butter-soft and the fit is spot on. Worth every penny.', 15, true),
(2, 'Aïcha B.', 5, 'Outstanding quality', 'You can feel the craftsmanship. Stitching, weight, finish — all first rate.', 7, true),
(2, 'Liam P.', 4, 'Lovely piece', 'Great craftsmanship and a timeless silhouette. Wish there were a few more colour options.', 3, true),
(3, 'Nora K.', 5, 'Worth every cent', 'Beautifully made with real attention to detail. Shipping was fast and the packaging felt considered.', 9, true),
(3, 'David W.', 4, 'Beautiful but delicate', 'Gorgeous design and colour. Just be gentle when washing — the fabric is finer than it looks.', 2, true),
(4, 'Camille D.', 5, 'Effortlessly elegant', 'Dresses up or down with ease. The neutral tone goes with absolutely everything I own.', 6, true),
(4, 'Theo M.', 5, 'Exceeded expectations', 'The material is heavier and more premium than I anticipated. Feels like it will last for years.', 4, true),
(6, 'Priya N.', 5, 'Incredibly soft', 'The silk feels amazing against the skin. Perfect for layering or wearing on its own.', 8, true),
(6, 'Hugo L.', 4, 'Great fit', 'True to size and the band collar looks sharp. Wearing it to the office constantly.', 3, true),
(8, 'Ines G.', 5, 'Best basic tee', 'Heavy weight, holds its shape, doesn''t go see-through. Exactly what I wanted.', 20, true),
(8, 'Oliver F.', 4, 'Solid tee', 'Good weight cotton and a nice fit. The sage colour is lovely in person.', 5, true),
(9, 'Eleanor V.', 5, 'Pure luxury', 'The softest cashmere I own. Worth the investment.', 11, true),
(9, 'Yuki S.', 5, 'Perfect weight', 'Not too thick, not too thin. Layers beautifully under blazers.', 4, true),
(13, 'Sofia R.', 5, 'My everyday shoe', 'Clean, comfortable, and goes with everything. The leather only gets better with wear.', 18, true),
(13, 'James O.', 5, 'Impeccable quality', 'Margom sole is the gold standard. These feel like they will last a decade.', 9, true),
(15, 'David W.', 5, 'Beautifully made', 'The hand-stitching is perfect. Broke in within a day.', 6, true),
(17, 'Nora K.', 5, 'Elegant and comfortable', 'The suede is gorgeous and the elastic gore makes them easy to slip on.', 5, true);

-- ============================================================
-- DONE! ✅
-- ============================================================
-- Your Nova storefront database is ready.
-- All 17 products, 4 collections, 2 categories, 3 discount codes,
-- 20 reviews, and per-variant stock are seeded.
--
-- Next steps:
-- 1. Set these env vars in Vercel (Settings → Environment Variables):
--    ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET
-- 2. Redeploy your app
-- 3. Visit your site!
-- ============================================================
