import { z } from "zod";
import { 
  insertCategorySchema, 
  insertProductSchema, 
  partialProductSchema,
  insertSaleSchema, 
  insertRestockSchema,
  categorySchema,
  productSchema,
  saleSchema,
  restockSchema
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // Categories
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories',
      responses: {
        200: z.array(categorySchema),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/categories',
      input: insertCategorySchema,
      responses: {
        201: categorySchema,
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/categories/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  // Products
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
      responses: {
        200: z.array(productSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id',
      responses: {
        200: productSchema,
        404: errorSchemas.notFound,
      },
    },
    getByBarcode: {
      method: 'GET' as const,
      path: '/api/products/barcode/:barcode',
      responses: {
        200: productSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/products',
      input: insertProductSchema,
      responses: {
        201: productSchema,
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/products/:id',
      input: partialProductSchema,
      responses: {
        200: productSchema,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/products/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    lowStock: {
      method: 'GET' as const,
      path: '/api/products/low-stock/list',
      responses: {
        200: z.array(productSchema),
      },
    },
  },

  // Sales
  sales: {
    list: {
      method: 'GET' as const,
      path: '/api/sales',
      responses: {
        200: z.array(saleSchema),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/sales',
      input: insertSaleSchema,
      responses: {
        201: saleSchema,
        400: errorSchemas.validation,
      },
    },
  },

  // Restock
  restock: {
    list: {
      method: 'GET' as const,
      path: '/api/restock',
      responses: {
        200: z.array(restockSchema),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/restock',
      input: insertRestockSchema,
      responses: {
        201: restockSchema,
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
