import { withHandler } from "@/lib/api/handler"
import { requireSuperAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonNoContent } from "@/lib/errors"
import * as devService from "@/lib/services/dev.service"
import { devResetPasswordSchema } from "@/lib/validators"

export const POST = withHandler(async (req, { params }) => {
  const ctx = await requireUser()
  requireSuperAdmin(ctx)
  const { id } = await params
  const body = devResetPasswordSchema.parse(await req.json())
  await devService.resetDevUserPassword(ctx, id, body.newPassword)
  return jsonNoContent()
})
