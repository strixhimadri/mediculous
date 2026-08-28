"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { isApiConfigured } from "@/lib/api/http"
import type { UserRole } from "@/types/database"

type ProtectedRouteProps = {
  children: React.ReactNode
  roles?: UserRole[]
  redirectTo?: string
  wrongRoleRedirect?: string
}

export function ProtectedRoute({
  children,
  roles,
  redirectTo = "/login",
  wrongRoleRedirect,
}: ProtectedRouteProps) {
  const { user, loading, configured } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading || !configured) return
    if (!user) {
      const current = window.location.pathname
      router.replace(`${redirectTo}?redirect=${encodeURIComponent(current)}`)
      return
    }
    if (roles && !roles.includes(user.role)) {
      const fallback = wrongRoleRedirect ?? (user.role === "admin" ? "/app" : "/shop")
      router.replace(fallback)
    }
  }, [user, loading, configured, roles, redirectTo, wrongRoleRedirect, router])

  if (!configured) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="glass max-w-md rounded-[1.25rem] p-8 text-center">
          <h1 className="font-display text-xl text-ink">Not configured</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Set <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
            <code className="font-mono text-xs">.env</code>.
          </p>
        </div>
      </div>
    )
  }

  if (!isApiConfigured()) return null
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-canvas" aria-label="Loading session" />
      </div>
    )
  }

  if (!user) return null
  if (roles && !roles.includes(user.role)) return null

  if (roles?.includes("retailer") && !user.franchiseId) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="glass max-w-md rounded-[1.25rem] p-8 text-center">
          <h1 className="font-display text-xl text-ink">Account not ready</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Your retailer account is not linked to a franchise yet. Ask your wholesaler administrator
            to activate your account.
          </p>
        </div>
      </div>
    )
  }

  return children
}
