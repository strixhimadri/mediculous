import { withHandler } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/requireUser"
import { jsonOk } from "@/lib/errors"
import * as inventoryService from "@/lib/services/inventory.service"
import { qtySchema } from "@/lib/validators"

export const PATCH = withHandler(async (req, { params }) => {
  const ctx = await requireUser()
  const { id } = await params
  const body = qtySchema.parse(await req.json())
  const item = await inventoryService.updateInventoryQty(ctx, id, body.qty)
  return jsonOk({ item })
})
