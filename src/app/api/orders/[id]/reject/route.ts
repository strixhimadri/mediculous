import { withHandler } from "@/lib/api/handler"
import { requireAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonNoContent } from "@/lib/errors"
import * as ordersService from "@/lib/services/orders.service"
import { orderRejectSchema } from "@/lib/validators"

export const POST = withHandler(async (req, { params }) => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const { id } = await params
  const body = orderRejectSchema.parse(await req.json())
  await ordersService.rejectOrder(ctx, id, body.reason)
  return jsonNoContent()
})
