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

export const franchiseProvisionSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  yearlyOrder: z.number().optional(),
  aov: z.number().optional(),
  monthPotential: z.number().optional(),
  thisMonth: z.number().optional(),
  changePct: z.number().optional(),
  lastOrder: z.string().optional(),
  email: z.string().email(),
  temporaryPassword: z.string().min(8),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export const devUserUpdateSchema = z.object({
  role: z.enum(["admin", "retailer", "super_admin"]),
  franchiseId: z.string().uuid().nullable(),
  active: z.boolean(),
})

export const devResetPasswordSchema = z.object({
  newPassword: z.string().min(8),
})

export const devUserCreateSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().optional(),
    role: z.enum(["admin", "retailer", "super_admin"]),
    franchiseId: z.string().uuid().nullable().optional(),
    mustChangePassword: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "retailer" && !data.franchiseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Retailer must be linked to a franchise",
        path: ["franchiseId"],
      })
    }
    if ((data.role === "admin" || data.role === "super_admin") && data.franchiseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Admin roles cannot have a franchise",
        path: ["franchiseId"],
      })
    }
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
