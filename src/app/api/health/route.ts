import { withHandler } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/requireUser"
import { jsonOk } from "@/lib/errors"

export const GET = withHandler(async () => {
  return jsonOk({ ok: true, service: "mediculoes-api", timestamp: new Date().toISOString() })
})
