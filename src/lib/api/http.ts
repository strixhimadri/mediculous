import { isSupabaseConfigured } from "@/lib/auth/client"

export function isApiConfigured(): boolean {
  return true
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured")
  }

  const headers = new Headers(options.headers)
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json")
  }

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? res.statusText)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function fetchAuthProfile(): Promise<{
  id: string
  email: string
  role: "admin" | "retailer"
  franchiseId: string | null
  displayName: string | null
} | null> {
  try {
    const data = await apiFetch<{
      user: {
        id: string
        email: string
        role: "admin" | "retailer"
        franchiseId: string | null
        displayName: string | null
      }
    }>("/api/auth/me")
    return data.user
  } catch {
    return null
  }
}
