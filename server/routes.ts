import type { Express } from "express";
import type { Server } from "http";
import { connectDB } from "./db";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { seedDatabase } from "./seed";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Connect to MongoDB
  await connectDB();
  
  // Seed Database if empty
  await seedDatabase();

  // --- Categories ---
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post(api.categories.create.path, async (req, res) => {
    try {
      const input = api.categories.create.input.parse(req.body);
      const category = await storage.createCategory(input);
      res.status(201).json(category);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.categories.delete.path, async (req, res) => {
    await storage.deleteCategory(req.params.id);
    res.status(204).send();
  });

  // --- Medicines ---
  app.get(api.medicines.list.path, async (req, res) => {
    const medicines = await storage.getMedicines();
    res.json(medicines);
  });

  app.get(api.medicines.get.path, async (req, res) => {
    const medicine = await storage.getMedicine(req.params.id);
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });
    res.json(medicine);
  });

  app.get(api.medicines.getByBarcode.path, async (req, res) => {
    const medicine = await storage.getMedicineByBarcode(req.params.barcode);
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });
    res.json(medicine);
  });

  app.get(api.medicines.lowStock.path, async (req, res) => {
    const medicines = await storage.getLowStockMedicines();
    res.json(medicines);
  });

  app.post(api.medicines.create.path, async (req, res) => {
    try {
      const input = api.medicines.create.input.parse(req.body);
      const medicine = await storage.createMedicine(input);
      res.status(201).json(medicine);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.medicines.update.path, async (req, res) => {
    try {
      const input = api.medicines.update.input.parse(req.body);
      const updated = await storage.updateMedicine(req.params.id, input);
      if (!updated) return res.status(404).json({ message: "Medicine not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.medicines.delete.path, async (req, res) => {
    await storage.deleteMedicine(req.params.id);
    res.status(204).send();
  });

  // --- Sales ---
  app.get(api.sales.list.path, async (req, res) => {
    const sales = await storage.getSales();
    res.json(sales);
  });

  app.post(api.sales.create.path, async (req, res) => {
    try {
      const input = api.sales.create.input.parse(req.body);
      // Validate stock availability before sale
      for (const item of input.items) {
        const medicine = await storage.getMedicine(item.medicineId);
        if (!medicine) {
          return res.status(400).json({ message: `Medicine ${item.name} not found` });
        }
        if (medicine.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${medicine.name}` });
        }
      }
      
      const sale = await storage.createSale(input);
      res.status(201).json(sale);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // --- Restock ---
  app.get(api.restock.list.path, async (req, res) => {
    const restocks = await storage.getRestocks();
    res.json(restocks);
  });

  app.post(api.restock.create.path, async (req, res) => {
    try {
      const input = api.restock.create.input.parse(req.body);
      const restock = await storage.createRestock(input);
      res.status(201).json(restock);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // --- Bills ---
  app.get("/api/bills", async (req, res) => {
    const bills = await storage.getBills();
    res.json(bills);
  });

  app.get("/api/bills/:id", async (req, res) => {
    const bill = await storage.getBill(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.json(bill);
  });

  app.post("/api/bills", async (req, res) => {
    try {
      const bill = await storage.createBill(req.body);
      res.status(201).json(bill);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put("/api/bills/:id", async (req, res) => {
    try {
      const updated = await storage.updateBill(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Bill not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete("/api/bills/:id", async (req, res) => {
    await storage.deleteBill(req.params.id);
    res.status(204).send();
  });

  app.patch("/api/bills/:id/status", async (req, res) => {
    const { status } = req.body;
    if (!["draft", "completed", "printed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    await storage.updateBillStatus(req.params.id, status);
    res.status(204).send();
  });

  // --- Medicines DB (Directory) ---
  app.get("/api/medicines-db", async (req, res) => {
    const search = req.query.search as string | undefined;
    const results = await storage.searchMedicinesDb(search);
    res.json(results);
  });

  app.patch("/api/medicines-db/:id/activate", async (req, res) => {
    try {
      const { itemsPerPacket, stock, actualPrice, price, expiryDate, categoryId, barcode, sku, supplierName, lowStockThreshold, name, description } = req.body;
      const dbEntry = (await storage.searchMedicinesDb())[0]; // fetch just to get name etc if needed
      // Create the medicine in the main collection
      const medicine = await storage.createMedicine({
        name: req.body.name,
        description: req.body.description || "",
        barcode: barcode || undefined,
        price: Number(price),
        actualPrice: Number(actualPrice),
        stock: Number(stock),
        itemsPerPacket: Number(itemsPerPacket),
        lowStockThreshold: Number(lowStockThreshold) || 10,
        categoryId: categoryId || undefined,
        sku: sku || "",
        supplierName: supplierName || "",
        supplierPhone: req.body.supplierPhone || "",
        supplierAddress: req.body.supplierAddress || "",
        expiryDate: expiryDate || "",
        image: "",
        totalItemsInStock: Number(stock) * (Number(itemsPerPacket) || 1),
      });
      // Mark as activated in medicines_db
      await storage.activateMedicineInDb(req.params.id, medicine.id);
      res.status(201).json(medicine);
    } catch (err) {
      console.error("Activate medicine error:", err);
      res.status(500).json({ message: "Failed to activate medicine" });
    }
  });

  app.patch("/api/medicines-db/:id/deactivate", async (req, res) => {
    await storage.deactivateMedicineInDb(req.params.id);
    res.status(204).send();
  });

  // --- Settings ---
  app.get("/api/settings", async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const settings = await storage.updateSettings(req.body);
      res.json(settings);
    } catch (err) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  return httpServer;
}
