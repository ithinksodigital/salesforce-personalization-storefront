import type { APIContext } from 'astro';
import { createClient } from '../../../db/supabase.client';
import { requireDemoUser, createSuccessResponse } from '../../../lib/middleware/auth.middleware';
import { withErrorHandling } from '../../../lib/middleware/error.middleware';
import { createCatalogService } from '../../../lib/services/catalog.service';
import {
  validateCatalogIdParam,
  validateUpdateCatalogRequest,
} from '../../../lib/validation/catalog.schemas';

// ============================================================================
// API Endpoint Configuration
// ============================================================================

export const prerender = false;

// ============================================================================
// GET /api/catalogs/{catalog_id} - Get catalog by ID
// ============================================================================

async function handleGet(context: APIContext): Promise<Response> {
  const supabase = createClient();
  const authContext = await requireDemoUser(context, supabase);
  const catalogService = createCatalogService(supabase);

  // Validate catalog ID parameter
  const params = validateCatalogIdParam(context.params);

  // Get catalog
  const catalog = await catalogService.getCatalogById(
    params.catalog_id,
    authContext.user.id
  );

  return createSuccessResponse(catalog);
}

// ============================================================================
// PUT /api/catalogs/{catalog_id} - Update catalog
// ============================================================================

async function handlePut(context: APIContext): Promise<Response> {
  const supabase = createClient();
  const authContext = await requireDemoUser(context, supabase);
  const catalogService = createCatalogService(supabase);

  // Validate catalog ID parameter
  const params = validateCatalogIdParam(context.params);

  // Parse and validate request body
  const body = await context.request.json();
  const validatedBody = validateUpdateCatalogRequest(body);

  // Update catalog
  const catalog = await catalogService.updateCatalog({
    catalog_id: params.catalog_id,
    demo_user_id: authContext.user.id,
    name: validatedBody.name,
    description: validatedBody.description,
    catalog_data: validatedBody.catalog_data,
  });

  return createSuccessResponse(catalog);
}

// ============================================================================
// DELETE /api/catalogs/{catalog_id} - Delete catalog
// ============================================================================

async function handleDelete(context: APIContext): Promise<Response> {
  const supabase = createClient();
  const authContext = await requireDemoUser(context, supabase);
  const catalogService = createCatalogService(supabase);

  // Validate catalog ID parameter
  const params = validateCatalogIdParam(context.params);

  // Delete catalog
  await catalogService.deleteCatalog({
    catalog_id: params.catalog_id,
    demo_user_id: authContext.user.id,
  });

  return new Response(null, { status: 204 });
}

// ============================================================================
// Main Handler
// ============================================================================

async function handler(context: APIContext): Promise<Response> {
  const method = context.request.method;

  switch (method) {
    case 'GET':
      return await handleGet(context);
    case 'PUT':
      return await handlePut(context);
    case 'DELETE':
      return await handleDelete(context);
    default:
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
  }
}

// Export with error handling
export const GET = withErrorHandling(handler);
export const PUT = withErrorHandling(handler);
export const DELETE = withErrorHandling(handler);
