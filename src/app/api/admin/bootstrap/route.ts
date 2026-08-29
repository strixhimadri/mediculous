import { withHandler } from "@/lib/api/handler"
import { requireAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonOk } from "@/lib/errors"
import * as franchisesService from "@/lib/services/franchises.service"
import * as ordersService from "@/lib/services/orders.service"
import * as stockService from "@/lib/services/stock.service"

export const GET = withHandler(async () => {
  const ctx = await requireUser()
  requireAdmin(ctx)

  const [stock, franchises, orders] = await Promise.all([
    stockService.listStock(ctx),
    franchisesService.listFranchises(ctx),
    ordersService.listOrders(ctx),
  ])

  return jsonOk({ stock, franchises, orders })
})
