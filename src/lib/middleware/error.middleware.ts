import type { APIContext } from 'astro';
import { ZodError } from 'zod';
import { APIError, createErrorResponse } from './auth.middleware';

// ============================================================================
// Error Handler Types
// ============================================================================

export interface ErrorHandlerOptions {
  logErrors?: boolean;
  includeStackTrace?: boolean;
}

// ============================================================================
// Error Handler Class
// ============================================================================

export class ErrorHandler {
  private options: ErrorHandlerOptions;

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      logErrors: true,
      includeStackTrace: false,
      ...options,
    };
  }

  /**
   * Handle errors in API endpoints
   */
  async handleError(
    error: unknown,
    context: APIContext
  ): Promise<Response> {
    // Log error if enabled
    if (this.options.logErrors) {
      this.logError(error, context);
    }

    // Handle different error types
    if (error instanceof APIError) {
      return createErrorResponse(error);
    }

    if (error instanceof ZodError) {
      return this.handleValidationError(error);
    }

    if (error instanceof Error) {
      return this.handleGenericError(error);
    }

    // Handle unknown errors
    return this.handleUnknownError(error);
  }

  /**
   * Handle Zod validation errors
   */
  private handleValidationError(error: ZodError): Response {
    const details: Record<string, string> = {};
    
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      details[path] = err.message;
    });

    return createErrorResponse(
      new APIError('Validation failed', 400, 'VALIDATION_ERROR'),
      details
    );
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(error: Error): Response {
    // Check for common error patterns
    if (error.message.includes('not found')) {
      return createErrorResponse(
        new APIError(error.message, 404, 'NOT_FOUND')
      );
    }

    if (error.message.includes('already exists')) {
      return createErrorResponse(
        new APIError(error.message, 409, 'CONFLICT')
      );
    }

    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return createErrorResponse(
        new APIError(error.message, 403, 'FORBIDDEN')
      );
    }

    // Default to 500 for generic errors
    return createErrorResponse(
      new APIError('Internal server error', 500, 'INTERNAL_ERROR')
    );
  }

  /**
   * Handle unknown errors
   */
  private handleUnknownError(error: unknown): Response {
    return createErrorResponse(
      new APIError('An unexpected error occurred', 500, 'UNKNOWN_ERROR')
    );
  }

  /**
   * Log error with context
   */
  private logError(error: unknown, context: APIContext): void {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      method: context.request.method,
      url: context.request.url,
      userAgent: context.request.headers.get('user-agent'),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: this.options.includeStackTrace ? error.stack : undefined,
      } : error,
    };

    console.error('API Error:', JSON.stringify(errorInfo, null, 2));
  }
}

// ============================================================================
// Error Handler Factory
// ============================================================================

/**
 * Create a new ErrorHandler instance
 */
export function createErrorHandler(options?: ErrorHandlerOptions): ErrorHandler {
  return new ErrorHandler(options);
}

// ============================================================================
// Error Handler Decorator
// ============================================================================

/**
 * Decorator function to wrap API handlers with error handling
 */
export function withErrorHandling(
  handler: (context: APIContext) => Promise<Response>,
  options?: ErrorHandlerOptions
) {
  const errorHandler = createErrorHandler(options);

  return async (context: APIContext): Promise<Response> => {
    try {
      return await handler(context);
    } catch (error) {
      return await errorHandler.handleError(error, context);
    }
  };
}

// ============================================================================
// Common Error Responses
// ============================================================================

export const CommonErrors = {
  UNAUTHORIZED: new APIError('Unauthorized', 401, 'UNAUTHORIZED'),
  FORBIDDEN: new APIError('Forbidden', 403, 'FORBIDDEN'),
  NOT_FOUND: new APIError('Resource not found', 404, 'NOT_FOUND'),
  METHOD_NOT_ALLOWED: new APIError('Method not allowed', 405, 'METHOD_NOT_ALLOWED'),
  CONFLICT: new APIError('Resource already exists', 409, 'CONFLICT'),
  VALIDATION_ERROR: new APIError('Validation failed', 400, 'VALIDATION_ERROR'),
  INTERNAL_ERROR: new APIError('Internal server error', 500, 'INTERNAL_ERROR'),
} as const;
