import type { APIContext } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';

// ============================================================================
// Auth Middleware Types
// ============================================================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  type: 'demo_user' | 'end_user';
}

export interface AuthContext extends APIContext {
  user: AuthenticatedUser;
  supabase: SupabaseClient<Database>;
}

// ============================================================================
// Auth Middleware Functions
// ============================================================================

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Validate and decode JWT token
 */
export async function validateToken(
  token: string,
  supabase: SupabaseClient<Database>
): Promise<AuthenticatedUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // Check if user is a demo user
    const { data: demoUser } = await supabase
      .from('demo_users')
      .select('id, email, name, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (demoUser) {
      return {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        type: 'demo_user',
      };
    }

    // Check if user is an end user
    const { data: endUser } = await supabase
      .from('end_users')
      .select('id, email, name, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (endUser) {
      return {
        id: endUser.id,
        email: endUser.email,
        name: endUser.name || '',
        type: 'end_user',
      };
    }

    return null;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(
  context: APIContext,
  supabase: SupabaseClient<Database>
): Promise<AuthContext> {
  const authHeader = context.request.headers.get('authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    throw new APIError('Authorization header missing or invalid', 401);
  }

  const user = await validateToken(token, supabase);

  if (!user) {
    throw new APIError('Invalid or expired token', 401);
  }

  return {
    ...context,
    user,
    supabase,
  };
}

/**
 * Require demo user authentication middleware
 */
export async function requireDemoUser(
  context: APIContext,
  supabase: SupabaseClient<Database>
): Promise<AuthContext> {
  const authContext = await requireAuth(context, supabase);

  if (authContext.user.type !== 'demo_user') {
    throw new APIError('Demo user access required', 403);
  }

  return authContext;
}

/**
 * Require end user authentication middleware
 */
export async function requireEndUser(
  context: APIContext,
  supabase: SupabaseClient<Database>
): Promise<AuthContext> {
  const authContext = await requireAuth(context, supabase);

  if (authContext.user.type !== 'end_user') {
    throw new APIError('End user access required', 403);
  }

  return authContext;
}

// ============================================================================
// API Error Class
// ============================================================================

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ============================================================================
// Error Response Helper
// ============================================================================

export function createErrorResponse(
  error: APIError,
  details?: Record<string, string>
) {
  return new Response(
    JSON.stringify({
      error: error.message,
      code: error.code,
      details,
      timestamp: new Date().toISOString(),
    }),
    {
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// ============================================================================
// Success Response Helper
// ============================================================================

export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
