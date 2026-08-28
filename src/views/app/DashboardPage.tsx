"use client"

import { useMemo } from "react"
import { Link } from "@/lib/navigation"
import { Boxes, ClipboardList, IndianRupee, Package } from "lucide-react"
import { CountUp } from "@/components/layout/CountUp"
import { GlassPanel } from "@/components/layout/GlassPanel"
import { PageHeader } from "@/components/layout/PageHeader"
import { QuickActionGrid } from "@/components/layout/QuickActionGrid"
import { StatCard } from "@/components/layout/StatCard"
import { SalesAreaChart } from "@/components/charts/SalesAreaChart"
import { useAppState } from "@/context/AppState"
import { monthlySalesFromOrders, orderCount, retailSalesTotal, uniqueSkuCount } from "@/lib/appStats"
import { getRouteMeta } from "@/lib/routeMeta"

const kpiIcons = {
  medicine: Package,
  orders: ClipboardList,
  retail: IndianRupee,
} as const

export function DashboardPage() {
  const { stock, orders } = useAppState()
  const meta = getRouteMeta("/app")

  const dashboardKpis = useMemo(
    () => [
      { key: "medicine" as const, label: "Medicine", value: uniqueSkuCount(stock), money: false },
      { key: "orders" as const, label: "Orders", value: orderCount(orders), money: false },
      { key: "retail" as const, label: "Retail Sale 2026–27", value: retailSalesTotal(orders), money: true },
    ],
    [stock, orders],
  )

  const chartData = useMemo(() => monthlySalesFromOrders(orders), [orders])

  return (
    <div className="space-y-6">
      <PageHeader title={meta.title} description={meta.description} crumbs={meta.crumbs} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardKpis.map((k) => (
          <StatCard
            key={k.key}
            label={k.label}
            icon={kpiIcons[k.key as keyof typeof kpiIcons]}
            value={<CountUp value={k.value} money={k.money} />}
          />
        ))}
      </div>

      <div>
        <h2 className="font-display text-lg text-ink">Quick actions</h2>
        <p className="mt-1 text-sm text-steel">Jump to the most common operator tasks.</p>
        <div className="mt-3">
          <QuickActionGrid
            items={[
              { to: "/app/medicines", label: "List stock", description: "Search SKU and batch", icon: Package },
              { to: "/app/orders/franchise", label: "Franchise orders", description: "Approve and dispatch", icon: ClipboardList },
              { to: "/app/medicines/expiry", label: "Expiry alert", description: "Review near-expiry batches", icon: Boxes },
            ]}
          />
        </div>
      </div>

      <GlassPanel className="p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-ink">Monthly sales report</h2>
            <p className="mt-1 text-sm text-steel">Totals from approved orders in this session.</p>
          </div>
          <Link to="/app/reports" className="text-sm font-medium text-navy underline-offset-2 hover:underline">
            Full report
          </Link>
        </div>
        <div className="mt-4">
          <SalesAreaChart data={chartData} />
        </div>
      </GlassPanel>
    </div>
  )
}
