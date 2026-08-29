import { withHandler } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/requireUser"
import { isSuperAdminRole } from "@/lib/auth/roles"
import { jsonOk } from "@/lib/errors"

export const GET = withHandler(async () => {
  const ctx = await requireUser()
  return jsonOk({
    user: {
      id: ctx.userId,
      email: ctx.email,
      role: ctx.role,
      franchiseId: ctx.franchiseId,
      displayName: ctx.displayName,
      mustChangePassword: ctx.mustChangePassword,
      isSuperAdmin: isSuperAdminRole(ctx.role),
    },
  })
})
