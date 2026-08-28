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
      <div className="rounded-[1.25rem] bg-greeting px-5 py-7 text-white sm:px-10 sm:py-10">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 sm:text-xs">
          <span className="size-2 shrink-0 rounded-full bg-amber-400" aria-hidden />
          Mediculous · Wholesale desk
        </p>

        <h2 className="mt-4 break-words font-display text-xl leading-snug sm:text-3xl">
          {greeting.label}{" "}
          <span aria-hidden className="inline-block">
            🙏
          </span>
          , {partnerName}
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">{greeting.message}</p>

        <blockquote className="mt-6 max-w-xl border-l-2 border-white/25 pl-4 text-sm italic leading-relaxed text-white/75 sm:text-base">
          “{greeting.quote}”
        </blockquote>
      </div>
    </section>
  )
}
