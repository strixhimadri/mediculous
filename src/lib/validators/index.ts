import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const shelfSchema = z.object({
  shelf: z.string().min(1),
})

export const qtySchema = z.object({
  qty: z.number().int().min(0),
})

export const stockUpsertSchema = z.object({
  rows: z.array(z.record(z.unknown())).min(1),
})

export const orderSubmitSchema = z.object({
  lines: z
    .array(
      z.object({
        medicineName: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
})

export const orderMetaSchema = z.object({
  billNumber: z.string().optional(),
  invoiceNote: z.string().optional(),
  remark: z.string().optional(),
  billDate: z.string().optional(),
})

export const orderApproveSchema = z.object({
  lines: z.array(z.record(z.unknown())),
  billNumber: z.string().optional(),
  billDate: z.string().optional(),
  invoiceNote: z.string().optional(),
})

export const orderRejectSchema = z.object({
  reason: z.string().optional(),
})

export const orderLineSchema = z.object({
  medicineName: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  batch: z.string().optional(),
  pricePerUnit: z.number().optional(),
  gst: z.number().optional(),
})

export const franchiseSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  yearlyOrder: z.number().optional(),
  aov: z.number().optional(),
  monthPotential: z.number().optional(),
  thisMonth: z.number().optional(),
  changePct: z.number().optional(),
  lastOrder: z.string().optional(),
})
