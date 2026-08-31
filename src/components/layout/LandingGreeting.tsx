"use client"

import { useMemo } from "react"
import { getTimeGreeting } from "@/lib/timeGreeting"

type LandingGreetingProps = {
  partnerName?: string
}

export function LandingGreeting({ partnerName = "MEDICULOUSHEALTHCARE PVT LTD" }: LandingGreetingProps) {
  const greeting = useMemo(() => getTimeGreeting(), [])

  return (
    <section aria-label="Greeting" className="mx-auto max-w-6xl -mt-1 px-4 pb-8 pt-2 sm:px-5">
      <div className="relative overflow-hidden rounded-[1.25rem] border border-line bg-[#141414] px-5 py-7 text-white shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:px-10 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "linear-gradient(118deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 22%, transparent 48%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <p className="pharma-label text-white/55">Mediculous · Wholesale desk</p>

          <h2 className="mt-4 break-words font-display text-xl leading-snug text-white sm:text-3xl">
            {greeting.label}, {partnerName}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            {greeting.message}
          </p>

          <blockquote className="mt-6 max-w-xl border-l border-white/20 pl-4 text-sm leading-relaxed text-white/60 sm:text-base">
            “{greeting.quote}”
          </blockquote>
        </div>
      </div>
    </section>
  )
}
