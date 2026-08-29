# Mediculoes

B2B pharmaceutical wholesale platform — Next.js fullstack with Prisma + Supabase.

## Stack

- **Next.js 15** (App Router) — UI + API routes
- **Prisma** — ORM and migrations against Supabase Postgres
- **Supabase Auth** — login/session via `@supabase/ssr` cookies
- **Tailwind CSS 4** — monochrome Mediculoes design system

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase Dashboard → Settings → API
- `DATABASE_URL` — Supabase pooled connection (port 6543)
- `DIRECT_URL` — Supabase direct connection (port 5432) for migrations

### 3. Database

If you have a **fresh** Supabase project:

```bash
npx prisma migrate dev --name init
```

If you already ran the SQL files in `supabase/migrations/` manually, baseline with:

```bash
npx prisma db pull
npx prisma migrate dev --name baseline
```

### 4. Create users

1. **Authentication → Users → Add user** in Supabase
2. Promote admin in SQL Editor:

```sql
ALTER TABLE public.profiles DISABLE TRIGGER profiles_prevent_escalation;

UPDATE public.profiles
SET role = 'admin', franchise_id = NULL, active = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@yourdomain.com');

ALTER TABLE public.profiles ENABLE TRIGGER profiles_prevent_escalation;
```

3. Link retailer to franchise (see `supabase/README.md`)

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000

## Routes

| Path | Role | Purpose |
|------|------|---------|
| `/` | Public | Landing |
| `/login` | Public | Sign in |
| `/app/*` | Admin | Console |
| `/shop/*` | Retailer | Catalog & orders |
| `/inventory` | Retailer | On-hand stock |
| `/api/*` | Authenticated | REST API |

## Security

- Middleware enforces role-based route access
- API handlers validate session + profile on every request
- Service layer scopes retailer data by `franchiseId` from profile (never from request body)
- Catalog endpoint never exposes `buyingPrice` or `qtyReserved`
- Order mutations use Prisma transactions with stock locking

## Production

```bash
npx prisma migrate deploy
npm run build
npm start
```
