export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = "AppError"
  }

  static badRequest(message = "Bad request") {
    return new AppError(message, 400)
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401)
  }

  static forbidden(message = "Forbidden") {
    return new AppError(message, 403)
  }

  static notFound(message = "Not found") {
    return new AppError(message, 404)
  }

  static internal(message = "Internal server error") {
    return new AppError(message, 500)
  }
}

export function handleApiError(err: unknown): Response {
  if (err instanceof AppError) {
    return Response.json({ error: err.message }, { status: err.statusCode })
  }

  if (err instanceof Error) {
    console.error("[API Error]", err)
    return Response.json({ error: err.message }, { status: 500 })
  }

  return Response.json({ error: "Internal server error" }, { status: 500 })
}

export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json(data, { status })
}

export function jsonNoContent(): Response {
  return new Response(null, { status: 204 })
}
