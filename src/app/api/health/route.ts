import { withHandler } from "@/lib/api/handler"
import { prisma } from "@/lib/db/prisma"
import { jsonOk } from "@/lib/errors"

export const GET = withHandler(async () => {
  let db: "ok" | "error" = "ok"
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    db = "error"
  }

  return jsonOk({
    ok: db === "ok",
    service: "mediculoes-api",
    db,
    timestamp: new Date().toISOString(),
  })
})
