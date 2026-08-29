"use client"

import { usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { Navigate } from "@/lib/navigation"
import { DashboardPage } from "@/views/app/DashboardPage"
import { DevAuditPage } from "@/views/app/DevAuditPage"
import { DevHealthPage } from "@/views/app/DevHealthPage"
import { DevUsersPage } from "@/views/app/DevUsersPage"
import { ExpiredPage } from "@/views/app/ExpiredPage"
import { ExpiryAlertPage } from "@/views/app/ExpiryAlertPage"
import { FranchiseOrderDetailPage } from "@/views/app/FranchiseOrderDetailPage"
import { FranchiseOrdersPage } from "@/views/app/FranchiseOrdersPage"
import { FranchisesPage } from "@/views/app/FranchisesPage"
import { HospitalOrdersPage } from "@/views/app/MyOrdersPage"
import { ReportsPage } from "@/views/app/ReportsPage"
import { ShelfPage } from "@/views/app/ShelfPage"
import { StockPage } from "@/views/app/StockPage"

function SuperAdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-canvas" aria-label="Loading" />
      </div>
    )
  }
  if (!user?.isSuperAdmin) return <Navigate to="/app" replace />
  return children
}

export function AdminRouter() {
  const pathname = usePathname()

  if (pathname === "/app") return <DashboardPage />
  if (pathname === "/app/medicines") return <StockPage />
  if (pathname === "/app/medicines/expiry") return <ExpiryAlertPage />
  if (pathname === "/app/medicines/expired") return <ExpiredPage />
  if (pathname === "/app/franchises") return <FranchisesPage />
  if (pathname === "/app/orders/franchise") return <FranchiseOrdersPage />
  if (pathname.startsWith("/app/orders/franchise/")) return <FranchiseOrderDetailPage />
  if (pathname === "/app/orders/hospital") return <HospitalOrdersPage />
  if (pathname === "/app/reports") return <ReportsPage />
  if (pathname === "/app/shelf") return <ShelfPage />
  if (pathname === "/app/dev/users") {
    return (
      <SuperAdminOnly>
        <DevUsersPage />
      </SuperAdminOnly>
    )
  }
  if (pathname === "/app/dev/audit") {
    return (
      <SuperAdminOnly>
        <DevAuditPage />
      </SuperAdminOnly>
    )
  }
  if (pathname === "/app/dev/health") {
    return (
      <SuperAdminOnly>
        <DevHealthPage />
      </SuperAdminOnly>
    )
  }

  return <DashboardPage />
}
