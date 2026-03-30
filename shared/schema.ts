import { z } from "zod";

// Shared Zod schemas for the application

// --- Categories ---
export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
});

export const insertCategorySchema = categorySchema.omit({ id: true });

// --- Medicines ---
export const medicineSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Medicine name is required"),
  description: z.string().optional(),
  categoryId: z.string().optional().or(z.literal("")),

  // Pricing & Stock
  price: z.number({
    required_error: "Price is required",
    invalid_type_error: "Price must be a number",
  }).min(0, "Price must be non-negative"),

  actualPrice: z.number().min(0).default(0),

  // stock = full packets in stock
  stock: z.number({
    required_error: "Stock is required",
    invalid_type_error: "Stock must be a number",
  }).min(0, "Stock cannot be negative"),

  // totalItemsInStock = total individual items (stock * itemsPerPacket + partial items)
  totalItemsInStock: z.number().int().min(0).default(0),

  lowStockThreshold: z
    .number()
    .int()
    .min(0, "Threshold must be non-negative")
    .default(10),

  itemsPerPacket: z
    .number()
    .int()
    .min(1, "Items per packet must be at least 1")
    .default(1),

  // Supplier Information
  supplierName: z.string().optional().default(""),
  supplierPhone: z.string().optional().default(""),
  supplierAddress: z.string().optional().default(""),

  sku: z.string().optional().default(""),
  image: z.string().optional().default(""),
  barcode: z.string().optional().or(z.literal("")).optional(),

  expiryDate: z.string().or(z.date()).optional(),
});

const baseInsertMedicineSchema = medicineSchema.omit({ id: true });

export const insertMedicineSchema = baseInsertMedicineSchema.refine(
  () => true,
  {
    message: "Invalid medicine data",
    path: ["name"],
  },
);

export const partialMedicineSchema = baseInsertMedicineSchema.partial();

// --- Bill Items ---
// qty = total individual items (e.g. 5 tablets, not 1 packet of 10)
export const billItemSchema = z.object({
  medicineId: z.string().optional().default(""),
  medicineName: z.string(),
  pricePerItem: z.number().min(0),
  itemsPerPacket: z.number().int().min(1),
  qty: z.number().int().min(1),          // total individual items
  discountPerItem: z.number().min(0).default(0),
});

// --- Bills ---
export const billSchema = z.object({
  id: z.string(),
  billNumber: z.string(),
  customerName: z.string().optional().default(""),
  customerPhone: z.string().optional().default(""),
  customerBusinessName: z.string().optional().default(""),
  customerCity: z.string().optional().default(""),
  customerAddress: z.string().optional().default(""),
  biltyNo: z.string().optional().default(""),
  remarks: z.string().optional().default(""),
  status: z.enum(["draft", "completed", "printed"]).default("draft"),
  items: z.array(billItemSchema),
  totalAmount: z.number().min(0),
  discountOnBill: z.number().min(0).default(0),
  notes: z.string().optional(),
  date: z.string().or(z.date()),
});

export const insertBillSchema = billSchema.omit({
  id: true,
  billNumber: true,
  date: true,
});

// --- Sales / Invoices ---
export const saleItemSchema = z.object({
  medicineId: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  priceAtSale: z.number(),
});

export const saleSchema = z.object({
  id: z.string(),
  items: z.array(saleItemSchema),
  total: z.number(),
  date: z.string().or(z.date()),
});

export const insertSaleSchema = saleSchema.omit({ id: true, date: true });

// --- Restock / Purchases ---
export const restockSchema = z.object({
  id: z.string(),
  medicineId: z.string(),
  quantity: z.number().int().positive(),
  // itemsPerPacket provided in restock form — used ONLY for calculation, NOT stored in medicine
  itemsPerPacket: z.number().int().min(1).optional(),
  date: z.string().or(z.date()),
  supplier: z.string().optional(),
  // These fields replace the medicine's DB values on restock
  price: z.number().min(0).optional(),
  actualPrice: z.number().min(0).optional(),
  expiryDate: z.string().optional(),
});

export const insertRestockSchema = restockSchema.omit({ id: true, date: true });

// --- Settings ---
export const settingsSchema = z.object({
  id: z.string(),
  storeName: z.string().default("FB Collection"),
  storePhone: z.string().default("0301-7766395"),
  storeAddress: z
    .string()
    .default("FB Collection, near Kabeer Brothers, Karor Pakka"),
  printAutomatically: z.boolean().default(true),
  invoiceFooter: z.string().default("Thank you for shopping with us!"),
  // Keyboard Shortcuts
  shortcutSearchMedicines: z.string().default("Ctrl+Z"),
  shortcutScanner: z.string().default("Ctrl+S"),
  shortcutCustomItem: z.string().default("Ctrl+C"),
  shortcutNewBill: z.string().default("Ctrl+Space"),
  shortcutCreateBill: z.string().default("Ctrl+Enter"),
  shortcutDiscount: z.string().default("Ctrl+D"),
  shortcutResetBill: z.string().default("Ctrl+R"),
  shortcutDraftBill: z.string().default("Ctrl+Shift+S"),
  shortcutGoToCreateBill: z.string().default("Ctrl+B"),
});

export const insertSettingsSchema = settingsSchema.omit({ id: true });

// --- Exported Types ---
export type Category = z.infer<typeof categorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Medicine = z.infer<typeof medicineSchema>;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;

export type BillItem = z.infer<typeof billItemSchema>;
export type Bill = z.infer<typeof billSchema>;
export type InsertBill = z.infer<typeof insertBillSchema>;

export type SaleItem = z.infer<typeof saleItemSchema>;
export type Sale = z.infer<typeof saleSchema>;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type Restock = z.infer<typeof restockSchema>;
export type InsertRestock = z.infer<typeof insertRestockSchema>;

export type Settings = z.infer<typeof settingsSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// --- Stock Display Helper ---
export function formatStock(totalItemsInStock: number, itemsPerPacket: number): string {
  const packets = Math.floor(totalItemsInStock / itemsPerPacket);
  const remaining = totalItemsInStock % itemsPerPacket;
  if (itemsPerPacket === 1) return `${totalItemsInStock}`;
  if (remaining === 0) return `${packets} pkts`;
  return `${packets} pkts ${remaining} items`;
}
