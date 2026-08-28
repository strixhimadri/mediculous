import { withHandler } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/requireUser"
import { jsonOk } from "@/lib/errors"
import * as stockService from "@/lib/services/stock.service"

export const GET = withHandler(async () => {
  const ctx = await requireUser()
  const rows = await stockService.listCatalog(ctx)
  return jsonOk(rows)
})
