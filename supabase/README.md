# Supabase setup

Auth and profile triggers are managed via Prisma migrations in `prisma/migrations/`.

## 1. Create project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. Copy **Project URL** and **anon key** into `.env` (see `.env.example`).

## 2. Run migrations

From the repo root:

```bash
npx prisma migrate deploy   # production
npx prisma migrate dev      # development
```

This creates tables, constraints, and auth triggers (`handle_new_user`, `prevent_profile_escalation`).

If you previously ran the legacy SQL files manually, baseline with:

```bash
npx prisma db pull
npx prisma migrate resolve --applied 20250828100000_init
```

## 3. Create admin user

1. **Authentication → Users → Add user**
2. Promote in SQL Editor (disable trigger first — DB blocks role changes otherwise):

```sql
ALTER TABLE public.profiles DISABLE TRIGGER profiles_prevent_escalation;

UPDATE public.profiles
SET role = 'admin', franchise_id = NULL, active = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@yourdomain.com');

ALTER TABLE public.profiles ENABLE TRIGGER profiles_prevent_escalation;
```

## 4. Create retailer

```sql
INSERT INTO public.franchises (name, phone, whatsapp)
VALUES ('MEDITRUST PHARMACY', '9922001188', '919922001188')
RETURNING id;
```

Create user in Auth UI, then link:

```sql
UPDATE public.profiles
SET role = 'retailer', franchise_id = '<franchise-uuid>', active = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'retailer@yourdomain.com');
```

## 5. Security

Application-layer authorization (middleware + API services) replaces Postgres RLS. DB triggers still prevent profile self-escalation.

Legacy SQL reference: `migrations/001_initial_schema.sql`, `002_security_fixes.sql` (archived).
