import { withHandler } from "@/lib/api/handler"
import { requireSuperAdmin, requireUser } from "@/lib/auth/requireUser"
import { jsonOk } from "@/lib/errors"
import * as devService from "@/lib/services/dev.service"

export const GET = withHandler(async () => {
  const ctx = await requireUser()
  requireSuperAdmin(ctx)
  const rows = await devService.listAuditLog(ctx)
  return jsonOk(rows)
})
