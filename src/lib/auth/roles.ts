const CONSOLE_ROLES = new Set(["admin", "super_admin"])

export function getDeveloperAllowlist(): string[] {
  const raw = process.env.DEVELOPER_EMAIL_ALLOWLIST ?? ""
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAllowlistedDeveloper(email: string): boolean {
  const list = getDeveloperAllowlist()
  return list.length > 0 && list.includes(email.trim().toLowerCase())
}

export function isConsoleRole(role: string): boolean {
  return CONSOLE_ROLES.has(role)
}

export function isSuperAdminRole(role: string): boolean {
  return role === "super_admin"
}

function isSafeRedirect(
  path: string,
  user: { role: string; mustChangePassword: boolean },
): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false
  if (isConsoleRole(user.role)) return path.startsWith("/app")
  if (user.mustChangePassword) return path === "/shop/profile/setup"
  return path.startsWith("/shop") || path.startsWith("/inventory")
}

export function getPostLoginPath(
  user: { role: string; mustChangePassword: boolean },
  redirect?: string | null,
): string {
  if (redirect && isSafeRedirect(redirect, user)) return redirect
  if (isConsoleRole(user.role)) return "/app"
  if (user.mustChangePassword) return "/shop/profile/setup"
  return "/shop"
}
