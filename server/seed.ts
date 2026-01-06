import { storage } from "./storage";

export async function seedDatabase() {
  try {
    const cats = await storage.getCategories();
    if (cats.length === 0) {
      console.log("Seeding database...");
      
      const grocery = await storage.createCategory({ name: "Grocery" });
      const electronics = await storage.createCategory({ name: "Electronics" });
      const beverages = await storage.createCategory({ name: "Beverages" });

      await storage.createProduct({
        name: "Whole Milk 1L",
        description: "Fresh whole milk in 1 liter bottle",
        barcode: "1234567890123",
        price: 2.99,
        stock: 50,
        categoryId: grocery.id,
        lowStockThreshold: 15,
        supplierName: "Fresh Farms Ltd",
        supplierPhone: "(555) 123-4567",
        supplierAddress: "123 Farm Road, Rural Area",
        sku: "MILK-001",
        isVariation: false,
        unitType: "single",
        itemsPerPacket: 1,
        image: ""
      });

      await storage.createProduct({
        name: "USB-C Cable 1m",
        description: "High-speed USB-C to USB-C charging and data cable",
        barcode: "9876543210987",
        price: 9.99,
        stock: 20,
        categoryId: electronics.id,
        lowStockThreshold: 5,
        supplierName: "TechLink Supplies",
        supplierPhone: "(555) 987-6543",
        supplierAddress: "456 Tech Street, Tech City",
        sku: "USB-001",
        isVariation: false,
        unitType: "single",
        itemsPerPacket: 1,
        image: ""
      });

      await storage.createProduct({
        name: "Cola 330ml",
        description: "Refreshing cola beverage in 330ml can",
        barcode: "5432109876543",
        price: 1.50,
        stock: 100,
        categoryId: beverages.id,
        lowStockThreshold: 30,
        supplierName: "BevCo",
        supplierPhone: "(555) 555-5555",
        supplierAddress: "789 Beverage Ave, Drink City",
        sku: "COLA-001",
        isVariation: false,
        unitType: "single",
        itemsPerPacket: 1,
        image: ""
      });

      console.log("Seeding complete.");
    }
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}
