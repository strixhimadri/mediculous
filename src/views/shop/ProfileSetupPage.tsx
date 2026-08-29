"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AuroraField } from "@/components/layout/AuroraField"
import { BrandMark, SkipLink } from "@/components/layout/SkipLink"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { changePassword } from "@/lib/api/http"
import { invalidateProfileCache } from "@/lib/auth/profile-cache"
import { useNavigate } from "@/lib/navigation"

export function ProfileSetupPage() {
  const { refreshProfile } = useAuth()
  const router = useRouter()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }
    setSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword)
      invalidateProfileCache()
      await refreshProfile()
      toast.success("Password updated — welcome to Mediculous")
      router.refresh()
      navigate("/shop", { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update password")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-svh overflow-x-clip">
      <AuroraField />
      <SkipLink />
      <div className="relative flex min-h-svh items-center justify-center px-4 py-10">
        <form onSubmit={onSubmit} className="glass w-full max-w-md rounded-[2rem] p-8">
          <div className="mb-6 flex items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-lg text-ink">Mediculous</span>
          </div>
          <h1 className="font-display text-2xl text-ink">Set your password</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Your administrator created this account with a temporary password. Choose a new password
            before continuing to the shop.
          </p>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current">Temporary password</Label>
              <Input
                id="current"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="mt-2 w-full" size="lg" disabled={submitting}>
              {submitting ? "Saving…" : "Save and continue"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
