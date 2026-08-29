import { withHandler } from "@/lib/api/handler"
import { requireActiveRetailer, requireUser } from "@/lib/auth/requireUser"
import { jsonOk } from "@/lib/errors"
import * as ordersService from "@/lib/services/orders.service"
import * as stockService from "@/lib/services/stock.service"

export const GET = withHandler(async () => {
  const ctx = await requireUser()
  requireActiveRetailer(ctx)

  const [catalog, orders] = await Promise.all([
    stockService.listCatalog(ctx),
    ordersService.listOrders(ctx),
  ])

  return jsonOk({ catalog, orders })
})
