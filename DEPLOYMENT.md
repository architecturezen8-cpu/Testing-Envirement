# 🚀 Deploying Nova to Vercel

This guide covers deploying the Nova storefront to Vercel with a managed Postgres database.

---

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Nova storefront"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nova-store.git
git push -u origin main
```

## Step 2 — Import to Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** (don't add env vars yet — do that in Step 4)

## Step 3 — Create the Database (Vercel Postgres / Neon)

1. In your Vercel project, go to **Storage** tab
2. Click **Create** → **Postgres (Neon)**
3. Name it `nova-db`
4. Vercel automatically injects `POSTGRES_URL` etc. into your environment

> 💡 Alternatively, create a free database at **[neon.tech](https://neon.tech)** and copy the connection string.

## Step 4 — Set Environment Variables

In Vercel → **Settings → Environment Variables**, add:

| Key | Value | Environments |
|-----|-------|-------------|
| `ADMIN_USERNAME` | `Sasika` | All |
| `ADMIN_PASSWORD` | `your-secure-password` | All |
| `JWT_SECRET` | `any-long-random-string` | All |

> `POSTGRES_URL` is set automatically by Vercel Storage. If using external Neon, add it as `POSTGRES_URL`.

## Step 5 — Redeploy

After adding env vars, click **Redeploy** in Vercel.

## Step 6 — Create Tables & Seed Data

Once deployed, run these locally (with the production DATABASE_URL):

```bash
# Set the production connection string temporarily
export POSTGRES_URL="postgres://...your-vercel-neon-url..."

# Push schema (creates all tables)
npx drizzle-kit push

# Seed demo products, collections, reviews
npx tsx src/db/seed.ts

# Seed per-variant stock
npx tsx src/db/seed-variants.ts

# Seed default categories + discount codes
npx tsx -e "
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.POSTGRES_URL);
await sql\`INSERT INTO categories (name, slug) VALUES ('Clothing','clothing'),('Shoes','shoes') ON CONFLICT DO NOTHING\`;
await sql\`INSERT INTO discount_codes (code, description, type, value, min_order, active) VALUES ('WELCOME10','10% off','percentage','10',0,true) ON CONFLICT DO NOTHING\`;
console.log('Done!');
"
```

---

## How It Works

The app auto-detects the environment:

| Environment | Driver | Why |
|------------|--------|-----|
| **Local dev** | `pg` Pool (TCP) | Works with `localhost:5432` |
| **Vercel / Neon** | `@neondatabase/serverless` (HTTP) | Serverless-safe, no connection limits |

Detection logic in `src/db/index.ts`:
- If `POSTGRES_URL` exists or URL contains `neon.tech` → uses serverless driver
- Otherwise → uses pg Pool

---

## Troubleshooting

### "Database connection required"
→ Make sure `POSTGRES_URL` or `DATABASE_URL` is set in Vercel env vars.

### Tables don't exist after deploy
→ Run `npx drizzle-kit push` with the production connection string (Step 6).

### Build fails on Vercel
→ Check that all env vars are set. The build needs `POSTGRES_URL` for type generation.

### Images not loading
→ Product images use Pexels URLs. The `next.config.ts` allows all remote image hosts.
