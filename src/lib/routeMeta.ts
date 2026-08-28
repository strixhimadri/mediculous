export type RouteMeta = {
  title: string
  description?: string
  crumbs: { label: string; to?: string }[]
}

const meta: Record<string, RouteMeta> = {
  "/app": {
    title: "Dashboard",
    description: "Synthetic FY 2026–27 figures for demonstration.",
    crumbs: [{ label: "Console", to: "/app" }, { label: "Dashboard" }],
  },
  "/app/medicines": {
    title: "List stock",
    description: "SKU, HSN, GST, batch and shelf — demonstration inventory.",
    crumbs: [{ label: "Console", to: "/app" }, { label: "Medicines" }, { label: "List stock" }],
  },
  "/app/medicines/expiry": {
    title: "Expiry alert",
    description: "Near-expiry batches that need attention.",
    crumbs: [{ label: "Console", to: "/app" }, { label: "Medicines" }, { label: "Expiry alert" }],
  },
  "/app/medicines/expired": {
    title: "Expired product",
    description: "Batches past expiry date in this demonstration set.",
    crumbs: [{ label: "Console", to: "/app" }, { label: "Medicines" }, { label: "Expired product" }],
  },
  "/app/orders": {
    title: "My order",
    description: "Orders placed by the demonstration franchise account.",
    crumbs: [{ label: "Console", to: "/app" }, { label: "Orders" }, { label: "My order" }],
  },
  "/app/orders/franchise": {
    title: "List franchise order",
    description: "Approve, edit, and dispatch franchise requests.",
    crumbs: [{ label: "Console", to: "/app" }, { label: "Orders" }, { label: "Franchise order" }],
  },
  "/app/orders/hospital": {
    title: "Hospital order",
    description: "Hospital channel orders in this demonstration set.",
    crumbs: [{ label: "Console", to: "/app" }, { label: "Orders" }, { label: "Hospital order" }],
  },
  "/app/franchises": {
    title: "List franchise",
    description: "Franchise performance, contact, and last order.",
    crumbs: [{ label: "Console", to: "/app" }, { label: "Franchises" }],
  },
  "/app/shelf": {
    title: "Shelf",
    description: "Assign a bay for every live batch. Locations persist for this session.",
    crumbs: [{ label: "Console", to: "/app" }, { label: "Shelf" }],
  },
  "/app/reports": {
    title: "Sales report",
    description: "Demonstration figures — not live accounts.",
    crumbs: [{ label: "Console", to: "/app" }, { label: "Reports" }],
  },
}

export function getRouteMeta(pathname: string): RouteMeta {
  if (pathname.startsWith("/app/orders/franchise/") && pathname !== "/app/orders/franchise") {
    const id = pathname.split("/").pop()
    return {
      title: "Franchise order detail",
      description: `Order #${id} — line items, batch, approve.`,
      crumbs: [
        { label: "Console", to: "/app" },
        { label: "Orders" },
        { label: "Franchise order", to: "/app/orders/franchise" },
        { label: `#${id}` },
      ],
    }
  }
  return meta[pathname] ?? {
    title: "Console",
    crumbs: [{ label: "Console", to: "/app" }],
  }
}
