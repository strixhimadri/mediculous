import { withHandler } from "@/lib/api/handler"
import { requireActiveRetailer, requireAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonNoContent, jsonOk } from "@/lib/errors"
import * as ordersService from "@/lib/services/orders.service"
import { orderApproveSchema, orderLineSchema, orderMetaSchema, orderRejectSchema, orderSubmitSchema } from "@/lib/validators"

export const GET = withHandler(async () => {
  const ctx = await requireUser()
  const rows = await ordersService.listOrders(ctx)
  return jsonOk(rows)
})
