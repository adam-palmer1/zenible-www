/**
 * Unified API Error class for consistent error handling across all API services.
 *
 * Thrown by httpClient when a request returns a non-ok response.
 * Extends Error so existing `catch (error)` blocks continue to work.
 */

export class ApiError extends Error {
  status: number;
  statusText: string;
  data: unknown;
  validationErrors?: ValidationError[];

  constructor(message: string, status: number, statusText: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;

    // Extract validation errors if present (Pydantic format)
    const dataRecord = data as Record<string, unknown>;
    if (data && typeof data === 'object' && Array.isArray(dataRecord.detail)) {
      this.validationErrors = dataRecord.detail as ValidationError[];
    }
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isValidationError(): boolean {
    return this.status === 422;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  get userMessage(): string {
    // Return a user-friendly message, hiding internal details
    if (this.isNotFound) return 'The requested resource was not found.';
    if (this.isUnauthorized) return 'Please sign in to continue.';
    if (this.isForbidden) return 'You do not have permission to perform this action.';
    if (this.isValidationError && this.validationErrors?.length) {
      return this.validationErrors.map(e => e.msg || e.message).join(', ');
    }
    if (this.isServerError) return 'Something went wrong. Please try again later.';
    return this.message || 'An unexpected error occurred.';
  }
}

interface ValidationError {
  loc?: (string | number)[];
  msg?: string;
  message?: string;
  type?: string;
}
