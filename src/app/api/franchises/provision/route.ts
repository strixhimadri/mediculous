import { withHandler } from "@/lib/api/handler"
import { requireConsoleAccess, requireUser } from "@/lib/auth/requireUser"
import { jsonOk } from "@/lib/errors"
import * as provisionService from "@/lib/services/provision.service"
import { franchiseProvisionSchema } from "@/lib/validators"

export const POST = withHandler(async (req) => {
  const ctx = await requireUser()
  requireConsoleAccess(ctx)
  const body = franchiseProvisionSchema.parse(await req.json())
  const result = await provisionService.provisionFranchiseWithRetailer(ctx, body)
  return jsonOk(result, 201)
})
