# POS Medicines Page Design Guidelines

## Design Approach
**System-Based Approach**: Material Design 3 adapted for enterprise medicineivity
**Justification**: Data-heavy retail application requiring efficiency, scanability, and established interaction patterns. Material Design provides robust data visualization components while maintaining modern aesthetics.

## Core Design Elements

### Typography
- **Primary Font**: Inter (via Google Fonts CDN)
- **Headings**: 
  - Page Title: text-2xl font-semibold
  - Section Headers: text-lg font-medium
  - Card Titles: text-base font-medium
- **Body**: text-sm for dense data, text-base for form labels
- **Numerical Data**: font-mono for prices, SKUs, quantities

### Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 (p-4, gap-6, mb-8, etc.)
- Page padding: p-6 lg:p-8
- Component spacing: gap-6 between major sections
- Card padding: p-4 to p-6
- Table cell padding: px-4 py-3

### Component Library

**Header Section**:
- Search bar (prominent, left-aligned, w-full md:w-96)
- Action buttons group (Add Medicine, Import, Export)
- View toggle (Cards/Table with icon buttons)
- Filter button with badge showing active filter count

**Dual View System**:

*Cards View*:
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Card structure: Medicine image (16:9 ratio), SKU, name, price, stock status, quick actions
- Checkbox: Top-left overlay on card
- Stock indicators: Colored badges (In Stock, Low Stock, Out of Stock)
- Quick actions toolbar appears on selection

*Table View*:
- Sticky header with checkbox column
- Columns: Image (thumbnail), SKU, Name, Category, Price, Stock, Status, Actions
- Row hover state for clarity
- Sortable column headers (with arrows)
- Batch actions toolbar appears above table when items selected

**Multiselect System**:
- "Select All" checkbox in header
- Selection counter: "X items selected"
- Floating action toolbar: Delete, Edit Category, Adjust Price, Export Selected
- Visual feedback: Selected cards have elevated shadow and subtle border
- Keyboard support: Shift+click for range selection

**Filter Sidebar** (Collapsible):
- Category tree with counts
- Price range slider
- Stock status chips
- Brand/Vendor multiselect
- "Clear All" and "Apply" actions

**Empty States**:
- No medicines: Illustration + "Add your first medicine" CTA
- No search results: "No medicines found" with clear filters button
- Loading: Skeleton cards/rows matching view type

**Pagination/Infinite Scroll**:
- Bottom pagination: Items per page selector + page numbers
- Show "X-Y of Z medicines"

## Images
**Medicine Images**: Essential throughout
- Card View: 16:9 aspect ratio, object-cover, placeholder for missing images
- Table View: 40px square thumbnails
- **No hero image** - This is a functional admin interface, not a marketing page
- Placeholder system: Generic medicine icon for items without images

## Animations
**Minimal, Purposeful Only**:
- View toggle: Smooth 200ms transition between card/table layouts
- Checkbox: Scale animation on select (100ms)
- Hover states: Subtle elevation changes (100ms)
- NO decorative animations - speed and responsiveness are critical

## Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation for table rows and cards
- Focus indicators on all interactive elements
- Screen reader announcements for selection counts
- High contrast for status badges and indicators