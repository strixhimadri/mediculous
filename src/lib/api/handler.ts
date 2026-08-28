import { handleApiError } from "@/lib/errors"

type RouteContext = { params: Promise<Record<string, string>> }

export function withHandler(
  handler: (req: Request, ctx: RouteContext) => Promise<Response>,
) {
  return async (req: Request, ctx: RouteContext) => {
    try {
      return await handler(req, ctx)
    } catch (err) {
      return handleApiError(err)
    }
  }
}
