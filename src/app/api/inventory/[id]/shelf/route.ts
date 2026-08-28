import { withHandler } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/requireUser"
import { jsonNoContent } from "@/lib/errors"
import * as inventoryService from "@/lib/services/inventory.service"
import { shelfSchema } from "@/lib/validators"

export const PATCH = withHandler(async (req, { params }) => {
  const ctx = await requireUser()
  const { id } = await params
  const body = shelfSchema.parse(await req.json())
  await inventoryService.updateInventoryShelf(ctx, id, body.shelf)
  return jsonNoContent()
})
