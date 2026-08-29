import { withHandler } from "@/lib/api/handler"
import { requireSuperAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonOk } from "@/lib/errors"
import * as devService from "@/lib/services/dev.service"
import { devUserCreateSchema } from "@/lib/validators"

export const GET = withHandler(async () => {
  const ctx = await requireUser()
  requireSuperAdmin(ctx)
  const users = await devService.listDevUsers(ctx)
  return jsonOk(users)
})

export const POST = withHandler(async (req) => {
  const ctx = await requireUser()
  requireSuperAdmin(ctx)
  const body = devUserCreateSchema.parse(await req.json())
  const user = await devService.createDevUser(ctx, {
    email: body.email,
    password: body.password,
    displayName: body.displayName,
    role: body.role,
    franchiseId: body.franchiseId ?? null,
    mustChangePassword: body.mustChangePassword,
  })
  return jsonOk(user, 201)
})
