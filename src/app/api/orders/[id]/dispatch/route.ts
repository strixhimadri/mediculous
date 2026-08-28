import { withHandler } from "@/lib/api/handler"
import { requireAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonNoContent } from "@/lib/errors"
import * as ordersService from "@/lib/services/orders.service"

export const POST = withHandler(async (_req, { params }) => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const { id } = await params
  await ordersService.dispatchOrder(ctx, id)
  return jsonNoContent()
})
