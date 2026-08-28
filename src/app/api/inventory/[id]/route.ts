import { withHandler } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/requireUser"
import { jsonOk } from "@/lib/errors"
import * as inventoryService from "@/lib/services/inventory.service"

export const GET = withHandler(async (_req, { params }) => {
  const ctx = await requireUser()
  const { id } = await params
  const rows = await inventoryService.listInventory(ctx, id)
  return jsonOk(rows)
})
