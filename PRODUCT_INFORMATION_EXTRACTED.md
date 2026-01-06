# Product Information Extracted

## Product Data Structure

### Core Product Fields
1. **id** (string, unique) - Product identifier
2. **name** (string, required) - Product name
3. **barcode** (string, required) - EAN-13 barcode format
4. **sku** (string, optional) - Stock Keeping Unit
5. **price** (number, required) - Product selling price
6. **stock** (number, required) - Current stock quantity
7. **categoryId** (string, required) - Category ID (one category per product, no hierarchy)
8. **description** (string, optional) - Product description
9. **image** (string, optional) - Product image (base64 or path)
10. **unit** (string, optional) - Unit of measurement (e.g., kg, liter, piece)
11. **lowStockThreshold** (number, optional, default 10) - Low stock alert threshold

### Supplier Information (Optional)
- **supplierName** (string, optional) - Supplier name
- **supplierPhone** (string, optional) - Supplier phone number
- **supplierAddress** (string, optional) - Supplier address

---

## Product Operations (CRUD)

### Create Product
- Add new product with all required fields
- Generate EAN-13 barcode if not provided
- Set initial stock quantity
- Assign to category

### Read Product
- List all products with pagination
- Search by product name or barcode
- Filter by category
- View stock quantities
- Display supplier information

### Update Product
- Edit product details (name, price, description, etc.)
- Update stock quantity
- Modify category assignment
- Update supplier information
- Change product image

### Delete Product
- Remove product from inventory
- Delete associated barcodes
- Maintain sales history

---

## Product Categories

### Category Management
- Simple flat structure (no complex hierarchy)
- Used only for grouping products
- Examples: Grocery, Beverages, Electronics
- Each product belongs to exactly one category

### Category Operations
- Create category
- Edit category name
- Delete category
- Filter products by category

---

## Barcode Features

### EAN-13 Barcode
- Standard EAN-13 format for product identification
- Print-ready PDF generation
- Barcode preview in product list/card view
- Multiple barcode printing (selected products)
- Label printing optimization
- CODE128 format support in UI

### Barcode Operations
- Generate individual barcode
- Generate batch PDF for multiple products
- Display barcode preview
- Print to PDF functionality
- Attach barcode to product

---

## Stock Management

### Stock Tracking
- Real-time stock quantity updates
- Low-stock alerts (configurable threshold, default 10)
- Stock status indicators (In Stock / Low Stock)
- Visual indicators: Red (low stock), Green (in stock)

### Stock Operations
- View current stock
- Update stock quantity (manual entry)
- Purchase/Restock entries with history
- Automatic quantity updates from POS sales
- Low-stock alert triggers

---

## Database Schema Summary

### Products Collection
```
{
  id: string (unique),
  name: string,
  barcode: string (EAN-13),
  sku: string,
  price: number,
  stock: number,
  categoryId: string (references Categories),
  description: string,
  image: string,
  unit: string,
  lowStockThreshold: number,
  supplierName: string,
  supplierPhone: string,
  supplierAddress: string
}
```

### Categories Collection
```
{
  id: string (unique),
  name: string,
  description: string (optional)
}
```

### Stock History Collection (for restock tracking)
```
{
  id: string,
  productId: string,
  quantity: number,
  type: "purchase" | "restock" | "adjustment",
  supplierName: string,
  date: timestamp,
  notes: string
}
```

---

## Product Page Features

### Views
1. **List View** - Table format with all product details
2. **Card View** - Grid layout with product images/barcodes

### Table Columns (List View)
- Checkbox (for bulk actions)
- Product Name
- Barcode
- SKU
- Category
- Price (right-aligned)
- Stock (right-aligned, with status badge)
- Low Stock Threshold
- Actions (Edit, Delete)

### Card View
- Product image/barcode preview
- Product name
- Category
- Stock status badge
- Price
- Stock quantity
- Edit and Delete buttons

### Bulk Actions
- Select/Deselect all products
- Generate barcodes PDF for selected products
- Barcode print modal (2-column grid layout)

### Search & Filter
- Search by product name or barcode
- View mode toggle (list/card)

---

## Related Pages

### POS / Cart
- Barcode scan integration
- Real-time stock updates via WebSockets
- Duplicate scan detection (increment quantity)
- Out-of-stock validation

### Products / Inventory
- CRUD operations for products
- Stock quantity management
- Supplier information display
- Barcode generation and printing

### Purchase / Restock
- Add stock to existing products
- Optional supplier selection
- Restock history tracking
- Real-time stock updates

### Sales / Invoice History
- Invoice records linked to products
- Product-based search
- Sales history analytics

### Analytics / Reports
- Best-selling products report
- Category-based sales analysis
- Stock movement reports
- Revenue and profit analytics

### Low Stock Alerts
- Display products below threshold
- Quick access to restock page
- Alert notifications

---

## Key Points
- Single-user, fully offline system
- Products linked to categories (1:N relationship)
- Optional supplier information for each product
- EAN-13 barcode standard
- Print-ready barcode PDFs
- Real-time stock updates via WebSockets
- Low-stock alerts with configurable thresholds
