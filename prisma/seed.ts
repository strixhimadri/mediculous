import { PrismaClient, type OrderStatus } from "@prisma/client"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import {
  SEED_ADMIN,
  SEED_FRANCHISES,
  SEED_PASSWORD,
  SEED_RETAILERS,
  SEED_STOCK,
} from "./seed-data"

const prisma = new PrismaClient()

function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env")
  }
  if (key.startsWith("sb_publishable_")) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must be a secret key (sb_secret_…), not publishable")
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function findUserByEmail(admin: SupabaseClient, email: string) {
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

async function ensureAuthUser(admin: SupabaseClient, email: string, password: string, displayName: string) {
  const existing = await findUserByEmail(admin, email)
  if (existing) return existing.id

  const { data, error } = await admin.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })
  if (error) throw new Error(`Failed to create ${email}: ${error.message}`)
  return data.user!.id
}

async function promoteAdmin(userId: string) {
  await prisma.$executeRaw`SELECT public.promote_admin(${userId}::uuid)`
}

async function provisionRetailer(userId: string, franchiseId: string, displayName: string) {
  await prisma.$executeRaw`
    SELECT public.provision_retailer_profile(
      ${userId}::uuid,
      ${franchiseId}::uuid,
      ${displayName}
    )
  `
}

async function seedStock() {
  let created = 0
  for (const row of SEED_STOCK) {
    const existing = await prisma.wholesalerStock.findFirst({
      where: { name: row.name, batch: row.batch },
    })
    if (existing) continue

    await prisma.wholesalerStock.create({
      data: {
        name: row.name,
        brand: row.brand,
        sku: row.sku,
        hsn: row.hsn,
        gst: row.gst,
        expiry: new Date(row.expiry),
        buyingPrice: row.buyingPrice,
        sellingPrice: row.sellingPrice,
        packSize: row.packSize,
        batch: row.batch,
        shelf: row.shelf,
        purchased: row.purchased,
        sold: row.sold,
        qtyAvailable: row.qtyAvailable,
        qtyReserved: 0,
      },
    })
    created++
  }
  return created
}

async function seedFranchises() {
  const byKey = new Map<string, string>()
  let created = 0

  for (const row of SEED_FRANCHISES) {
    const existing = await prisma.franchise.findFirst({ where: { name: row.name } })
    if (existing) {
      byKey.set(row.key, existing.id)
      continue
    }

    const lastOrder = new Date()
    lastOrder.setDate(lastOrder.getDate() - row.daysSinceLastOrder)

    const franchise = await prisma.franchise.create({
      data: {
        name: row.name,
        phone: row.phone,
        whatsapp: row.whatsapp,
        yearlyOrder: row.yearlyOrder,
        aov: row.aov,
        monthPotential: row.monthPotential,
        thisMonth: row.thisMonth,
        changePct: row.changePct,
        lastOrder,
        active: true,
      },
    })
    byKey.set(row.key, franchise.id)
    created++
  }

  return { byKey, created }
}

async function seedUsers(admin: SupabaseClient, franchiseIds: Map<string, string>) {
  const accounts: { email: string; role: string; password: string }[] = []

  const adminId = await ensureAuthUser(admin, SEED_ADMIN.email, SEED_PASSWORD, SEED_ADMIN.displayName)
  await promoteAdmin(adminId)
  accounts.push({ email: SEED_ADMIN.email, role: "admin", password: SEED_PASSWORD })

  for (const retailer of SEED_RETAILERS) {
    const franchiseId = franchiseIds.get(retailer.franchiseKey)
    if (!franchiseId) throw new Error(`Missing franchise for key ${retailer.franchiseKey}`)

    const userId = await ensureAuthUser(admin, retailer.email, SEED_PASSWORD, retailer.displayName)
    await provisionRetailer(userId, franchiseId, retailer.displayName)

    if (!retailer.mustChangePassword) {
      await prisma.profile.update({
        where: { id: userId },
        data: { mustChangePassword: false },
      })
    }

    accounts.push({
      email: retailer.email,
      role: retailer.mustChangePassword ? "retailer (must change password)" : "retailer",
      password: SEED_PASSWORD,
    })
  }

  return accounts
}

async function seedOrders(franchiseIds: Map<string, string>) {
  const existing = await prisma.order.count()
  if (existing > 0) return 0

  const andheriId = franchiseIds.get("apollo-andheri")!
  const koramangalaId = franchiseIds.get("medplus-koramangala")!
  const puneId = franchiseIds.get("wellness-pune")!

  const stock = await prisma.wholesalerStock.findMany({ take: 6 })

  type OrderSeed = {
    franchiseId: string
    status: OrderStatus
    billNumber: string
    lines: { medicineName: string; quantity: number; batch: string; pricePerUnit: number; gst: number }[]
  }

  const orders: OrderSeed[] = [
    {
      franchiseId: andheriId,
      status: "pending",
      billNumber: "",
      lines: [
        { medicineName: stock[0]!.name, quantity: 50, batch: stock[0]!.batch, pricePerUnit: Number(stock[0]!.sellingPrice), gst: Number(stock[0]!.gst) },
        { medicineName: stock[1]!.name, quantity: 30, batch: stock[1]!.batch, pricePerUnit: Number(stock[1]!.sellingPrice), gst: Number(stock[1]!.gst) },
      ],
    },
    {
      franchiseId: andheriId,
      status: "pending",
      billNumber: "",
      lines: [
        { medicineName: stock[2]!.name, quantity: 20, batch: stock[2]!.batch, pricePerUnit: Number(stock[2]!.sellingPrice), gst: Number(stock[2]!.gst) },
      ],
    },
    {
      franchiseId: koramangalaId,
      status: "approved",
      billNumber: "BILL-2026-0142",
      lines: [
        { medicineName: stock[3]!.name, quantity: 40, batch: stock[3]!.batch, pricePerUnit: Number(stock[3]!.sellingPrice), gst: Number(stock[3]!.gst) },
        { medicineName: stock[4]!.name, quantity: 60, batch: stock[4]!.batch, pricePerUnit: Number(stock[4]!.sellingPrice), gst: Number(stock[4]!.gst) },
      ],
    },
    {
      franchiseId: puneId,
      status: "dispatched",
      billNumber: "BILL-2026-0098",
      lines: [
        { medicineName: stock[5]!.name, quantity: 25, batch: stock[5]!.batch, pricePerUnit: Number(stock[5]!.sellingPrice), gst: Number(stock[5]!.gst) },
      ],
    },
  ]

  for (const order of orders) {
    const taxable = order.lines.reduce((sum, line) => sum + line.quantity * line.pricePerUnit, 0)
    const total = order.lines.reduce(
      (sum, line) => sum + line.quantity * line.pricePerUnit * (1 + line.gst / 100),
      0,
    )

    await prisma.order.create({
      data: {
        franchiseId: order.franchiseId,
        status: order.status,
        billNumber: order.billNumber,
        billDate: order.billNumber ? new Date() : null,
        totalAmount: total,
        approvedAt: order.status !== "pending" ? new Date() : null,
        dispatchedAt: order.status === "dispatched" ? new Date() : null,
        lines: {
          create: order.lines.map((line, index) => ({
            medicineName: line.medicineName,
            quantity: line.quantity,
            batch: line.batch,
            pricePerUnit: line.pricePerUnit,
            gst: line.gst,
            sortOrder: index,
          })),
        },
      },
    })
  }

  return orders.length
}

async function main() {
  console.log("🌱 Seeding Mediculous demo data…\n")

  const admin = createAdminClient()

  const stockCreated = await seedStock()
  const { byKey: franchiseIds, created: franchisesCreated } = await seedFranchises()
  const accounts = await seedUsers(admin, franchiseIds)
  const ordersCreated = await seedOrders(franchiseIds)

  console.log(`  Stock rows added:     ${stockCreated}`)
  console.log(`  Franchises added:     ${franchisesCreated}`)
  console.log(`  Orders added:         ${ordersCreated}`)
  console.log("\n📋 Demo accounts (password for all: " + SEED_PASSWORD + ")\n")
  console.log("  Role       | Email")
  console.log("  -----------|------------------------------------------")
  for (const account of accounts) {
    console.log(`  ${account.role.padEnd(10)} | ${account.email}`)
  }
  console.log("\n  Super admin: sign in with your allowlisted email (himadrihalde84@gmail.com)")
  console.log("\n✅ Seed complete. Re-run safely — existing users and stock are skipped.\n")
}

main()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
