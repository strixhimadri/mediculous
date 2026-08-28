import { withHandler } from "@/lib/api/handler"
import { requireAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonNoContent } from "@/lib/errors"
import * as ordersService from "@/lib/services/orders.service"
import { orderApproveSchema } from "@/lib/validators"

export const POST = withHandler(async (req, { params }) => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const { id } = await params
  const body = orderApproveSchema.parse(await req.json())
  await ordersService.approveOrder(
    ctx,
    id,
    body.lines,
    body.billNumber ?? "",
    body.billDate ?? new Date().toISOString().slice(0, 10),
    body.invoiceNote,
  )
  return jsonNoContent()
})
