import { withHandler } from "@/lib/api/handler"
import { requireAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonNoContent } from "@/lib/errors"
import * as stockService from "@/lib/services/stock.service"
import { shelfSchema } from "@/lib/validators"

export const PATCH = withHandler(async (req, { params }) => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const { id } = await params
  const body = shelfSchema.parse(await req.json())
  await stockService.updateStockShelf(ctx, id, body.shelf)
  return jsonNoContent()
})
