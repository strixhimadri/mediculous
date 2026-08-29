import { withHandler } from "@/lib/api/handler"
import { requireSuperAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonNoContent } from "@/lib/errors"
import * as devService from "@/lib/services/dev.service"
import { devUserUpdateSchema } from "@/lib/validators"

export const PATCH = withHandler(async (req, { params }) => {
  const ctx = await requireUser()
  requireSuperAdmin(ctx)
  const { id } = await params
  const body = devUserUpdateSchema.parse(await req.json())
  await devService.updateDevUser(ctx, id, body)
  return jsonNoContent()
})
