import { withHandler } from "@/lib/api/handler"
import { requireAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonOk } from "@/lib/errors"
import * as ordersService from "@/lib/services/orders.service"
import { orderRejectSchema } from "@/lib/validators"

export const POST = withHandler(async (req, { params }) => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const { id } = await params
  const body = orderRejectSchema.parse(await req.json())
  const order = await ordersService.rejectOrder(ctx, id, body.reason)
  return jsonOk({ order })
})
