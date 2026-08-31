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
              <p className="pharma-label">Pharmaceutical wholesale</p>
              <h1 className="mt-5 font-display max-w-[12ch] text-4xl sm:text-5xl lg:text-[3.35rem]">
                <span className="text-ink">Precision</span>
                <br />
                <span className="text-gradient">supply chain.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
                Clinical-grade clarity for medicines, orders, and dispatch — built for wholesale teams
                who cannot afford guesswork.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/app">
                    Get started <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="glass" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>
              <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-line pt-6">
                {[
                  { label: "Batch tracking", value: "FEFO-ready" },
                  { label: "Order flow", value: "End-to-end" },
                  { label: "Access", value: "Role-based" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="pharma-label text-[10px]">{stat.label}</dt>
                    <dd className="mt-1 font-mono text-sm font-medium text-ink">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="animate-fade-up relative mx-auto w-full max-w-xl lg:max-w-none">
              <PharmaHeroVisual
                priority
                variant="dramatic"
                className="aspect-[4/3] w-full sm:aspect-[5/4] lg:aspect-[4/5] lg:min-h-[28rem]"
              />
              <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-auto sm:max-w-[16rem]">
                <div className="rounded-xl border border-white/20 bg-white/95 px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm">
                  <p className="pharma-label text-ink-soft">Batch-aware inventory</p>
                  <p className="mt-1 font-display text-base leading-snug text-ink">
                    Every vial tracked. Every order accountable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingGreeting partnerName="MEDICULOUSHEALTHCARE PVT LTD" />

        {/* About */}
        <section id="about" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-16 sm:py-20">
          <div className="grid gap-10 rounded-[2rem] border border-line bg-white p-8 shadow-[var(--shadow-md)] sm:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="pharma-label">About</p>
              <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
                Because every medicine matters.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                Mediculous was built with a simple belief: healthcare supply should be dependable,
                organized, and responsible. Behind every order is a healthcare professional, a patient,
                and a reason that medicine needs to arrive on time.
              </p>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                Stock uploads, franchise orders, invoice capture, and dispatch can live on one screen —
                the same flow your dispatch desk would use on a busy day.
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
                  className="flex items-center gap-2 rounded-xl border border-line bg-canvas/60 px-4 py-3 text-sm font-medium text-ink"
                >
                  <Check className="size-4 shrink-0 text-ink" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-16 pb-20 sm:py-20">
          <div className="text-center">
            <p className="pharma-label">What we do</p>
            <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
              Supporting healthcare, every step of the way.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-ink-soft">
              From managing medicines to fulfilling orders, we help healthcare teams stay organized,
              informed, and ready when it matters.
            </p>
          </div>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li
                key={service.title}
                className="group rounded-[1.25rem] border border-line bg-white p-6 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              >
                <span className="grid size-12 place-items-center rounded-xl border border-line bg-canvas text-ink transition-transform duration-300 group-hover:scale-105">
                  <service.icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-lg text-ink">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{service.body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10 text-center">
            <Button size="lg" variant="glass" asChild>
              <Link to="/login">
                Sign in to look around <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-line bg-white py-10 text-center">
        <p className="pharma-label text-ink-soft">Mediculous</p>
        <p className="mt-2 text-sm text-ink-soft">Wholesale operations software</p>
      </footer>
    </div>
  )
}
