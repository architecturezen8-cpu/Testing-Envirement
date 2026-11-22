# St. Thomas' College Matale — Admin Backend

A **separate, standalone admin backend service** for the storefront. The store
frontend (`src/`, the Next.js app) stays exactly as it is — this service runs
alongside it as the admin side that powers the admin panel: dashboards,
catalogue management, orders, tickets, stock and more.

> The frontend and this backend share the **same Postgres database** (same
> tables, same Drizzle schema in `src/db/schema.ts`). The frontend keeps its own
> admin routes; this service is the dedicated admin-ops API.

## Stack

- Node.js 20+ · Express 4 · TypeScript
- PostgreSQL via Drizzle ORM (`node-postgres`)
- JWT (`jose`, HS256) for admin sessions
- `zod` for config + request validation

## Quick start

```bash
cd admin-backend
cp .env.example .env      # fill in DATABASE_URL, ADMIN_USERNAME/PASSWORD, JWT_SECRET
npm install
npm run dev               # dev server with hot reload (tsx watch)
```

Production build:

```bash
npm run build && npm run start:built
```

## Environment

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `PORT` | no | `3001` | Port to listen on |
| `DATABASE_URL` | **yes** | — | PostgreSQL connection string |
| `ADMIN_USERNAME` | **yes** | — | Admin login username |
| `ADMIN_PASSWORD` | **yes** | — | Admin login password |
| `JWT_SECRET` | **yes** (min 16) | — | HMAC secret for session tokens |
| `TOKEN_TTL_SECONDS` | no | `28800` (8h) | Session lifetime |

## Auth

All `/api/*` routes (except `/api/auth/login`) require a Bearer token:

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"<ADMIN_USERNAME>","password":"<ADMIN_PASSWORD>"}' \
  | jq -r .token)

curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/dashboard
```

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness probe (no auth) |
| POST | `/api/auth/login` | Exchange credentials for a JWT (public) |
| GET | `/api/auth/me` | Current admin session |
| GET | `/api/dashboard` | Product/order/revenue/review/collection counts, recent orders, low-stock alerts |
| GET | `/api/products` | List all products |
| POST | `/api/products` | Create product (+ per-variant rows) |
| GET | `/api/products/:id` | Fetch one product |
| PATCH | `/api/products/:id` | Update one product |
| DELETE | `/api/products/:id` | Delete one product |
| GET | `/api/collections` | List collections |
| GET | `/api/categories` | List categories |
| GET | `/api/discounts` | List discount codes |
| GET | `/api/reviews` | List recent reviews (`?limit=`) |
| GET | `/api/orders` | List recent orders (`?limit=`) |
| PATCH | `/api/orders/:id/status` | Update order status |
| GET | `/api/stock/overview` | Low-stock products + variant totals |
| GET | `/api/tickets` | List recent tickets (`?limit=`) |
| PATCH | `/api/tickets/:id/status` | Update ticket status (`valid` \| `used` \| `cancelled`) |

## Notes

- **Credentials** live in `.env` (git-ignored) — never committed. The older
  `drizzle.config.json` with a hard-coded database URL has been replaced by
  `drizzle.config.ts`, which reads `DATABASE_URL` from the environment.
- **Schema**: `src/db/schema.ts` mirrors the store frontend's schema. Keep the
  two in sync when the database changes.
- **Status roles** used here match the store: order statuses
  `pending | confirmed | processing | shipped | delivered | cancelled`, ticket
  statuses `valid | used | cancelled`.
- The service listens on **all interfaces** (`0.0.0.0`) by default — bind it
  behind a reverse proxy / firewall in production.
