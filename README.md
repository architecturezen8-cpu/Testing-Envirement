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

### 1. Get a Postgres database

The app needs a Postgres connection string. Two easy options:

**Neon** (free) — [neon.tech](https://neon.tech) → create a project → copy the
connection string.

**Supabase** (free) — [supabase.com](https://supabase.com) → Project Settings →
Database → Connection string → **URI**.

Supabase notes:

- The direct host (`db.<ref>.supabase.co`) is **IPv6-only**. On networks
  without IPv6 use the **pooler** host instead:
  `aws-0-<region>.pooler.supabase.com:5432`.
- The pooler username carries the tenant id: `postgres.<project-ref>`.
- URL-encode any special characters in the password — `@` becomes `%40`.

### 2. Configure the environment

```bash
cp .env.example .env      # then fill in the values
```

### 3. Create the tables

```bash
npx drizzle-kit push      # creates all 10 tables from src/db/schema.ts
```

### 4. Seed demo data

```bash
npx tsx src/db/seed.ts            # 5 collections, 17 products, ~72 reviews
npx tsx src/db/seed-variants.ts   # 204 size/colour variants with per-variant stock
```

Then give the collections a cover image (the seed script leaves them null):

```sql
update collections set image = (select images[1] from products where id = 2)  where slug = 'new-arrivals';
update collections set image = (select images[1] from products where id = 9)  where slug = 'essentials';
update collections set image = (select images[1] from products where id = 4)  where slug = 'tailoring';
update collections set image = (select images[1] from products where id = 15) where slug = 'footwear';
update collections set image = (select images[1] from products where id = 11) where slug = 'outerwear';
```

(Add the two category rows the seed script skips: `Clothing`, `Shoes`.)

### 5. Run it

```bash
npm run build && npm run start    # or: npm run dev
```

Sign into the admin panel at `/admin/login` with `ADMIN_USERNAME` /
`ADMIN_PASSWORD`.

> **Note:** the database is not part of the repository. Cloning the repo gives
> you the schema and seed scripts, not the data — each environment has its own
> database and its own data.

## Environment variables

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (local, Neon or Supabase) |
| `POSTGRES_URL` | Neon/Vercel Postgres string — switches the driver to `neon-serverless` |
| `STRIPE_SECRET_KEY` | Optional — enables the Stripe checkout route |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin panel credentials |
| `JWT_SECRET` | Signs admin + customer session tokens |
| `STRIPE_SECRET_KEY` | Optional — enables the Stripe checkout route |
| `GITHUB_REPO` / `GITHUB_TOKEN` | Used by `scripts/push.sh` |

## Sending ticket emails (SMTP)

Every event-ticket purchase emails the buyer a copy of their pass with the QR
code inline. Delivery is **off by default** — orders still succeed and tickets
are still issued, but no email is sent until you add credentials.

### Gmail (easiest)

1. Turn on **2-Step Verification** at <https://myaccount.google.com/security>.
2. Open <https://myaccount.google.com/apppasswords>.
3. Enter an app name (e.g. `Nova Store`) and click **Create**.
4. Google shows a 16-character password like `abcd efgh ijkl mnop`.
5. Fill in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-address@gmail.com
SMTP_PASS=abcdefghijklmnop
```

> The password must be the **App Password**, not the account password, and
> without the spaces. Restart the server after editing `.env`.

### Test it

```bash
npx tsx scripts/test-email.mjs your-email@gmail.com
```

Prints whether the connection, auth and delivery all work, and explains the
most common failures (wrong App Password, blocked port).

### Other providers

Any SMTP server works — set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS`, `SMTP_FROM`. Transactional services such as
[Resend](https://resend.com) (SMTP `smtp.resend.com:465`) or
[SendGrid](https://sendgrid.com) (`smtp.sendgrid.net:587`) are more reliable in
production than a personal Gmail account, which has a ~500 messages/day limit.

### Where the values live

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | `465` for implicit TLS, `587` for STARTTLS |
| `SMTP_USER` | Username (your Gmail address) |
| `SMTP_PASS` | App password |
| `SMTP_FROM` | From-header shown to the buyer |

## Local setup troubleshooting

### Admin "Event Tickets" section missing

The section lives at `/admin/tickets` and appears in the admin sidebar. If it
is not there:

1. **Pull the latest code** — the section was added after the first release:

   ```bash
   git pull origin main
   ```

2. **Clear the Next.js cache** — a stale `.next` folder keeps serving the old
   client bundle, which is what draws the sidebar:

   ```bash
   rmdir /s /q .next        # Windows
   rm -rf .next             # macOS / Linux
   npm run build
   npm run start
   ```

3. **Hard-refresh the browser** (`Ctrl+Shift+R`) — the admin sidebar is drawn
   by JavaScript, so an old cached bundle will not show the new link.

4. Confirm the file exists in your clone:

   ```
   src/app/admin/(dashboard)/tickets/page.tsx
   ```

If it is there and the build succeeds, `/admin/tickets` will work. Note the
admin section **is separate** from "Products" — tickets are created under
**Event Tickets** in the sidebar, with the event name, date, venue and tier
fields.

### Why your local catalogue can differ from the preview

Code comes from git; **data lives in the database**. If `DATABASE_URL` points
at a local Postgres, you will see whatever that database holds. Point it at
the same Supabase database used by the preview and both environments show the
same catalogue. After pulling code that changed the seed, re-run:

```bash
npx tsx src/db/seed-school.ts
```

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
