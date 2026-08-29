"use client"

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { fetchAuthProfileWithError } from "@/lib/api/http"
import { getSupabase, isSupabaseConfigured } from "@/lib/auth/client"
import type { UserRole } from "@/types/database"

export type AuthUser = {
  id: string
  email: string
  role: UserRole
  franchiseId: string | null
  displayName: string | null
  mustChangePassword: boolean
  isSuperAdmin: boolean
}

type AuthState = {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  configured: boolean
  apiReady: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null; user?: AuthUser }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function hydrateUser(session: Session): Promise<AuthUser | null> {
  // After client sign-in, auth cookies may not be readable by API routes immediately.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { profile } = await fetchAuthProfileWithError()
    if (profile) return profile
    if (attempt < 4) await sleep(80 * (attempt + 1))
  }

  const supabase = getSupabase()
  await supabase.auth.signOut()
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured()
  const apiReady = configured
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(configured)
  const userRef = useRef<AuthUser | null>(null)
  userRef.current = user

  const signOut = useCallback(async () => {
    if (!configured) {
      setUser(null)
      setSession(null)
      return
    }
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => null)
    const supabase = getSupabase()
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setLoading(false)
  }, [configured])

  const refreshProfile = useCallback(async () => {
    if (!session) return
    try {
      const next = await hydrateUser(session)
      setUser(next)
      if (!next) setSession(null)
    } catch {
      await signOut()
    }
  }, [session, signOut])

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    const supabase = getSupabase()
    let mounted = true

    async function initSession() {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()
      if (!mounted) return

      setSession(initialSession)
      if (initialSession) {
        try {
          const nextUser = await hydrateUser(initialSession)
          if (mounted) setUser(nextUser)
        } catch {
          if (mounted) await signOut()
        }
      }
      if (mounted) setLoading(false)
    }

    void initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, nextSession: Session | null) => {
      if (!mounted) return
      if (event === "INITIAL_SESSION") return

      setSession(nextSession)

      if (!nextSession) {
        setUser(null)
        setLoading(false)
        return
      }

      if (event === "TOKEN_REFRESHED" && userRef.current) {
        setLoading(false)
        return
      }

      if (event === "SIGNED_IN" && userRef.current) {
        setLoading(false)
        return
      }

      try {
        const nextUser = await hydrateUser(nextSession)
        setUser(nextUser)
        if (!nextUser) setSession(null)
      } catch {
        await signOut()
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [configured, signOut])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!configured) {
        return {
          error:
            "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        }
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      const body = (await res.json().catch(() => ({}))) as {
        user?: AuthUser
        error?: string
      }

      if (!res.ok) {
        const message = body.error ?? "Sign in failed"
        return {
          error:
            message === "Account is inactive"
              ? "Account is inactive or not linked to a franchise. Contact your administrator."
              : message,
        }
      }

      const nextUser = body.user ?? null
      if (!nextUser) {
        return { error: "Sign in failed" }
      }

      const supabase = getSupabase()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSession(session)
      setUser(nextUser)
      setLoading(false)
      return { error: null, user: nextUser }
    },
    [configured],
  )

  const value = useMemo<AuthState>(
    () => ({ user, session, loading, configured, apiReady, signIn, signOut, refreshProfile }),
    [user, session, loading, configured, apiReady, signIn, signOut, refreshProfile],
  )

  return createElement(AuthCtx.Provider, { value }, children)
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}

export function useRequireRole(roles: UserRole[]) {
  const { user, loading } = useAuth()
  const allowed = user ? roles.includes(user.role) : false
  return { user, loading, allowed }
}
