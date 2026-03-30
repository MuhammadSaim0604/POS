import {
  type Medicine,
  type InsertMedicine,
  type Category,
  type InsertCategory,
  type Sale,
  type InsertSale,
  type Restock,
  type InsertRestock,
  type Bill,
  type InsertBill,
  type Settings,
  type InsertSettings,
} from "@shared/schema";
import mongoose, { Schema, Document } from "mongoose";

// --- Mongoose Schemas ---

const CategorySchema = new Schema({
  name: { type: String, required: true },
});

const MedicineSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  barcode: { type: String, unique: true, sparse: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, default: 0 },          // full packets
  totalItemsInStock: { type: Number, default: 0, min: 0 },      // total individual items
  categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
  lowStockThreshold: { type: Number, default: 10, min: 0 },
  itemsPerPacket: { type: Number, default: 1, min: 1 },

  supplierName: { type: String },
  supplierPhone: { type: String },
  supplierAddress: { type: String },

  sku: { type: String },
  image: { type: String },
  actualPrice: { type: Number, default: 0 },
  expiryDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Bill items: qty = total individual items
const BillItemSchema = new Schema({
  medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: false, default: null },
  medicineName: { type: String, required: true },
  pricePerItem: { type: Number, required: true, min: 0 },
  itemsPerPacket: { type: Number, required: true, min: 1 },
  qty: { type: Number, required: true, min: 1 },            // total individual items
  discountPerItem: { type: Number, default: 0, min: 0 },
});

const BillSchema = new Schema({
  billNumber: { type: String, required: true, unique: true },
  customerName: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
  customerBusinessName: { type: String },
  customerCity: { type: String },
  customerAddress: { type: String },
  biltyNo: { type: String },
  remarks: { type: String },
  status: {
    type: String,
    enum: ["draft", "completed", "printed"],
    default: "draft",
  },
  items: [BillItemSchema],
  totalAmount: { type: Number, required: true, min: 0 },
  discountOnBill: { type: Number, default: 0, min: 0 },
  notes: { type: String },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const SaleItemSchema = new Schema({
  medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  priceAtSale: { type: Number, required: true },
});

const SaleSchema = new Schema({
  items: [SaleItemSchema],
  total: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const RestockSchema = new Schema({
  medicineId: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
  quantity: { type: Number, required: true, min: 1 },
  itemsPerPacket: { type: Number, min: 1 },
  date: { type: Date, default: Date.now },
  supplier: { type: String },
  price: { type: Number, min: 0 },
  actualPrice: { type: Number, min: 0 },
  expiryDate: { type: Date },
});

const SettingsSchema = new Schema({
  storeName: { type: String, default: "FB Collection" },
  storePhone: { type: String, default: "0301-7766395" },
  storeAddress: {
    type: String,
    default: "FB Collection, near Kabeer Brothers, Karor Pakka",
  },
  printAutomatically: { type: Boolean, default: true },
  invoiceFooter: { type: String, default: "Thank you for shopping with us!" },
  shortcutSearchMedicines: { type: String, default: "Ctrl+Z" },
  shortcutScanner: { type: String, default: "Ctrl+S" },
  shortcutCustomItem: { type: String, default: "Ctrl+C" },
  shortcutNewBill: { type: String, default: "Ctrl+Space" },
  shortcutCreateBill: { type: String, default: "Ctrl+Enter" },
  shortcutDiscount: { type: String, default: "Ctrl+D" },
  shortcutResetBill: { type: String, default: "Ctrl+R" },
  shortcutDraftBill: { type: String, default: "Ctrl+Shift+S" },
  shortcutGoToCreateBill: { type: String, default: "Ctrl+B" },
});

// medicines_db: pre-loaded pharmaceutical medicines directory
const MedicinesDbSchema = new Schema({
  name: { type: String, required: true },
  genericName: { type: String, default: "" },
  category: { type: String, default: "" },
  manufacturer: { type: String, default: "" },
  type: { type: String, default: "" }, // tablet, syrup, injection, etc.
  description: { type: String, default: "" },
  isActivated: { type: Boolean, default: false },
  activatedMedicineId: { type: String, default: null },
});

// --- Mongoose Models ---
const CategoryModel = mongoose.model("Category", CategorySchema);
const MedicineModel = mongoose.model("Medicine", MedicineSchema);
const MedicinesDbModel = mongoose.model("MedicinesDb", MedicinesDbSchema, "medicines_db");
const BillModel = mongoose.model("Bill", BillSchema);
const SaleModel = mongoose.model("Sale", SaleSchema);
const RestockModel = mongoose.model("Restock", RestockSchema);
const SettingsModel = mongoose.model("Settings", SettingsSchema);

// --- Storage Interface ---
export interface IStorage {
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  getMedicines(): Promise<Medicine[]>;
  getMedicine(id: string): Promise<Medicine | undefined>;
  getMedicineByBarcode(barcode: string): Promise<Medicine | undefined>;
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  updateMedicine(id: string, medicine: Partial<InsertMedicine>): Promise<Medicine | undefined>;
  deleteMedicine(id: string): Promise<void>;
  updateMedicineStock(id: string, quantityChange: number): Promise<void>;
  getLowStockMedicines(): Promise<Medicine[]>;

  getBills(): Promise<Bill[]>;
  getBill(id: string): Promise<Bill | undefined>;
  createBill(bill: InsertBill): Promise<Bill>;
  updateBill(id: string, bill: Partial<InsertBill>): Promise<Bill | undefined>;
  deleteBill(id: string): Promise<void>;
  updateBillStatus(id: string, status: "draft" | "completed" | "printed"): Promise<void>;

  getSales(): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;

  getRestocks(): Promise<Restock[]>;
  createRestock(restock: InsertRestock): Promise<Restock>;

  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;

  // medicines_db
  searchMedicinesDb(search?: string): Promise<any[]>;
  activateMedicineInDb(id: string, medicineId: string): Promise<void>;
  deactivateMedicineInDb(id: string): Promise<void>;
  getMedicinesDbCount(): Promise<number>;
}

// --- Helpers ---

function safeMedicineIdToString(id: any): string {
  if (!id) return "";
  try { return id.toString(); } catch { return ""; }
}

function mapBillItems(items: any[]): any[] {
  return items.map((i: any) => ({
    ...i,
    _id: undefined,
    medicineId: safeMedicineIdToString(i.medicineId),
    qty: i.qty ?? (i.packetQuantity ?? 1), // backward compat with old data
  }));
}

function preprocessBillItems(items: any[]): any[] {
  return items.map((item: any) => ({
    ...item,
    medicineId: item.medicineId && item.medicineId !== "" ? item.medicineId : undefined,
    qty: item.qty ?? 1,
  }));
}

function preprocessMedicine(medicine: any): any {
  const processed = { ...medicine };
  // Convert empty categoryId to undefined so Mongoose doesn't fail casting
  if (!processed.categoryId || processed.categoryId === "") {
    delete processed.categoryId;
  }
  // Convert empty barcode to undefined for sparse unique index
  if (!processed.barcode || processed.barcode === "") {
    delete processed.barcode;
  }
  return processed;
}

function mapMedicine(obj: any): Medicine {
  const itemsPerPacket = obj.itemsPerPacket || 1;
  const stock = obj.stock || 0;
  // If totalItemsInStock is not set or 0, calculate from stock * itemsPerPacket
  const totalItemsInStock = obj.totalItemsInStock > 0
    ? obj.totalItemsInStock
    : stock * itemsPerPacket;
  return {
    ...obj,
    id: obj._id.toString(),
    categoryId: obj.categoryId ? obj.categoryId.toString() : "",
    totalItemsInStock,
    itemsPerPacket,
    stock,
  } as unknown as Medicine;
}

export class MongoStorage implements IStorage {
  private mapDoc<T>(doc: any): T {
    const { _id, __v, ...rest } = doc.toObject();
    return { id: _id.toString(), ...rest } as T;
  }

  // Deduct qty items from medicine's totalItemsInStock, recalculate full packets in stock
  private async deductStockFromBillItems(
    items: any[],
    session: mongoose.ClientSession,
  ): Promise<void> {
    for (const item of items) {
      if (!item.medicineId) continue;
      const qty = item.qty ?? 1;
      const medicine = await MedicineModel.findById(item.medicineId).session(session);
      if (!medicine) continue;
      const itemsPerPacket = medicine.itemsPerPacket || 1;
      const currentTotal = medicine.totalItemsInStock > 0
        ? medicine.totalItemsInStock
        : (medicine.stock * itemsPerPacket);
      const newTotal = Math.max(0, currentTotal - qty);
      const newStock = Math.floor(newTotal / itemsPerPacket);
      await MedicineModel.findByIdAndUpdate(
        item.medicineId,
        { totalItemsInStock: newTotal, stock: newStock },
        { session },
      );
    }
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const cats = await CategoryModel.find();
    return cats.map((c) => this.mapDoc<Category>(c));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCat = await CategoryModel.create(category);
    return this.mapDoc<Category>(newCat);
  }

  async deleteCategory(id: string): Promise<void> {
    await CategoryModel.findByIdAndDelete(id);
  }

  // Medicines
  async getMedicines(): Promise<Medicine[]> {
    const medicines = await MedicineModel.find();
    return medicines.map((p) => mapMedicine(p.toObject()));
  }

  async getMedicine(id: string): Promise<Medicine | undefined> {
    const p = await MedicineModel.findById(id);
    if (!p) return undefined;
    return mapMedicine(p.toObject());
  }

  async getMedicineByBarcode(barcode: string): Promise<Medicine | undefined> {
    const p = await MedicineModel.findOne({ barcode });
    if (!p) return undefined;
    return mapMedicine(p.toObject());
  }

  async createMedicine(medicine: InsertMedicine): Promise<Medicine> {
    const processed = preprocessMedicine(medicine);
    const itemsPerPacket = processed.itemsPerPacket || 1;
    const stock = processed.stock || 0;
    // Auto-calculate totalItemsInStock
    if (!processed.totalItemsInStock || processed.totalItemsInStock === 0) {
      processed.totalItemsInStock = stock * itemsPerPacket;
    }
    const newMedicine = await MedicineModel.create(processed);
    return mapMedicine(newMedicine.toObject());
  }

  async updateMedicine(id: string, updates: Partial<InsertMedicine>): Promise<Medicine | undefined> {
    const processed = preprocessMedicine(updates);
    // If stock or itemsPerPacket is being updated, recalculate totalItemsInStock
    if ((processed.stock !== undefined || processed.itemsPerPacket !== undefined)) {
      const current = await MedicineModel.findById(id);
      if (current) {
        const newStock = processed.stock ?? current.stock;
        const newIPP = processed.itemsPerPacket ?? current.itemsPerPacket ?? 1;
        // Only recalculate if not explicitly provided
        if (processed.totalItemsInStock === undefined || processed.totalItemsInStock === 0) {
          processed.totalItemsInStock = newStock * newIPP;
        }
      }
    }
    const updated = await MedicineModel.findByIdAndUpdate(id, processed, { new: true });
    if (!updated) return undefined;
    return mapMedicine(updated.toObject());
  }

  async deleteMedicine(id: string): Promise<void> {
    await MedicineModel.findByIdAndDelete(id);
  }

  async updateMedicineStock(id: string, quantityChange: number): Promise<void> {
    // quantityChange = number of packets
    const medicine = await MedicineModel.findById(id);
    if (!medicine) return;
    const itemsPerPacket = medicine.itemsPerPacket || 1;
    const currentTotal = medicine.totalItemsInStock > 0
      ? medicine.totalItemsInStock
      : (medicine.stock * itemsPerPacket);
    const newTotal = Math.max(0, currentTotal + quantityChange * itemsPerPacket);
    const newStock = Math.floor(newTotal / itemsPerPacket);
    await MedicineModel.findByIdAndUpdate(id, {
      totalItemsInStock: newTotal,
      stock: newStock,
    });
  }

  async getLowStockMedicines(): Promise<Medicine[]> {
    const medicines = await MedicineModel.find({
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    });
    return medicines.map((p) => mapMedicine(p.toObject()));
  }

  // Bills
  async getBills(): Promise<Bill[]> {
    const bills = await BillModel.find().sort({ date: -1 });
    return bills.map((b) => {
      const obj = b.toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        date: obj.date.toISOString(),
        items: mapBillItems(obj.items),
      } as unknown as Bill;
    });
  }

  async getBill(id: string): Promise<Bill | undefined> {
    const b = await BillModel.findById(id);
    if (!b) return undefined;
    const obj = b.toObject();
    return {
      ...obj,
      id: obj._id.toString(),
      date: obj.date.toISOString(),
      items: mapBillItems(obj.items),
    } as unknown as Bill;
  }

  async createBill(bill: InsertBill): Promise<Bill> {
    const billNumber = `BILL-${Date.now()}`;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const processedItems = preprocessBillItems(bill.items);
      if (bill.status === "completed" || bill.status === "printed") {
        await this.deductStockFromBillItems(processedItems, session);
      }
      const newBill = await BillModel.create(
        [{ ...bill, billNumber, items: processedItems }],
        { session },
      );
      await session.commitTransaction();
      const obj = newBill[0].toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        date: obj.date.toISOString(),
        items: mapBillItems(obj.items),
      } as unknown as Bill;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateBill(id: string, updates: Partial<InsertBill>): Promise<Bill | undefined> {
    const bill = await BillModel.findById(id);
    if (!bill) return undefined;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const processedItems = updates.items ? preprocessBillItems(updates.items) : undefined;
      const processedUpdates = processedItems ? { ...updates, items: processedItems } : updates;

      if (
        (updates.status === "completed" || updates.status === "printed") &&
        bill.status !== "completed" && bill.status !== "printed"
      ) {
        const itemsToDeduct = processedItems || bill.items;
        await this.deductStockFromBillItems(itemsToDeduct, session);
      }

      const updated = await BillModel.findByIdAndUpdate(id, processedUpdates, {
        new: true,
        session,
      });
      if (!updated) { await session.abortTransaction(); return undefined; }

      await session.commitTransaction();
      const obj = updated.toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        date: obj.date.toISOString(),
        items: mapBillItems(obj.items),
      } as unknown as Bill;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async deleteBill(id: string): Promise<void> {
    await BillModel.findByIdAndDelete(id);
  }

  async updateBillStatus(id: string, status: "draft" | "completed" | "printed"): Promise<void> {
    const bill = await BillModel.findById(id);
    if (!bill) return;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      if (
        (status === "completed" || status === "printed") &&
        bill.status !== "completed" && bill.status !== "printed"
      ) {
        await this.deductStockFromBillItems(bill.items, session);
      }
      await BillModel.findByIdAndUpdate(id, { status }, { session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Sales
  async getSales(): Promise<Sale[]> {
    const bills = await BillModel.find({ status: { $in: ["completed", "printed"] } }).sort({ date: -1 });
    return bills.map((b) => {
      const obj = b.toObject();
      return {
        id: obj._id.toString(),
        date: obj.date.toISOString(),
        total: obj.totalAmount,
        items: obj.items
          .filter((i: any) => i.medicineId)
          .map((i: any) => ({
            medicineId: safeMedicineIdToString(i.medicineId),
            name: i.medicineName,
            quantity: i.qty ?? 1,
            priceAtSale: i.pricePerItem,
          })),
      } as unknown as Sale;
    });
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const newSale = await SaleModel.create([sale], { session });
      for (const item of sale.items) {
        await MedicineModel.findByIdAndUpdate(
          item.medicineId,
          { $inc: { stock: -item.quantity } },
          { session },
        );
      }
      await session.commitTransaction();
      const obj = newSale[0].toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        date: obj.date.toISOString(),
        items: obj.items.map((i: any) => ({
          ...i,
          medicineId: safeMedicineIdToString(i.medicineId),
        })),
      } as unknown as Sale;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Restock
  async getRestocks(): Promise<Restock[]> {
    const restocks = await RestockModel.find().sort({ date: -1 });
    return restocks.map((r) => {
      const obj = r.toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        date: obj.date.toISOString(),
        medicineId: obj.medicineId.toString(),
      } as unknown as Restock;
    });
  }

  async createRestock(restock: InsertRestock): Promise<Restock> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const newRestock = await RestockModel.create([restock], { session });
      const medicine = await MedicineModel.findById(restock.medicineId).session(session);
      if (medicine) {
        // DB itemsPerPacket is the authoritative packing unit — NEVER overwritten
        const dbItemsPerPacket = medicine.itemsPerPacket || 1;
        // Use form-provided itemsPerPacket for calculating how many items were received.
        // If not provided, fall back to DB value.
        const formItemsPerPacket = restock.itemsPerPacket && restock.itemsPerPacket > 0
          ? restock.itemsPerPacket
          : dbItemsPerPacket;

        const currentTotal = medicine.totalItemsInStock > 0
          ? medicine.totalItemsInStock
          : (medicine.stock * dbItemsPerPacket);

        // Items to add = packets received × itemsPerPacket from form (for calculation only)
        const addedItems = restock.quantity * formItemsPerPacket;
        const newTotal = currentTotal + addedItems;
        // Recalculate full packets using DB's itemsPerPacket
        const newStock = Math.floor(newTotal / dbItemsPerPacket);

        // Build medicine update: stock fields always updated; price/supplier/expiry replace if provided
        const medicineUpdate: any = {
          totalItemsInStock: newTotal,
          stock: newStock,
        };
        if (restock.price !== undefined && restock.price >= 0) {
          medicineUpdate.price = restock.price;
        }
        if (restock.actualPrice !== undefined && restock.actualPrice >= 0) {
          medicineUpdate.actualPrice = restock.actualPrice;
        }
        if (restock.supplier !== undefined && restock.supplier !== "") {
          medicineUpdate.supplierName = restock.supplier;
        }
        if (restock.expiryDate !== undefined && restock.expiryDate !== "") {
          medicineUpdate.expiryDate = new Date(restock.expiryDate);
        }

        await MedicineModel.findByIdAndUpdate(
          restock.medicineId,
          medicineUpdate,
          { session },
        );
      }
      await session.commitTransaction();
      const obj = newRestock[0].toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        date: obj.date.toISOString(),
        medicineId: obj.medicineId.toString(),
      } as unknown as Restock;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Settings
  async getSettings(): Promise<Settings> {
    const settings = await SettingsModel.findOne();
    if (!settings) {
      const defaultSettings = await SettingsModel.create({});
      return this.mapDoc<Settings>(defaultSettings);
    }
    return this.mapDoc<Settings>(settings);
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<Settings> {
    const settings = await SettingsModel.findOneAndUpdate({}, updates, {
      new: true,
      upsert: true,
    });
    return this.mapDoc<Settings>(settings);
  }

  // medicines_db methods
  async searchMedicinesDb(search?: string): Promise<any[]> {
    let query: any = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query = { $or: [{ name: regex }, { genericName: regex }, { category: regex }, { manufacturer: regex }] };
    }
    const results = await MedicinesDbModel.find(query).limit(100).sort({ name: 1 });
    return results.map((r) => {
      const obj = r.toObject();
      return { ...obj, id: obj._id.toString(), _id: undefined };
    });
  }

  async activateMedicineInDb(id: string, medicineId: string): Promise<void> {
    await MedicinesDbModel.findByIdAndUpdate(id, { isActivated: true, activatedMedicineId: medicineId });
  }

  async deactivateMedicineInDb(id: string): Promise<void> {
    await MedicinesDbModel.findByIdAndUpdate(id, { isActivated: false, activatedMedicineId: null });
  }

  async getMedicinesDbCount(): Promise<number> {
    return await MedicinesDbModel.countDocuments();
  }
}

export const storage = new MongoStorage();
export { MedicinesDbModel };
