import { withHandler } from "@/lib/api/handler"
import { requireAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonNoContent, jsonOk } from "@/lib/errors"
import * as franchisesService from "@/lib/services/franchises.service"
import { franchiseSchema } from "@/lib/validators"

export const GET = withHandler(async () => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const rows = await franchisesService.listFranchises(ctx)
  return jsonOk(rows)
})

export const POST = withHandler(async (req) => {
  const ctx = await requireUser()
  requireAdmin(ctx)
  const body = franchiseSchema.parse(await req.json())
  const row = await franchisesService.createFranchise(ctx, body)
  return jsonOk(row, 201)
})
