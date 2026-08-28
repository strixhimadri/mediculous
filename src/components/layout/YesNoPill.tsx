import { cn } from "@/lib/utils"

export function YesNoPill({ yes }: { yes: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-12 items-center justify-center gap-1 rounded-sm bg-canvas text-[11px] font-medium ring-1 ring-line",
        yes ? "text-ink" : "text-ink-soft",
      )}
    >
      {yes ? (
        <>
          <span className="size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
          Yes
        </>
      ) : (
        "No"
      )}
    </span>
  )
}
