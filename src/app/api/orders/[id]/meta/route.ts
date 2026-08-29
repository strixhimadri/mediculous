import { withHandler } from "@/lib/api/handler"
import { requireAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonOk } from "@/lib/errors"
import * as ordersService from "@/lib/services/orders.service"
import { orderMetaSchema } from "@/lib/validators"

export const PATCH = withHandler(async (req, { params }) => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const { id } = await params
  const body = orderMetaSchema.parse(await req.json())
  const order = await ordersService.updateOrderMeta(ctx, id, body)
  return jsonOk({ order })
})
