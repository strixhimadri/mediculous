"use client"

import { useEffect, useState } from "react"
import { formatInr, formatQty } from "@/lib/format"

export function CountUp({
  value,
  money,
  duration = 900,
}: {
  value: number
  money?: boolean
  duration?: number
}) {
  const [n, setN] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setN(value)
      return
    }
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setN(value * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return <span className="tabular-nums">{money ? formatInr(n) : formatQty(Math.round(n))}</span>
}
