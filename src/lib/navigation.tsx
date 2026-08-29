"use client"

import NextLink from "next/link"
import { useParams as useNextParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, type ComponentProps, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  to?: string
  href?: string
  prefetch?: boolean
}

export function Link({ to, href, prefetch = true, ...props }: LinkProps) {
  return <NextLink href={to ?? href ?? "/"} prefetch={prefetch} {...props} />
}

type NavLinkProps = {
  to: string
  end?: boolean
  className?: string | ((state: { isActive: boolean }) => string)
  children?: ReactNode
  onClick?: () => void
}

export function NavLink({ to, end, className, children, onClick }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = end
    ? pathname === to
    : pathname === to || (to !== "/" && pathname.startsWith(`${to}/`))
  const resolvedClass =
    typeof className === "function" ? className({ isActive }) : cn(className, isActive && "active")

  return (
    <NextLink href={to} prefetch className={resolvedClass} onClick={onClick}>
      {children}
    </NextLink>
  )
}

export function useNavigate() {
  const router = useRouter()
  return (to: string, opts?: { replace?: boolean }) => {
    if (opts?.replace) router.replace(to)
    else router.push(to)
  }
}

export function useLocation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return {
    pathname,
    search: searchParams.toString() ? `?${searchParams.toString()}` : "",
    state: null as { from?: string } | null,
  }
}

export function useParams<T extends Record<string, string> = Record<string, string>>() {
  return useNextParams() as T
}

export function Navigate({ to, replace = true }: { to: string; replace?: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (replace) router.replace(to)
    else router.push(to)
  }, [router, to, replace])
  return null
}

export { useSearchParams }
