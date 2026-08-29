import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "Mediculous@2026"

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function findUserByEmail(admin, email) {
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (hit) return hit
    if (data.users.length < 200) break
    page++
  }
  return null
}

async function ensureSuperAdmin(email) {
  const user = await findUserByEmail(adminClient(), email)
  if (!user) throw new Error(`User not found: ${email}`)

  await prisma.$executeRawUnsafe(
    `SELECT public.promote_super_admin($1::uuid)`,
    user.id,
  )

  const { error } = await adminClient().auth.admin.updateUserById(user.id, {
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (error) throw error

  const rows = await prisma.$queryRawUnsafe(
    `SELECT u.email, p.active, p.role::text FROM auth.users u JOIN public.profiles p ON p.id = u.id WHERE u.email = $1`,
    email,
  )
  return { userId: user.id, profile: rows[0] }
}

function extractCookies(response) {
  const raw = response.headers.getSetCookie?.() ?? []
  return raw.map((c) => c.split(";")[0]).join("; ")
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body, cookie: extractCookies(res) }
}

async function authMe(cookie) {
  const res = await fetch(`${BASE}/api/auth/me`, { headers: { cookie } })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

async function testAccount(label, email) {
  console.log(`\n=== ${label}: ${email} ===`)
  const loginResult = await login(email, TEST_PASSWORD)
  console.log("login:", loginResult.status, JSON.stringify(loginResult.body))
  if (loginResult.status !== 200) return false

  const me = await authMe(loginResult.cookie)
  console.log("me:", me.status, JSON.stringify(me.body))
  return loginResult.status === 200 && me.status === 200
}

async function main() {
  const superEmail = "himadrihalde84@gmail.com"
  console.log("Ensuring super admin account...")
  const ensured = await ensureSuperAdmin(superEmail)
  console.log("Profile:", ensured.profile)

  const accounts = [
    ["Super admin", superEmail],
    ["Demo admin", "admin@mediculous.demo"],
    ["Retailer Andheri", "retailer.andheri@mediculous.demo"],
    ["Retailer Koramangala", "retailer.koramangala@mediculous.demo"],
    ["Retailer Pune", "retailer.pune@mediculous.demo"],
  ]

  let passed = 0
  for (const [label, email] of accounts) {
    const ok = await testAccount(label, email)
    if (ok) passed++
  }

  console.log(`\n=== RESULT: ${passed}/${accounts.length} logins passed ===`)
  process.exit(passed === accounts.length ? 0 : 1)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
