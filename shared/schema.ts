import { z } from "zod";

// Shared Zod schemas for the application
// Note: We are using Zod for validation across Frontend and Backend.
// Mongoose models will be defined in the backend to match these schemas.

// --- Categories ---
export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
});

export const insertCategorySchema = categorySchema.omit({ id: true });

// --- Products ---
export const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Medicine name is required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),

  // Pricing & Stock
  price: z.number().min(0, "Price must be positive").default(0), // Price per item (not per packet)
  stock: z.number().int().min(0, "Stock cannot be negative").default(0), // Stock in packets
  lowStockThreshold: z
    .number()
    .int()
    .min(0, "Threshold must be non-negative")
    .default(10),

  itemsPerPacket: z
    .number()
    .int()
    .min(1, "Items per packet must be at least 1")
    .default(1), // How many items in one packet

  // Variation Details (when unitType is packet)
  color: z.string().optional(),
  size: z.string().optional(),
  // Supplier Information
  supplierName: z.string().optional().default(""),
  supplierPhone: z.string().optional().default(""),
  supplierAddress: z.string().optional().default(""),

  sku: z.string().optional().default(""),
  image: z.string().optional().default(""),
  barcode: z
    .string()
    .min(12, "Valid EAN-13 barcode required")
    .or(z.literal("")),

  actualPrice: z.number().min(0).default(0), // Actual purchase price per item
});

const baseInsertProductSchema = productSchema.omit({ id: true });

export const insertProductSchema = baseInsertProductSchema.refine(
  (data) => {
    return true;
  },
  {
    message: "Variation products must have at least a color or size",
    path: ["color"],
  },
);

export const partialProductSchema = baseInsertProductSchema.partial();

// --- Bill Items ---
export const billItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  pricePerItem: z.number().min(0),
  itemsPerPacket: z.number().int().min(1),
  packetQuantity: z.number().int().min(1),
  discountPerItem: z.number().min(0).default(0), // Fixed discount per item
});

// --- Bills ---
export const billSchema = z.object({
  id: z.string(),
  billNumber: z.string(),
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string(),
  customerBusinessName: z.string().optional().default(""),
  customerCity: z.string().optional().default(""),
  customerAddress: z.string().optional().default(""),
  biltyNo: z.string().optional().default(""),
  remarks: z.string().optional().default(""),
  status: z.enum(["draft", "completed", "printed"]).default("draft"),
  items: z.array(billItemSchema),
  totalAmount: z.number().min(0),
  discountOnBill: z.number().min(0).default(0), // Fixed discount on entire bill
  notes: z.string().optional(),
  date: z.string().or(z.date()),
});

export const insertBillSchema = billSchema.omit({
  id: true,
  billNumber: true,
  date: true,
});

// --- Sales / Invoices (Legacy, keeping for backward compatibility) ---
export const saleItemSchema = z.object({
  productId: z.string(),
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
  productId: z.string(),
  quantity: z.number().int().positive(),
  date: z.string().or(z.date()),
  supplier: z.string().optional(),
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
});

export const insertSettingsSchema = settingsSchema.omit({ id: true });

// --- Exported Types ---
export type Category = z.infer<typeof categorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Medicine = z.infer<typeof productSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;

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
