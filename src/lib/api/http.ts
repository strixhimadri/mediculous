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

export type AuthProfile = {
  id: string
  email: string
  role: "admin" | "retailer" | "super_admin"
  franchiseId: string | null
  displayName: string | null
  mustChangePassword: boolean
  isSuperAdmin: boolean
}

export async function fetchAuthProfile(): Promise<AuthProfile | null> {
  const result = await fetchAuthProfileWithError()
  return result.profile
}

export async function fetchAuthProfileWithError(): Promise<{
  profile: AuthProfile | null
  error: string | null
}> {
  try {
    const data = await apiFetch<{ user: AuthProfile }>("/api/auth/me")
    return { profile: data.user, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load profile"
    return { profile: null, error: message }
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await apiFetch("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export async function provisionFranchise(body: Record<string, unknown>) {
  return apiFetch<{ franchise: unknown; email: string }>("/api/franchises/provision", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function fetchDevUsers() {
  return apiFetch<
    {
      id: string
      email: string
      role: string
      franchiseId: string | null
      franchiseName: string | null
      displayName: string | null
      active: boolean
      mustChangePassword: boolean
    }[]
  >("/api/dev/users")
}

export async function createDevUser(body: {
  email: string
  password: string
  displayName?: string
  role: string
  franchiseId?: string | null
  mustChangePassword?: boolean
}) {
  return apiFetch<{ id: string; email: string }>("/api/dev/users", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function updateDevUser(
  id: string,
  body: { role: string; franchiseId: string | null; active: boolean },
) {
  await apiFetch(`/api/dev/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export async function resetDevUserPassword(id: string, newPassword: string) {
  await apiFetch(`/api/dev/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  })
}

export async function fetchDevAudit() {
  return apiFetch<
    {
      id: string
      actorId: string | null
      action: string
      entityType: string
      entityId: string | null
      createdAt: string
    }[]
  >("/api/dev/audit")
}
