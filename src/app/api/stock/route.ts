import { withHandler } from "@/lib/api/handler"
import { requireAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonOk } from "@/lib/errors"
import * as stockService from "@/lib/services/stock.service"
import { shelfSchema, stockUpsertSchema } from "@/lib/validators"

export const GET = withHandler(async () => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const rows = await stockService.listStock(ctx)
  return jsonOk(rows)
})
