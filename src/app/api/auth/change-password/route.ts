import { withHandler } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/requireUser"
import { jsonNoContent } from "@/lib/errors"
import * as authService from "@/lib/services/auth.service"
import { changePasswordSchema } from "@/lib/validators"

export const POST = withHandler(async (req) => {
  const ctx = await requireUser()
  const body = changePasswordSchema.parse(await req.json())
  await authService.changePassword(ctx, body.currentPassword, body.newPassword)
  return jsonNoContent()
})
