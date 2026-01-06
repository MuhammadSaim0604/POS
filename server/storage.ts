import {
  type Product,
  type InsertProduct,
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

const ProductSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  article: { type: String, default: "" },
  barcode: { type: String, required: true, unique: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, default: 0 },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  lowStockThreshold: { type: Number, default: 10, min: 0 },

  // Variation Support
  isVariation: { type: Boolean, default: false },
  parentProductId: { type: Schema.Types.ObjectId, ref: "Product" },

  // Packet/Box Information
  unitType: { type: String, enum: ["single", "packet"], default: "single" },
  itemsPerPacket: { type: Number, default: 1, min: 1 },

  // Variation Details
  color: { type: String },
  size: { type: String },

  // Supplier Information
  supplierName: { type: String },
  supplierPhone: { type: String },
  supplierAddress: { type: String },

  // Additional fields
  sku: { type: String },
  image: { type: String },
  image: { type: String },
  actualPrice: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const BillItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  color: { type: String },
  size: { type: String },
  pricePerItem: { type: Number, required: true, min: 0 },
  itemsPerPacket: { type: Number, required: true, min: 1 },
  packetQuantity: { type: Number, required: true, min: 1 },
  discountPerItem: { type: Number, default: 0, min: 0 },
});

const BillSchema = new Schema({
  billNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
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
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
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
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  date: { type: Date, default: Date.now },
  supplier: { type: String },
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
});

// --- Mongoose Models ---
const CategoryModel = mongoose.model("Category", CategorySchema);
const ProductModel = mongoose.model("Product", ProductSchema);
const BillModel = mongoose.model("Bill", BillSchema);
const SaleModel = mongoose.model("Sale", SaleSchema);
const RestockModel = mongoose.model("Restock", RestockSchema);
const SettingsModel = mongoose.model("Settings", SettingsSchema);

// --- Storage Interface ---

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: string,
    product: Partial<InsertProduct>,
  ): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  updateProductStock(id: string, quantityChange: number): Promise<void>;
  getLowStockProducts(): Promise<Product[]>;

  // Bills
  getBills(): Promise<Bill[]>;
  getBill(id: string): Promise<Bill | undefined>;
  createBill(bill: InsertBill): Promise<Bill>;
  updateBill(id: string, bill: Partial<InsertBill>): Promise<Bill | undefined>;
  deleteBill(id: string): Promise<void>;
  updateBillStatus(
    id: string,
    status: "draft" | "completed" | "printed",
  ): Promise<void>;

  // Sales
  getSales(): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;

  // Restock
  getRestocks(): Promise<Restock[]>;
  createRestock(restock: InsertRestock): Promise<Restock>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
}

export class MongoStorage implements IStorage {
  // Helper to map _id to id
  private mapDoc<T>(doc: any): T {
    const { _id, __v, ...rest } = doc.toObject();
    return { id: _id.toString(), ...rest } as T;
  }

  private async deductStockFromBillItems(
    items: any[],
    session: mongoose.ClientSession,
  ): Promise<void> {
    for (const item of items) {
      // Deduct packets from stock (packetQuantity = number of packets sold)
      await ProductModel.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.packetQuantity } },
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

  // Products
  async getProducts(): Promise<Product[]> {
    const products = await ProductModel.find();
    return products.map((p) => {
      const obj = p.toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        categoryId: obj.categoryId.toString(),
        parentProductId: obj.parentProductId?.toString(),
      } as unknown as Product;
    });
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const p = await ProductModel.findById(id);
    if (!p) return undefined;
    const obj = p.toObject();
    return {
      ...obj,
      id: obj._id.toString(),
      categoryId: obj.categoryId.toString(),
      parentProductId: obj.parentProductId?.toString(),
    } as unknown as Product;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const p = await ProductModel.findOne({ barcode });
    if (!p) return undefined;
    const obj = p.toObject();
    return {
      ...obj,
      id: obj._id.toString(),
      categoryId: obj.categoryId.toString(),
      parentProductId: obj.parentProductId?.toString(),
    } as unknown as Product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct = await ProductModel.create(product);
    const obj = newProduct.toObject();
    return {
      ...obj,
      id: obj._id.toString(),
      categoryId: obj.categoryId.toString(),
      parentProductId: obj.parentProductId?.toString(),
    } as unknown as Product;
  }

  async updateProduct(
    id: string,
    updates: Partial<InsertProduct>,
  ): Promise<Product | undefined> {
    const updated = await ProductModel.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!updated) return undefined;
    const obj = updated.toObject();
    return {
      ...obj,
      id: obj._id.toString(),
      categoryId: obj.categoryId.toString(),
      parentProductId: obj.parentProductId?.toString(),
    } as unknown as Product;
  }

  async deleteProduct(id: string): Promise<void> {
    await ProductModel.findByIdAndDelete(id);
  }

  async updateProductStock(id: string, quantityChange: number): Promise<void> {
    await ProductModel.findByIdAndUpdate(id, {
      $inc: { stock: quantityChange },
    });
  }

  async getLowStockProducts(): Promise<Product[]> {
    const products = await ProductModel.find({
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    });
    return products.map((p) => {
      const obj = p.toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        categoryId: obj.categoryId.toString(),
        parentProductId: obj.parentProductId?.toString(),
      } as unknown as Product;
    });
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
        items: obj.items.map((i: any) => ({
          ...i,
          productId: i.productId.toString(),
        })),
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
      items: obj.items.map((i: any) => ({
        ...i,
        productId: i.productId.toString(),
      })),
    } as unknown as Bill;
  }

  async createBill(bill: InsertBill): Promise<Bill> {
    const billNumber = `BILL-${Date.now()}`;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      if (bill.status === "completed") {
        await this.deductStockFromBillItems(bill.items, session);
      }
      const newBill = await BillModel.create([{ ...bill, billNumber }], {
        session,
      });
      await session.commitTransaction();
      const obj = newBill[0].toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        date: obj.date.toISOString(),
        items: obj.items.map((i: any) => ({
          ...i,
          productId: i.productId.toString(),
        })),
      } as unknown as Bill;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateBill(
    id: string,
    updates: Partial<InsertBill>,
  ): Promise<Bill | undefined> {
    const bill = await BillModel.findById(id);
    if (!bill) return undefined;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // If status is changing to "completed" and it wasn't already completed, deduct stock
      if (updates.status === "completed" && bill.status !== "completed") {
        const itemsToDeduct = updates.items || bill.items;
        await this.deductStockFromBillItems(itemsToDeduct, session);
      }

      const updated = await BillModel.findByIdAndUpdate(id, updates, {
        new: true,
        session,
      });
      if (!updated) {
        await session.abortTransaction();
        return undefined;
      }

      await session.commitTransaction();
      const obj = updated.toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        date: obj.date.toISOString(),
        items: obj.items.map((i: any) => ({
          ...i,
          productId: i.productId.toString(),
        })),
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

  async updateBillStatus(
    id: string,
    status: "draft" | "completed" | "printed",
  ): Promise<void> {
    const bill = await BillModel.findById(id);
    if (!bill) return;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // If status is changing to "completed" and it wasn't already completed, deduct stock
      if (status === "completed" && bill.status !== "completed") {
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

  // Sales (Returns bills as sales)
  async getSales(): Promise<Sale[]> {
    const bills = await BillModel.find({ status: "completed" }).sort({
      date: -1,
    });
    return bills.map((b) => {
      const obj = b.toObject();
      return {
        id: obj._id.toString(),
        date: obj.date.toISOString(),
        total: obj.totalAmount,
        items: obj.items.map((i: any) => ({
          productId: i.productId.toString(),
          name: i.productName,
          quantity: i.packetQuantity,
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
        await ProductModel.findByIdAndUpdate(
          item.productId,
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
          productId: i.productId.toString(),
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
        productId: obj.productId.toString(),
      } as unknown as Restock;
    });
  }

  async createRestock(restock: InsertRestock): Promise<Restock> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const newRestock = await RestockModel.create([restock], { session });

      await ProductModel.findByIdAndUpdate(
        restock.productId,
        { $inc: { stock: restock.quantity } },
        { session },
      );

      await session.commitTransaction();
      const obj = newRestock[0].toObject();
      return {
        ...obj,
        id: obj._id.toString(),
        date: obj.date.toISOString(),
        productId: obj.productId.toString(),
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
}

export const storage = new MongoStorage();
