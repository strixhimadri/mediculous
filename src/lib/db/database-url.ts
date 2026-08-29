const ALLOWED_PARAMS = new Set([
  "schema",
  "connection_limit",
  "pool_timeout",
  "socket_timeout",
  "connect_timeout",
  "sslmode",
  "sslcert",
  "sslkey",
  "sslrootcert",
  "pgbouncer",
])

function isPooledUrl(url: string) {
  return url.includes(":6543/") || url.includes("pooler.supabase.com")
}

/** Strip quotes/whitespace and unsupported Prisma query params (common Vercel copy-paste issues). */
export function sanitizeDatabaseUrl(raw: string | undefined, { pooled = false }: { pooled?: boolean } = {}) {
  if (!raw) return raw

  let url = raw.trim().replace(/^["']|["']$/g, "")
  if (!url) return undefined

  const qIndex = url.indexOf("?")
  if (qIndex === -1) {
    if (pooled && isPooledUrl(url)) {
      return `${url}?pgbouncer=true&connection_limit=1`
    }
    return url
  }

  const base = url.slice(0, qIndex)
  const incoming = new URLSearchParams(url.slice(qIndex + 1))
  const params = new URLSearchParams()

  for (const [key, value] of incoming.entries()) {
    if (ALLOWED_PARAMS.has(key)) params.set(key, value)
  }

  if ((pooled || isPooledUrl(base)) && !params.has("pgbouncer")) {
    params.set("pgbouncer", "true")
  }
  if ((pooled || isPooledUrl(base)) && !params.has("connection_limit")) {
    params.set("connection_limit", "1")
  }

  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

export function prepareDatabaseEnv() {
  if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = sanitizeDatabaseUrl(process.env.DATABASE_URL, { pooled: true })
  }
  if (process.env.DIRECT_URL) {
    process.env.DIRECT_URL = sanitizeDatabaseUrl(process.env.DIRECT_URL)
  }
}
