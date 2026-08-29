import { withHandler } from "@/lib/api/handler"
import { requireActiveRetailer, requireUser } from "@/lib/auth/requireUser"
import { jsonOk } from "@/lib/errors"
import * as ordersService from "@/lib/services/orders.service"
import { orderSubmitSchema } from "@/lib/validators"

export const POST = withHandler(async (req) => {
  const ctx = await requireUser()
  requireActiveRetailer(ctx)
  const body = orderSubmitSchema.parse(await req.json())
  const order = await ordersService.submitOrder(ctx, body.lines)
  return jsonOk({ order }, 201)
})
