# Nexus POS - Offline Point of Sale & Inventory Management System

## Overview

Nexus POS is a full-stack offline-first Point of Sale and Inventory Management system designed for wholesale businesses. The application supports barcode scanning, multi-bill management, medicine variations with packet-based inventory, and real-time stock tracking. Built with Express backend, React frontend, and MongoDB for data persistence.

**Key Features:**
- Multi-bill management with tab-based interface for handling multiple customers simultaneously
- Medicine variations with color, size, and packet-based inventory tracking
- EAN-13 barcode generation and scanning support
- Real-time cart updates and stock management
- Sales analytics and low-stock alerts
- Professional invoice generation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens (CSS variables for theming)
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)

**Design System:**
- Material Design 3 adapted for enterprise productivity
- Inter font family via Google Fonts
- Custom color palette with primary blue, accent purple, and semantic colors
- Responsive layout with sidebar navigation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **API Pattern**: RESTful endpoints defined in shared/routes.ts
- **Validation**: Zod schemas shared between frontend and backend

**Key Backend Files:**
- `server/routes.ts` - API endpoint definitions
- `server/storage.ts` - MongoDB models and CRUD operations
- `server/db.ts` - Database connection
- `server/seed.ts` - Initial data seeding

### Data Models
Core entities defined in `shared/schema.ts`:
- **Products**: With variations support (color, size, packets), barcode, pricing, stock
- **Categories**: Simple grouping for products
- **Bills**: Multi-status workflow (draft/completed/printed), customer info, line items
- **Sales**: Transaction history with items
- **Restocks**: Transaction history with items, restock entries with supplier tracking

### Shared Code Pattern
The `shared/` directory contains:
- `schema.ts` - Zod schemas for all entities (used by both frontend validation and backend)
- `routes.ts` - API route definitions with input/output schemas

This enables type-safe API contracts across the stack.

### Build & Development
- Development: `npm run dev` - Uses tsx to run TypeScript directly with Vite dev server
- Production build: `npm run build` - Vite builds frontend, esbuild bundles server
- Database migrations: Drizzle Kit configured but MongoDB is primary (Mongoose)

## External Dependencies

### Database
- **MongoDB**: Primary data store, connected via `MONGODB_URI` environment variable
- **Mongoose**: ODM for MongoDB schema definitions and queries

### UI Libraries
- **Radix UI**: Headless component primitives (dialog, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-styled component library built on Radix
- **Recharts**: Analytics charts and visualizations
- **Lucide React**: Icon library

### Utilities
- **jsbarcode**: EAN-13 barcode generation for products
- **html2pdf.js**: PDF generation for barcode printing
- **date-fns**: Date formatting and manipulation
- **Zod**: Schema validation across frontend and backend

### Development Tools
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **Drizzle Kit**: Database tooling (configured for PostgreSQL but MongoDB is used)