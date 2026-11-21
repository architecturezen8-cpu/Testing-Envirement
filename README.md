# St. Thomas' College, Matale — Online Store

The official storefront of **St. Thomas' College, Matale (Est. 1873)** —
college merchandises and event tickets for Thomians, parents and old boys.

> **Animo Et Fide** — *Courage & Faith*

Full-stack Next.js (App Router) + PostgreSQL/Drizzle e-commerce application,
adapted from the Nova storefront.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **PostgreSQL** via **Drizzle ORM** (`node-postgres` locally, `neon-serverless` on Neon/Vercel)
- **Tailwind CSS 4** + **framer-motion** + **lucide-react**
- **jose** (JWT sessions for admin + customers), **bcryptjs** (password hashing)
- **zod** validation, **Stripe** checkout (optional)

## Getting started

```bash
npm install
cp .env.example .env             # then fill in the values
npx drizzle-kit push             # create all tables
npx tsx src/db/seed.ts           # collections, products, reviews
npx tsx src/db/seed-variants.ts  # size/colour variants with per-variant stock
npm run build && npm run start
```

## Environment variables

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | Local Postgres connection string |
| `POSTGRES_URL` | Neon/Vercel Postgres connection string (enables the serverless driver) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin panel credentials |
| `JWT_SECRET` | Signs admin + customer session tokens |
| `STRIPE_SECRET_KEY` | Optional — enables the Stripe checkout route |
| `GITHUB_REPO` / `GITHUB_TOKEN` | Used by `scripts/push.sh` |

## Design system

- **Midnight theme** — charcoal canvas (`#0f141f`), dark navy accents used
  sparingly as radial/linear gradients, plus a restrained white/silver sheen
  on a few panels.
- **Featured premium accent `#F4BE38`** — reserved for primary action buttons
  only (gold gradient, dark ink label, gold halo shadow). Never used as a page
  tint, border or heading colour.
- **Clean typography** — Inter throughout; no decorative serif faces.
- **Crest** — inline SVG (`src/components/layout/school-crest.tsx`) so it stays
  crisp at any size.

## Storefront

- `/` — cinematic hero (three cross-fading college photographs), collections,
  featured pieces, *Animo Et Fide* section, community quotes
- `/shop` — filter by collection, category, price, sort, search
- `/products/[slug]` — gallery with zoom, variants, quick view, reviews, share
- Cart drawer, favourites, recently viewed
- `/checkout` → `/checkout/success`, `/track` order lookup
- `/account` signup/login, `/contact`, `/about`, `/shipping`, `/privacy`

Header navigation: **Home · Shop (Merchandises / Event Tickets) · Contact ·
Track My Order**, with the crest badge and two-line wordmark on the left.

## Admin panel

Sign in at **/admin/login**.

- Dashboard: revenue, order counts, review counts, low-stock alerts
- Products: CRUD, image galleries, sizes/colours, per-variant stock editor
- Collections & categories: CRUD
- Orders: list, detail, status updates
- Discounts: percentage / fixed codes
- Reviews: moderation queue

## Public tunnel — error 1033 fix

The sandbox preview URL is not publicly reachable, so a Cloudflare quick
tunnel exposes the app. **Error 1033** means Cloudflare can no longer resolve
the tunnel — it happens when the `cloudflared` process (or the Next.js server)
dies, for example after an environment restart.

`scripts/keepalive.sh` is a supervisor that prevents it:

```bash
bash scripts/keepalive.sh start    # launch the supervisor (detached)
bash scripts/keepalive.sh status   # app + tunnel health + current URL
bash scripts/keepalive.sh stop     # stop the supervisor and tunnel
```

Every 20 seconds it checks:

- **App** — `GET /api/health`; if it fails it (re)builds when needed and starts
  `next start` on port 3000.
- **Tunnel** — verifies the `cloudflared` process is alive **and** that
  Cloudflare's edge can actually serve through it. A process that is running
  but disconnected (the 1033 case) is killed and restarted.
- The current hostname is written to `/tmp/tunnel/PUBLIC_URL`.

`scripts/tunnel.sh` remains available for manual control (`start`, `status`,
`stop`) without supervision.

> Quick tunnels are ephemeral: **a restart issues a new hostname.** The
> supervisor restores connectivity automatically, but the URL changes. For a
> permanent hostname, register a Cloudflare named tunnel against your own
> domain instead of `--url`.

## Pushing changes

```bash
bash scripts/push.sh "what changed"   # commit all changes and push
```

Reads `GITHUB_REPO`, `GITHUB_TOKEN` and `GIT_BRANCH` from `.env`. Rebases and
retries automatically if the remote has moved.

## Notes

- Product images are remote (Pexels) URLs; `next.config.ts` allows any
  `http`/`https` hostname so admins can paste any image URL.
- Stock is tracked per (size, colour) variant and validated at checkout.
- `.env` is gitignored — tokens stay local.
