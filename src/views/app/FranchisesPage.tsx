"use client"

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { Download, ExternalLink, Loader2, MessageCircle, Pencil, Plus, Trash2, TrendingDown, TrendingUp, Upload, UserRound } from "lucide-react"
import { toast } from "sonner"
import type { Franchise } from "@/data/franchises"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableShell, TableToolbar, usePagedRows } from "@/components/layout/TableShell"
import { PaginationBar } from "@/components/layout/PaginationBar"
import { PageHeader } from "@/components/layout/PageHeader"
import { useAppState } from "@/context/AppState"
import { formatInr, relativeFrom } from "@/lib/format"
import {
  createFranchiseDraft,
  exportFranchiseSpreadsheet,
  FRANCHISE_IMPORT_HEADERS,
  importFranchiseFile,
} from "@/lib/franchiseImport"
import { getRouteMeta } from "@/lib/routeMeta"

type FranchiseForm = {
  name: string
  phone: string
  yearlyOrder: string
  aov: string
  monthPotential: string
  thisMonth: string
  changePct: string
  lastOrder: string
  whatsapp: string
}

const emptyForm: FranchiseForm = {
  name: "",
  phone: "",
  yearlyOrder: "",
  aov: "",
  monthPotential: "",
  thisMonth: "",
  changePct: "",
  lastOrder: "",
  whatsapp: "",
}

function franchiseToForm(row: Franchise): FranchiseForm {
  return {
    name: row.name,
    phone: row.phone === "—" ? "" : row.phone,
    yearlyOrder: String(row.yearlyOrder || ""),
    aov: String(row.aov || ""),
    monthPotential: String(row.monthPotential || ""),
    thisMonth: String(row.thisMonth || ""),
    changePct: String(row.changePct || ""),
    lastOrder: row.lastOrder ? row.lastOrder.slice(0, 10) : "",
    whatsapp: row.whatsapp,
  }
}

function FranchiseFormFields({
  form,
  setForm,
  idPrefix,
}: {
  form: FranchiseForm
  setForm: Dispatch<SetStateAction<FranchiseForm>>
  idPrefix: string
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-name`}>Franchise name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-phone`}>Contact</Label>
        <Input
          id={`${idPrefix}-phone`}
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-whatsapp`}>WhatsApp</Label>
        <Input
          id={`${idPrefix}-whatsapp`}
          placeholder="Optional — defaults from contact"
          value={form.whatsapp}
          onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-yearly`}>Last 1 year order</Label>
        <Input
          id={`${idPrefix}-yearly`}
          type="number"
          value={form.yearlyOrder}
          onChange={(e) => setForm((f) => ({ ...f, yearlyOrder: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-aov`}>AOV</Label>
        <Input
          id={`${idPrefix}-aov`}
          type="number"
          value={form.aov}
          onChange={(e) => setForm((f) => ({ ...f, aov: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-potential`}>Month potential</Label>
        <Input
          id={`${idPrefix}-potential`}
          type="number"
          value={form.monthPotential}
          onChange={(e) => setForm((f) => ({ ...f, monthPotential: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-this-month`}>This month</Label>
        <Input
          id={`${idPrefix}-this-month`}
          type="number"
          value={form.thisMonth}
          onChange={(e) => setForm((f) => ({ ...f, thisMonth: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-change`}>Change %</Label>
        <Input
          id={`${idPrefix}-change`}
          type="number"
          value={form.changePct}
          onChange={(e) => setForm((f) => ({ ...f, changePct: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-last-order`}>Last order date</Label>
        <Input
          id={`${idPrefix}-last-order`}
          type="date"
          value={form.lastOrder}
          onChange={(e) => setForm((f) => ({ ...f, lastOrder: e.target.value }))}
        />
      </div>
    </div>
  )
}

export function FranchisesPage() {
  const { franchises, addFranchise, updateFranchise, removeFranchise, importFranchises } = useAppState()
  const page = usePagedRows(franchises, 25)
  const meta = getRouteMeta("/app/franchises")
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Franchise | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Franchise | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editTarget) setEditForm(franchiseToForm(editTarget))
  }, [editTarget])

  async function handleUpload(file: File) {
    setImporting(true)
    try {
      const parsed = await importFranchiseFile(file)
      if (!parsed.length) {
        throw new Error("No franchise rows found. Check column headers in your file.")
      }
      await importFranchises(parsed)
      toast.success(`Imported ${parsed.length} franchises from ${file.name}`)
      setUploadOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not import franchise file"
      toast.error(message)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function saveFranchiseFromForm(formData: FranchiseForm, mode: "add" | "edit") {
    if (!formData.name.trim()) {
      toast.error("Franchise name is required")
      return
    }
    const draft = createFranchiseDraft({
      name: formData.name,
      phone: formData.phone,
      yearlyOrder: formData.yearlyOrder,
      aov: formData.aov,
      monthPotential: formData.monthPotential,
      thisMonth: formData.thisMonth,
      changePct: formData.changePct,
      lastOrder: formData.lastOrder || new Date().toISOString(),
      whatsapp: formData.whatsapp,
    })
    if (mode === "add") {
      void addFranchise(draft).then(() => {
        setForm(emptyForm)
        setAddOpen(false)
        toast.success("Franchise added")
      })
      return
    }
    if (!editTarget) return
    void updateFranchise(editTarget.id, draft).then(() => {
      setEditTarget(null)
      toast.success("Franchise updated")
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    void removeFranchise(deleteTarget.id).then(() => {
      toast.success(`${deleteTarget.name} removed`)
      setDeleteTarget(null)
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={meta.title}
        description={meta.description}
        crumbs={meta.crumbs}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                exportFranchiseSpreadsheet(franchises)
                toast.success(franchises.length ? "Franchise list exported" : "Template downloaded")
              }}
            >
              <Download className="size-4" /> Export list
            </Button>
            <Button variant="outline" onClick={() => setUploadOpen(true)}>
              <Upload className="size-4" /> Upload list
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="size-4" /> Add franchise
            </Button>
          </div>
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
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow>
              <TableHead>S No</TableHead>
              <TableHead>Franchise name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Last 1 year order</TableHead>
              <TableHead>AOV</TableHead>
              <TableHead>Month potential</TableHead>
              <TableHead>This month</TableHead>
              <TableHead>Last order date</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="sticky right-0 w-24 bg-brand text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.slice.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-center">
                  <p className="font-medium text-ink">No franchises yet</p>
                  <p className="mt-2 text-sm text-ink-soft">
                    Add a franchise manually or upload an Excel/PDF list.
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Button variant="outline" onClick={() => setUploadOpen(true)}>
                      <Upload className="size-4" /> Upload list
                    </Button>
                    <Button onClick={() => setAddOpen(true)}>
                      <Plus className="size-4" /> Add franchise
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              page.slice.map((row, i) => {
                const up = row.changePct >= 0
                return (
                  <TableRow key={row.id} className="group">
                    <TableCell className="font-mono text-xs">{(page.page - 1) * page.pageSize + i + 1}</TableCell>
                    <TableCell>
                      <p className="flex items-center gap-2 font-medium">
                        <UserRound className="size-4 text-navy" />
                        {row.name}
                        <ExternalLink className="size-3.5 text-ink-soft" />
                      </p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.phone}</TableCell>
                    <TableCell className="font-mono text-xs">{formatInr(row.yearlyOrder)}</TableCell>
                    <TableCell className="font-mono text-xs">{formatInr(row.aov)}</TableCell>
                    <TableCell className="font-mono text-xs">{formatInr(row.monthPotential)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs">{formatInr(row.thisMonth)}</span>
                        <Badge tone={up ? "day" : "rose"}>
                          {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                          {up ? "↑" : "↓"} {Math.abs(row.changePct).toFixed(2)}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs">{new Date(row.lastOrder).toLocaleDateString("en-IN")}</p>
                      <p className="text-xs text-steel">{relativeFrom(row.lastOrder)}</p>
                    </TableCell>
                    <TableCell>
                      <a
                        className="inline-flex size-9 items-center justify-center rounded-md bg-[#25D366] text-white"
                        href={`https://wa.me/${row.whatsapp}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`WhatsApp ${row.name}`}
                      >
                        <MessageCircle className="size-4" />
                      </a>
                    </TableCell>
                    <TableCell className="sticky right-0 bg-white group-hover:bg-canvas">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button size="icon-sm" variant="glass" aria-label="Edit franchise" onClick={() => setEditTarget(row)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button size="icon-sm" variant="glass" aria-label="Delete franchise" onClick={() => setDeleteTarget(row)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableShell>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add franchise</DialogTitle>
            <DialogDescription>Enter partner details for the demonstration franchise list.</DialogDescription>
          </DialogHeader>
          <FranchiseFormFields form={form} setForm={setForm} idPrefix="add" />
          <Button className="w-full" onClick={() => saveFranchiseFromForm(form, "add")}>
            Save franchise
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit franchise</DialogTitle>
            <DialogDescription>Update partner details for {editTarget?.name}.</DialogDescription>
          </DialogHeader>
          <FranchiseFormFields form={editForm} setForm={setEditForm} idPrefix="edit" />
          <Button className="w-full" onClick={() => saveFranchiseFromForm(editForm, "edit")}>
            Save changes
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {deleteTarget?.name}?</DialogTitle>
            <DialogDescription>This removes the franchise from the list for this session.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="glass" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Remove franchise
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload franchise list</DialogTitle>
            <DialogDescription>
              Import partners from Excel (.xlsx, .xls, .csv) or PDF. This replaces the current franchise
              list for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-canvas px-4 py-3 text-xs text-ink-soft">
              <p className="font-medium text-ink">Expected columns</p>
              <p className="mt-1">{FRANCHISE_IMPORT_HEADERS.join(" · ")}</p>
            </div>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-line bg-canvas px-4 py-10 text-sm text-steel transition-colors hover:border-brand hover:bg-white">
              {importing ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
              {importing ? "Analyzing file…" : "Drop Excel/PDF here, or click to choose"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf,application/pdf"
                className="hidden"
                disabled={importing}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleUpload(file)
                }}
              />
            </label>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                exportFranchiseSpreadsheet(franchises)
                toast.success(franchises.length ? "Franchise list downloaded" : "Template downloaded")
              }}
            >
              <Download className="size-4" /> Download Excel template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
