import { z } from 'zod';

// ============================================================================
// Catalog Validation Schemas
// ============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Pagination query schema
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});

/**
 * Catalog list query schema
 */
export const catalogListQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  sort: z.enum(['created_at', 'updated_at', 'name']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Create catalog request schema
 */
export const createCatalogRequestSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be at most 255 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .nullable(),
  catalog_data: z
    .record(z.any())
    .refine(
      (data) => Object.keys(data).length > 0,
      'Catalog data cannot be empty'
    ),
});

/**
 * Update catalog request schema
 */
export const updateCatalogRequestSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be at most 255 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .nullable(),
  catalog_data: z.record(z.any()).optional(),
});

/**
 * Catalog ID parameter schema
 */
export const catalogIdParamSchema = z.object({
  catalog_id: uuidSchema,
});

/**
 * Demo user ID schema
 */
export const demoUserIdSchema = z.string().uuid('Invalid demo user ID');

// ============================================================================
// Type exports for TypeScript inference
// ============================================================================

export type CatalogListQuery = z.infer<typeof catalogListQuerySchema>;
export type CreateCatalogRequest = z.infer<typeof createCatalogRequestSchema>;
export type UpdateCatalogRequest = z.infer<typeof updateCatalogRequestSchema>;
export type CatalogIdParam = z.infer<typeof catalogIdParamSchema>;
export type DemoUserId = z.infer<typeof demoUserIdSchema>;

// ============================================================================
// Validation helper functions
// ============================================================================

/**
 * Validates catalog list query parameters
 */
export function validateCatalogListQuery(query: unknown): CatalogListQuery {
  return catalogListQuerySchema.parse(query);
}

/**
 * Validates create catalog request body
 */
export function validateCreateCatalogRequest(body: unknown): CreateCatalogRequest {
  return createCatalogRequestSchema.parse(body);
}

/**
 * Validates update catalog request body
 */
export function validateUpdateCatalogRequest(body: unknown): UpdateCatalogRequest {
  return updateCatalogRequestSchema.parse(body);
}

/**
 * Validates catalog ID parameter
 */
export function validateCatalogIdParam(params: unknown): CatalogIdParam {
  return catalogIdParamSchema.parse(params);
}

/**
 * Validates demo user ID
 */
export function validateDemoUserId(userId: unknown): DemoUserId {
  return demoUserIdSchema.parse(userId);
}
