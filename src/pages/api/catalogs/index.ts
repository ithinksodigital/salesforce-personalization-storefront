import type { APIContext } from 'astro';
import { createClient } from '../../../db/supabase.client';
import { requireDemoUser, createSuccessResponse } from '../../../lib/middleware/auth.middleware';
import { withErrorHandling } from '../../../lib/middleware/error.middleware';
import { createCatalogService } from '../../../lib/services/catalog.service';
import {
  validateCatalogListQuery,
  validateCreateCatalogRequest,
} from '../../../lib/validation/catalog.schemas';

// ============================================================================
// API Endpoint Configuration
// ============================================================================

export const prerender = false;

// ============================================================================
// GET /api/catalogs - List catalogs
// ============================================================================

async function handleGet(context: APIContext): Promise<Response> {
  const supabase = createClient();
  const authContext = await requireDemoUser(context, supabase);
  const catalogService = createCatalogService(supabase);

  // Validate query parameters
  const query = validateCatalogListQuery(context.url.searchParams);

  // Get catalogs
  const result = await catalogService.getCatalogs(authContext.user.id, query);

  return createSuccessResponse(result);
}

// ============================================================================
// POST /api/catalogs - Create catalog
// ============================================================================

async function handlePost(context: APIContext): Promise<Response> {
  const supabase = createClient();
  const authContext = await requireDemoUser(context, supabase);
  const catalogService = createCatalogService(supabase);

  // Parse and validate request body
  const body = await context.request.json();
  const validatedBody = validateCreateCatalogRequest(body);

  // Validate demo user exists
  const isValidUser = await catalogService.validateDemoUser(authContext.user.id);
  if (!isValidUser) {
    throw new Error('Demo user not found or inactive');
  }

  // Create catalog
  const catalog = await catalogService.createCatalog({
    demo_user_id: authContext.user.id,
    name: validatedBody.name,
    description: validatedBody.description,
    catalog_data: validatedBody.catalog_data,
  });

  return createSuccessResponse(catalog, 201);
}

// ============================================================================
// Main Handler
// ============================================================================

async function handler(context: APIContext): Promise<Response> {
  const method = context.request.method;

  switch (method) {
    case 'GET':
      return await handleGet(context);
    case 'POST':
      return await handlePost(context);
    default:
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
  }
}

// Export with error handling
export const GET = withErrorHandling(handler);
export const POST = withErrorHandling(handler);
