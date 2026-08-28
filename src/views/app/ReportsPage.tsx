"use client"

import { GlassPanel } from "@/components/layout/GlassPanel"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCard } from "@/components/layout/StatCard"
import { SalesAreaChart } from "@/components/charts/SalesAreaChart"
import { useMemo } from "react"
import { useAppState } from "@/context/AppState"
import { dispatchedCount, monthlySalesFromOrders, pendingApprovalCount, retailSalesTotal } from "@/lib/appStats"
import { formatInr } from "@/lib/format"
import { getRouteMeta } from "@/lib/routeMeta"
import { CheckCircle2, Clock, IndianRupee } from "lucide-react"

export function ReportsPage() {
  const { orders } = useAppState()
  const meta = getRouteMeta("/app/reports")
  const pending = pendingApprovalCount(orders)
  const dispatched = dispatchedCount(orders)
  const retailTotal = retailSalesTotal(orders)
  const chartData = useMemo(() => monthlySalesFromOrders(orders), [orders])

  return (
    <div className="space-y-5">
      <PageHeader title={meta.title} description={meta.description} crumbs={meta.crumbs} />
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Retail 2026–27" icon={IndianRupee} value={formatInr(retailTotal)} />
        <StatCard label="Pending approval" icon={Clock} value={pending} />
        <StatCard label="Dispatched in this list" icon={CheckCircle2} value={dispatched} />
      </div>
      <GlassPanel className="p-4 sm:p-5">
        <h2 className="font-display text-lg text-ink">Monthly sales</h2>
        <div className="mt-4">
          <SalesAreaChart data={chartData} />
        </div>
      </GlassPanel>
    </div>
  )
}
