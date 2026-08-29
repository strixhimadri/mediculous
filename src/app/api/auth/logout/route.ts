import { withHandler } from "@/lib/api/handler"
import { jsonNoContent } from "@/lib/errors"
import * as authService from "@/lib/services/auth.service"

export const POST = withHandler(async () => {
  await authService.signOut()
  return jsonNoContent()
})
