"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Link, useSearchParams } from "@/lib/navigation"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuroraField } from "@/components/layout/AuroraField"
import { PharmaHeroVisual } from "@/components/layout/PharmaHeroVisual"
import { SkipLink, BrandMark } from "@/components/layout/SkipLink"
import { useAuth } from "@/context/AuthContext"
import { getPostLoginPath } from "@/lib/auth/roles"
import { toast } from "sonner"

export function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, user, loading, configured } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const from = searchParams.get("redirect")

  useEffect(() => {
    if (loading || !user) return
    const dest = getPostLoginPath(user, from)
    router.replace(dest)
  }, [loading, user, from, router])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const result = await signIn(email, password)
    setSubmitting(false)
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Signed in")
    if (result.user) {
      window.location.assign(getPostLoginPath(result.user, from))
    }
  }

  return (
    <div className="relative min-h-svh overflow-x-clip">
      <AuroraField />
      <SkipLink />
      <div className="relative grid min-h-svh lg:grid-cols-2">
        <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
          <PharmaHeroVisual variant="bleed" className="absolute inset-0" priority />
          <div className="relative z-10 flex flex-col justify-between p-10">
            <Link to="/" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="font-display text-xl text-ink">Mediculous</span>
            </Link>
            <div className="glass max-w-md rounded-[2rem] p-8">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-ink backdrop-blur-sm">
                <Sparkles className="size-4" />
                B2B wholesale platform
              </p>
              <h1 className="mt-5 font-display text-4xl leading-tight text-ink">
                Stock, orders, and dispatch in one secure portal.
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Admin operators manage inventory and approve franchise orders. Retailers browse available
                medicines and place orders online.
              </p>
            </div>
            <p className="text-xs text-ink-soft">Role-based access · encrypted sessions</p>
          </div>
        </section>

        <section className="relative flex flex-col px-4 py-8 sm:px-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 overflow-hidden lg:hidden">
            <PharmaHeroVisual variant="bleed" className="h-full opacity-70" />
          </div>
          <header className="relative z-10 mb-8 flex items-center lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <BrandMark />
              <span className="font-display text-lg text-ink">Mediculous</span>
            </Link>
          </header>
          <main id="main" className="relative z-10 flex flex-1 items-center justify-center">
            <form onSubmit={onSubmit} className="glass w-full max-w-md rounded-[2rem] p-8">
              <h2 className="font-display text-2xl text-ink">Sign in</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {configured
                  ? "Use the credentials provided by your wholesaler administrator."
                  : "Configure Supabase environment variables to enable secure login."}
              </p>
              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="mt-2 w-full" size="lg" disabled={submitting || !configured}>
                  {submitting ? "Signing in…" : "Sign in"}
                </Button>
              </div>
            </form>
          </main>
        </section>
      </div>
    </div>
  )
}
