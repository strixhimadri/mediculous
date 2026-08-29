"use client"

import { useCallback, useEffect, useState } from "react"
import { KeyRound, Loader2, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { PaginationBar } from "@/components/layout/PaginationBar"
import { TableShell, TableToolbar, usePagedRows } from "@/components/layout/TableShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAppState } from "@/context/AppState"
import { createDevUser, fetchDevUsers, resetDevUserPassword, updateDevUser } from "@/lib/api/http"
import { getRouteMeta } from "@/lib/routeMeta"
import type { UserRole } from "@/types/database"

type DevUser = {
  id: string
  email: string
  role: string
  franchiseId: string | null
  franchiseName: string | null
  displayName: string | null
  active: boolean
  mustChangePassword: boolean
}

const emptyCreateForm = {
  email: "",
  password: "",
  displayName: "",
  role: "retailer" as UserRole,
  franchiseId: "",
  mustChangePassword: true,
}

export function DevUsersPage() {
  const meta = getRouteMeta("/app/dev/users")
  const { franchises } = useAppState()
  const [users, setUsers] = useState<DevUser[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [editTarget, setEditTarget] = useState<DevUser | null>(null)
  const [resetTarget, setResetTarget] = useState<DevUser | null>(null)
  const [editRole, setEditRole] = useState<UserRole>("retailer")
  const [editActive, setEditActive] = useState(true)
  const [newPassword, setNewPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const page = usePagedRows(users, 25)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchDevUsers()
      setUsers(rows)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load users")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!editTarget) return
    setEditRole(editTarget.role as UserRole)
    setEditActive(editTarget.active)
  }, [editTarget])

  async function saveCreate() {
    if (!createForm.email.trim()) {
      toast.error("Email is required")
      return
    }
    if (createForm.password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (createForm.role === "retailer" && !createForm.franchiseId) {
      toast.error("Select a franchise for retailer accounts")
      return
    }

    setSaving(true)
    try {
      await createDevUser({
        email: createForm.email.trim().toLowerCase(),
        password: createForm.password,
        displayName: createForm.displayName.trim() || undefined,
        role: createForm.role,
        franchiseId: createForm.role === "retailer" ? createForm.franchiseId : null,
        mustChangePassword: createForm.role === "retailer" ? createForm.mustChangePassword : false,
      })
      toast.success(`User ${createForm.email} created`)
      setCreateForm(emptyCreateForm)
      setCreateOpen(false)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create user")
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit() {
    if (!editTarget) return
    setSaving(true)
    try {
      await updateDevUser(editTarget.id, {
        role: editRole,
        franchiseId: editTarget.franchiseId,
        active: editActive,
      })
      toast.success("User updated")
      setEditTarget(null)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed")
    } finally {
      setSaving(false)
    }
  }

  async function saveReset() {
    if (!resetTarget || newPassword.length < 8) return
    setSaving(true)
    try {
      await resetDevUserPassword(resetTarget.id, newPassword)
      toast.success("Password reset — user must change it on next login")
      setResetTarget(null)
      setNewPassword("")
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={meta.title}
        description={meta.description}
        crumbs={meta.crumbs}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Create user
          </Button>
        }
      />
      <TableShell
        toolbar={
          <TableToolbar
            pageSize={page.pageSize}
            onPageSize={page.setPageSize}
            query={page.query}
            onQuery={page.setQuery}
          />
        }
        footer={
          <PaginationBar
            page={page.page}
            pages={page.pages}
            from={(page.page - 1) * page.pageSize + (page.filtered.length ? 1 : 0)}
            to={Math.min(page.page * page.pageSize, page.filtered.length)}
            total={page.filtered.length}
            onPage={page.setPage}
          />
        }
      >
        <Table className="min-w-[880px]">
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Franchise</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="sticky right-0 w-28 bg-brand text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-ink-soft" />
                </TableCell>
              </TableRow>
            ) : page.slice.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-ink-soft">
                  No users yet. Create an account to get started.
                </TableCell>
              </TableRow>
            ) : (
              page.slice.map((row) => (
                <TableRow key={row.id} className="group">
                  <TableCell className="font-mono text-xs">{row.email}</TableCell>
                  <TableCell>{row.displayName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge tone={row.role === "super_admin" ? "day" : "glass"}>{row.role}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{row.franchiseName ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={row.active ? "day" : "rose"}>{row.active ? "Active" : "Inactive"}</Badge>
                      {row.mustChangePassword ? <Badge tone="hold">Must reset</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="sticky right-0 bg-white group-hover:bg-canvas">
                    <div className="flex justify-end gap-0.5">
                      <Button size="icon-sm" variant="glass" aria-label="Edit user" onClick={() => setEditTarget(row)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="glass"
                        aria-label="Reset password"
                        onClick={() => {
                          setResetTarget(row)
                          setNewPassword("")
                        }}
                      >
                        <KeyRound className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableShell>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>
              Create a Supabase auth account and assign a role. Retailers must be linked to a franchise.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                autoComplete="off"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Display name</Label>
              <Input
                id="create-name"
                value={createForm.displayName}
                onChange={(e) => setCreateForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, role: v as UserRole, franchiseId: "" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retailer">retailer</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="super_admin">super_admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createForm.role === "retailer" ? (
              <>
                <div className="space-y-1.5">
                  <Label>Franchise</Label>
                  {franchises.length === 0 ? (
                    <p className="text-sm text-ink-soft">
                      No franchises yet. Create one under List franchise first.
                    </p>
                  ) : (
                    <Select
                      value={createForm.franchiseId}
                      onValueChange={(v) => setCreateForm((f) => ({ ...f, franchiseId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select franchise" />
                      </SelectTrigger>
                      <SelectContent>
                        {franchises.map((franchise) => (
                          <SelectItem key={franchise.id} value={franchise.id}>
                            {franchise.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="create-must-reset"
                    type="checkbox"
                    checked={createForm.mustChangePassword}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, mustChangePassword: e.target.checked }))
                    }
                    className="size-4 rounded border-line"
                  />
                  <Label htmlFor="create-must-reset">Require password change on first login</Label>
                </div>
              </>
            ) : null}
            <Button className="w-full" onClick={() => void saveCreate()} disabled={saving}>
              {saving ? "Creating…" : "Create user"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editTarget?.email}</DialogTitle>
            <DialogDescription>Role and active status. Franchise links are set during provisioning.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retailer">retailer</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="super_admin">super_admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="active"
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="size-4 rounded border-line"
              />
              <Label htmlFor="active">Active</Label>
            </div>
            <Button className="w-full" onClick={() => void saveEdit()} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a temporary password for {resetTarget?.email}. They will be required to change it on login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-pw">New temporary password</Label>
              <Input
                id="reset-pw"
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={() => void saveReset()} disabled={saving || newPassword.length < 8}>
              {saving ? "Resetting…" : "Reset password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
