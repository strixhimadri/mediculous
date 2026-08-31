"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Link, useSearchParams } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuroraField } from "@/components/layout/AuroraField"
import { BrandMark, SkipLink } from "@/components/layout/SkipLink"
import { useAuth } from "@/context/AuthContext"
import { getPostLoginPath } from "@/lib/auth/roles"
import { toast } from "sonner"

export function InventoryLoginPage() {
  const router = useRouter()
  const { signIn, user, loading, configured } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (loading || !user) return
    if (user.role !== "retailer") return
    router.replace(getPostLoginPath(user, "/inventory"))
  }, [loading, user, router])

  if (!loading && user && user.role !== "retailer") {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="glass max-w-md rounded-[1.25rem] p-8 text-center">
          <h1 className="font-display text-xl text-ink">Retailer access only</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Admin accounts cannot access the inventory site. Use the main portal instead.
          </p>
        </div>
      </div>
    )
  }

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
    if (result.user?.role === "retailer") {
      window.location.assign(getPostLoginPath(result.user, "/inventory"))
    }
  }

  return (
    <div className="relative min-h-svh">
      <AuroraField />
      <SkipLink />
      <main id="main" className="relative flex min-h-svh items-center justify-center p-4">
        <form onSubmit={onSubmit} className="glass w-full max-w-md rounded-[2rem] p-8">
          <Link to="/" className="mb-6 flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg text-ink">My Stock</span>
          </Link>
          <h2 className="font-display text-2xl text-ink">Retailer inventory</h2>
          <p className="mt-2 text-sm text-ink-soft">Manage medicines received from your wholesaler.</p>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">Email</Label>
              <Input
                id="inv-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-password">Password</Label>
              <Input
                id="inv-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !configured}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
