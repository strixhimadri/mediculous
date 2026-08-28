"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FranchiseOrder } from "@/data/orders"

export type InvoiceForm = {
  billNumber: string
  billDate: string
  invoiceNote: string
  remark: string
}

function billDateToInput(date: string) {
  if (!date) return ""
  const match = date.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  return date
}

function inputToBillDate(value: string) {
  if (!value) return ""
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) return value
  return `${day}-${month}-${year}`
}

function formFromOrder(order: FranchiseOrder): InvoiceForm {
  return {
    billNumber: order.billNumber,
    billDate: billDateToInput(order.billDate),
    invoiceNote: order.invoiceNote ?? "",
    remark: order.remark ?? "",
  }
}

export function InvoiceDetailDialog({
  order,
  open,
  onOpenChange,
  onSave,
}: {
  order: FranchiseOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: InvoiceForm) => void
}) {
  const [form, setForm] = useState<InvoiceForm>({
    billNumber: "",
    billDate: "",
    invoiceNote: "",
    remark: "",
  })

  useEffect(() => {
    if (!order || !open) return
    setForm(formFromOrder(order))
  }, [order, open])

  function handleSave() {
    onSave(form)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b border-line px-6 py-4">
          <DialogTitle>Invoice Detail</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="invoice-number">Invoice Number</Label>
            <Input
              id="invoice-number"
              value={form.billNumber}
              onChange={(e) => setForm((f) => ({ ...f, billNumber: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invoice-date">Invoice Date</Label>
            <Input
              id="invoice-date"
              type="date"
              value={form.billDate}
              onChange={(e) => setForm((f) => ({ ...f, billDate: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invoice-note">Invoice Note</Label>
            <Input
              id="invoice-note"
              value={form.invoiceNote}
              onChange={(e) => setForm((f) => ({ ...f, invoiceNote: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invoice-remark">Remark</Label>
            <Input
              id="invoice-remark"
              value={form.remark}
              onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <Button type="button" variant="glass" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { inputToBillDate }
