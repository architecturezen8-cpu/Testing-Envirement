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
the tunnel — it happens when `cloudflared` (or the server) dies.

### How it stays up

`src/instrumentation.ts` + `src/tunnel-supervisor.ts` supervise the tunnel
**from inside the Next.js server process**. External background jobs get
reaped by the sandbox, but the platform keeps the app server alive, so the
tunnel now lives as long as the app does.

Every 15 seconds the supervisor:

1. Checks `/api/health` on the app. If the app is down it leaves the tunnel
   alone (the platform restarts the app, and recycling then would needlessly
   rotate the hostname).
2. If no tunnel is running, spawns one (`--protocol http2`).
3. If a tunnel is running, verifies **Cloudflare's edge can actually serve
   through it**. A process that is up but disconnected — the 1033 case — is
   recycled.
4. Kills any stale `cloudflared` left over from a previous server instance, so
   processes never accumulate.

The current hostname is written to `/tmp/tunnel/PUBLIC_URL`. Set
`NOVA_TUNNEL_DISABLE=1` to opt out.

Verified behaviour: killing `cloudflared` produced
`recycling tunnel → tunnel up: <new-hostname>` within one check cycle, with
exactly one process afterwards.

### Manual control

```bash
bash scripts/keepalive.sh status   # app + tunnel health + current URL
bash scripts/keepalive.sh stop     # stop the external supervisor + tunnel
bash scripts/boot-tunnel.sh        # start the external supervisor (detached)
bash scripts/tunnel.sh start       # one-off tunnel without supervision
```

The scripts are a fallback; the in-process supervisor is the primary mechanism.

> Quick tunnels are ephemeral: **a new hostname is issued each time the tunnel
> is recycled.** For a permanent hostname, register a Cloudflare named tunnel
> against your own domain instead of `--url`.

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
