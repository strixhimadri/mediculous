export type UserRole = "admin" | "retailer"
export type OrderStatus = "pending" | "approved" | "dispatched" | "rejected"

export type Profile = {
  id: string
  role: UserRole
  franchise_id: string | null
  display_name: string | null
  active: boolean
}

export type DbFranchise = {
  id: string
  name: string
  phone: string
  whatsapp: string
  yearly_order: number
  aov: number
  month_potential: number
  this_month: number
  change_pct: number
  last_order: string | null
  active: boolean
}

export type DbWholesalerStock = {
  id: string
  name: string
  brand: string | null
  sku: string
  hsn: string
  gst: number
  expiry: string
  buying_price: number
  selling_price: number
  pack_size: string
  batch: string
  shelf: string
  purchased: number
  sold: number
  qty_available: number
  qty_reserved: number
}

export type DbCatalogStock = Omit<DbWholesalerStock, "buying_price" | "qty_reserved" | "purchased" | "sold" | "shelf">

export type DbOrder = {
  id: string
  franchise_id: string
  status: OrderStatus
  bill_number: string
  bill_date: string | null
  invoice_note: string | null
  remark: string | null
  total_amount: number
  approved_at: string | null
  dispatched_at: string | null
  rejected_at: string | null
  created_at: string
}

export type DbOrderLine = {
  id: string
  order_id: string
  medicine_name: string
  quantity: number
  batch: string
  price_per_unit: number
  gst: number
  sort_order: number
}

export type DbRetailerInventory = {
  id: string
  franchise_id: string
  name: string
  brand: string | null
  batch: string
  expiry: string
  hsn: string
  gst: number
  pack_size: string
  shelf: string
  qty: number
  source_order_id: string | null
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      franchises: { Row: DbFranchise; Insert: Partial<DbFranchise>; Update: Partial<DbFranchise> }
      wholesaler_stock: { Row: DbWholesalerStock; Insert: Partial<DbWholesalerStock>; Update: Partial<DbWholesalerStock> }
      orders: { Row: DbOrder; Insert: Partial<DbOrder>; Update: Partial<DbOrder> }
      order_lines: { Row: DbOrderLine; Insert: Partial<DbOrderLine>; Update: Partial<DbOrderLine> }
      retailer_inventory: { Row: DbRetailerInventory; Insert: Partial<DbRetailerInventory>; Update: Partial<DbRetailerInventory> }
    }
    Views: {
      catalog_stock: { Row: DbCatalogStock }
    }
    Functions: {
      upsert_stock_batches: { Args: { rows: unknown }; Returns: number }
      submit_retailer_order: { Args: { lines: unknown }; Returns: string }
      approve_order: {
        Args: {
          p_order_id: string
          p_lines: unknown
          p_bill_number?: string
          p_bill_date?: string
          p_invoice_note?: string | null
        }
        Returns: void
      }
      dispatch_order: { Args: { p_order_id: string }; Returns: void }
      reject_order: { Args: { p_order_id: string; p_reason?: string | null }; Returns: void }
    }
  }
}
