import { PrismaClient } from "@prisma/client"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const prisma = new PrismaClient()

function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env")
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function getKeepEmails(): Set<string> {
  const raw = process.env.DEVELOPER_EMAIL_ALLOWLIST ?? ""
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

async function listAllAuthUsers(admin: SupabaseClient) {
  const users: { id: string; email: string | undefined }[] = []
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    users.push(...data.users.map((u) => ({ id: u.id, email: u.email })))
    if (data.users.length < 200) break
    page++
  }
  return users
}

async function wipeDatabase() {
  const [orderLines, retailerInventory, orders, profiles, franchises, stock, audit] =
    await prisma.$transaction([
      prisma.orderLine.deleteMany(),
      prisma.retailerInventory.deleteMany(),
      prisma.order.deleteMany(),
      prisma.profile.deleteMany(),
      prisma.franchise.deleteMany(),
      prisma.wholesalerStock.deleteMany(),
      prisma.auditLog.deleteMany(),
    ])

  return { orderLines, retailerInventory, orders, profiles, franchises, stock, audit }
}

async function wipeAuthUsers(admin: SupabaseClient, keepEmails: Set<string>) {
  const users = await listAllAuthUsers(admin)
  let deleted = 0
  let kept = 0

  for (const user of users) {
    const email = user.email?.toLowerCase() ?? ""
    if (keepEmails.has(email)) {
      kept++
      continue
    }
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw new Error(`Failed to delete ${email || user.id}: ${error.message}`)
    deleted++
  }

  return { deleted, kept, keptEmails: [...keepEmails] }
}

async function restoreDeveloperProfiles(admin: SupabaseClient, keepEmails: Set<string>) {
  if (!keepEmails.size) return

  const users = await listAllAuthUsers(admin)
  for (const user of users) {
    const email = user.email?.toLowerCase() ?? ""
    if (!keepEmails.has(email)) continue

    const existing = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!existing) {
      await prisma.profile.create({
        data: {
          id: user.id,
          displayName: user.email?.split("@")[0] ?? "Developer",
          active: false,
        },
      })
    }

    await prisma.$executeRaw`SELECT public.promote_super_admin(${user.id}::uuid)`
  }
}

async function main() {
  console.log("🧹 Cleaning Mediculous data…\n")

  const keepEmails = getKeepEmails()
  const admin = createAdminClient()

  const wiped = await wipeDatabase()
  const auth = await wipeAuthUsers(admin, keepEmails)
  await restoreDeveloperProfiles(admin, keepEmails)

  console.log("  Database cleared:")
  console.log(`    order lines:        ${wiped.orderLines.count}`)
  console.log(`    retailer inventory: ${wiped.retailerInventory.count}`)
  console.log(`    orders:             ${wiped.orders.count}`)
  console.log(`    profiles:           ${wiped.profiles.count}`)
  console.log(`    franchises:         ${wiped.franchises.count}`)
  console.log(`    stock rows:         ${wiped.stock.count}`)
  console.log(`    audit events:       ${wiped.audit.count}`)
  console.log("\n  Auth users:")
  console.log(`    deleted:            ${auth.deleted}`)
  console.log(`    kept (allowlist):     ${auth.kept}`)

  if (auth.keptEmails.length) {
    console.log(`    kept emails:        ${auth.keptEmails.join(", ")}`)
  } else {
    console.log("    (no DEVELOPER_EMAIL_ALLOWLIST — all auth users removed)")
  }

  console.log("\n✅ App is clean. Sign in with your allowlisted email to continue as super_admin.")
  console.log("   Run `npm run db:seed` if you want demo data again.\n")
}

main()
  .catch((error) => {
    console.error("Clean failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
