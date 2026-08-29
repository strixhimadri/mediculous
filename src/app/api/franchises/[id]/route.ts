import { withHandler } from "@/lib/api/handler"
import { requireAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonNoContent, jsonOk } from "@/lib/errors"
import * as franchisesService from "@/lib/services/franchises.service"
import { franchiseSchema } from "@/lib/validators"

export const PATCH = withHandler(async (req, { params }) => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const { id } = await params
  const body = franchiseSchema.parse(await req.json())
  const franchise = await franchisesService.updateFranchise(ctx, id, body)
  return jsonOk(franchise)
})

export const DELETE = withHandler(async (_req, { params }) => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const { id } = await params
  await franchisesService.deleteFranchise(ctx, id)
  return jsonNoContent()
})
