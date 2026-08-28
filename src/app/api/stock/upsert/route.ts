import { withHandler } from "@/lib/api/handler"
import { requireAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonOk } from "@/lib/errors"
import * as stockService from "@/lib/services/stock.service"
import { stockUpsertSchema } from "@/lib/validators"

export const POST = withHandler(async (req) => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const body = stockUpsertSchema.parse(await req.json())
  const result = await stockService.upsertStockBatches(ctx, body.rows)
  return jsonOk(result)
})
