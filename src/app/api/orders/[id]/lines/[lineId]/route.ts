import { withHandler } from "@/lib/api/handler"
import { requireAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonNoContent } from "@/lib/errors"
import * as ordersService from "@/lib/services/orders.service"
import { orderLineSchema } from "@/lib/validators"

export const PATCH = withHandler(async (req, { params }) => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const { id: orderId, lineId } = await params
  const body = orderLineSchema.parse(await req.json())
  await ordersService.updateOrderLine(ctx, orderId, lineId, body)
  return jsonNoContent()
})

export const DELETE = withHandler(async (_req, { params }) => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const { id: orderId, lineId } = await params
  await ordersService.deleteOrderLine(ctx, orderId, lineId)
  return jsonNoContent()
})
