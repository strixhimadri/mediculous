import "dotenv/config"
import { sanitizeDatabaseUrl } from "../src/lib/db/database-url.ts"
import { PrismaClient } from "@prisma/client"

const pooled = sanitizeDatabaseUrl(process.env.DATABASE_URL, { pooled: true })
const direct = sanitizeDatabaseUrl(process.env.DIRECT_URL)

console.log("DATABASE_URL (sanitized):", pooled?.replace(/:([^:@/]+)@/, ":***@"))
console.log("DIRECT_URL (sanitized):", direct?.replace(/:([^:@/]+)@/, ":***@"))

const prisma = new PrismaClient({
  datasources: { db: { url: pooled } },
})

try {
  await prisma.$queryRaw`SELECT 1 as ok`
  console.log("DB connection: OK")
} catch (err) {
  console.error("DB connection: FAILED")
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
