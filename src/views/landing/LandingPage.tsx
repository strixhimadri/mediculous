"use client"

import { Link } from "@/lib/navigation"
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  ClipboardCheck,
  Headphones,
  Package,
  Sparkles,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuroraField } from "@/components/layout/AuroraField"
import { PharmaHeroVisual } from "@/components/layout/PharmaHeroVisual"
import { SkipLink } from "@/components/layout/SkipLink"
import { LandingHeader } from "@/components/layout/LandingHeader"
import { LandingGreeting } from "@/components/layout/LandingGreeting"

const services = [
  {
    icon: Package,
    title: "Medicine & Stock Management",
    body: "Keep medicines, batches, quantities, and stock information organized in one place — with the clarity your team needs every day.",
  },
  {
    icon: Truck,
    title: "Order & Dispatch Management",
    body: "Manage orders from request to dispatch with a clear process, helping every order move accurately and efficiently.",
  },
  {
    icon: ClipboardCheck,
    title: "Batch & Expiry Tracking",
    body: "Stay aware of approaching expiry dates and affected batches, helping your team take action before they become a problem.",
  },
  {
    icon: Building2,
    title: "Franchise & Partner Management",
    body: "Keep partner details, order history, and activity together so your team always has the information it needs.",
  },
  {
    icon: BarChart3,
    title: "Clear Business Insights",
    body: "Understand sales, stock, pending orders, and day-to-day performance through simple, meaningful information.",
  },
  {
    icon: Headphones,
    title: "Ongoing Operational Support",
    body: "Keep order status, dispatch information, and important updates accessible to the people responsible for getting the job done.",
  },
]

export function LandingPage() {
  return (
    <div className="relative min-h-svh overflow-x-clip">
      <AuroraField />
      <SkipLink />
      <LandingHeader />

      <main id="main" className="relative">
        {/* Hero */}
        <section id="home" className="mx-auto max-w-6xl scroll-mt-28 px-5 pb-6 pt-8 sm:pt-14">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-12">
            <div className="animate-fade-up max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white/90 px-4 py-1.5 text-sm font-medium text-ink shadow-sm backdrop-blur-sm">
                <Sparkles className="size-4 text-ink" />
                For wholesale pharmacy teams
              </p>
              <h1 className="mt-6 font-display max-w-[14ch] text-4xl sm:text-5xl lg:text-[3.4rem]">
                <span className="text-gradient">Your Health</span>
                <br />
                <span className="text-ink">Comes First.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
                We help healthcare teams manage medicines, orders, and supplies reliably — so the right
                care can reach the people who need it.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/app">
                    Get started <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="peach" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>
            </div>

            <div className="animate-fade-up relative mx-auto w-full max-w-xl lg:max-w-none">
              <PharmaHeroVisual
                priority
                variant="panel"
                className="aspect-[4/3] w-full sm:aspect-[5/4] lg:aspect-[4/5] lg:min-h-[28rem]"
              />
              <div className="glass absolute bottom-4 left-4 right-4 p-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-[15rem]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                  Precision supply
                </p>
                <p className="mt-1 font-display text-lg leading-snug text-ink">
                  Batch-aware inventory for modern pharma teams
                </p>
              </div>
            </div>
          </div>
        </section>

        <LandingGreeting partnerName="MEDICULOUSHEALTHCARE PVT LTD" />

        {/* About */}
        <section id="about" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-16 sm:py-20">
          <div className="glass grid gap-10 rounded-[2rem] p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-soft">About</p>
              <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
              Because every medicine matters.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Mediculous was built with a simple belief: healthcare supply should be dependable, organized, and responsible.

Behind every order is a healthcare professional, a patient, and a reason that medicine needs to arrive on time. We help distributors and healthcare teams manage their everyday supply operations with greater clarity and confidence.
              </p>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                Stock uploads, franchise orders, invoice capture, and dispatch can live on one screen — the
                same flow your dispatch desk would use on a busy day.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                "Reliable medicine supply",
                "Clear batch & expiry tracking",
                "Accurate order management",
                "Organized distribution",
                "GST & invoice-ready records",
                "Built around real workflows",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink"
                >
                  <Check className="size-4 shrink-0 text-ink" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Services — what we provide */}
        <section id="services" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-16 pb-20 sm:py-20">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-soft">WHAT WE DO</p>
            <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">Supporting Healthcare, Every Step of the Way.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink-soft">
            From managing medicines to fulfilling orders, we help healthcare teams stay organized, informed, and ready when it matters.
            </p>
          </div>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li
                key={service.title}
                className="glass group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
              >
                <span className="grid size-14 place-items-center rounded-2xl bg-canvas text-ink transition-transform duration-300 group-hover:scale-105">
                  <service.icon className="size-7" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-lg text-ink">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{service.body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10 text-center">
            <Button size="lg" variant="peach" asChild>
              <Link to="/login">
                Sign in to look around <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-line bg-white py-8 text-center text-sm text-ink-soft">
        <p>Mediculous — wholesale operations software</p>
      </footer>
    </div>
  )
}
