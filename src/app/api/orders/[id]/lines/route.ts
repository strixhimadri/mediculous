import { withHandler } from "@/lib/api/handler"
import { requireAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonNoContent } from "@/lib/errors"
import * as ordersService from "@/lib/services/orders.service"
import { orderLineSchema } from "@/lib/validators"

export const POST = withHandler(async (req, { params }) => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const { id: orderId } = await params
  const body = orderLineSchema.parse(await req.json())
  await ordersService.addOrderLine(ctx, orderId, body)
  return jsonNoContent()
})
