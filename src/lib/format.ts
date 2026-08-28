const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
})

const inrCompact = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
})

export function formatInr(value: number, withSymbol = true) {
  if (withSymbol) return inr.format(value).replace("₹", "₹ ")
  return inrCompact.format(value)
}

export function formatInrPlain(value: number) {
  return `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatQty(value: number) {
  return value.toLocaleString("en-IN")
}

export function relativeFrom(iso: string) {
  const then = new Date(iso).getTime()
  const now = new Date("2026-08-24T20:00:00").getTime()
  const days = Math.round((now - then) / 86_400_000)
  if (days <= 0) return "Today"
  if (days === 1) return "1 day ago"
  return `${days} days ago`
}
