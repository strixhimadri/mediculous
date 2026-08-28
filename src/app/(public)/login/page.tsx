import { Suspense } from "react"
import { LoginPage } from "@/views/auth/LoginPage"

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-svh items-center justify-center">Loading…</div>}>
      <LoginPage />
    </Suspense>
  )
}
