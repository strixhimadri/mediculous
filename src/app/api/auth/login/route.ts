import { withHandler } from "@/lib/api/handler"
import { jsonOk } from "@/lib/errors"
import * as authService from "@/lib/services/auth.service"
import { loginSchema } from "@/lib/validators"

export const POST = withHandler(async (req) => {
  const body = loginSchema.parse(await req.json())
  const { user, session } = await authService.signIn(body.email, body.password)
  return jsonOk({ user, session })
})
