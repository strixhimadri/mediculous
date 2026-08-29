import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  return { url, anonKey }
}

function isProtectedPath(path: string) {
  if (path === "/inventory/login") return false
  return path.startsWith("/app") || path.startsWith("/shop") || path.startsWith("/inventory")
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.includes("-auth-token"))
}

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv()
  if (!env) {
    return NextResponse.next({ request })
  }

  const path = request.nextUrl.pathname
  const authed = hasSupabaseAuthCookie(request)
  const isRscNav =
    request.headers.has("RSC") ||
    request.headers.has("Next-Router-Prefetch") ||
    request.headers.has("Next-Router-State-Tree")

  if (!authed) {
    if (isProtectedPath(path)) {
      const url = request.nextUrl.clone()
      url.pathname = path.startsWith("/inventory") ? "/inventory/login" : "/login"
      url.searchParams.set("redirect", path)
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

  if (isRscNav && isProtectedPath(path)) {
    return NextResponse.next({ request })
  }

  try {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user

    if (!user && isProtectedPath(path)) {
      const url = request.nextUrl.clone()
      url.pathname = path.startsWith("/inventory") ? "/inventory/login" : "/login"
      url.searchParams.set("redirect", path)
      return NextResponse.redirect(url)
    }

    if (user && path === "/inventory/login") {
      const url = request.nextUrl.clone()
      url.pathname = "/inventory"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error("[middleware] session update failed:", error)
    return NextResponse.next({ request })
  }
}
