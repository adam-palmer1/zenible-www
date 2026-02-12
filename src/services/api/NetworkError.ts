/**
 * Network Error class for connectivity failures.
 *
 * Thrown by httpClient when a fetch fails due to network issues (e.g. offline).
 * Parallel to ApiError for server-side errors.
 */

export class NetworkError extends Error {
  readonly isNetworkError = true;

  constructor(message?: string) {
    super(message ?? 'Unable to connect. Please check your internet connection and try again.');
    this.name = 'NetworkError';
  }

  get userMessage(): string {
    return 'Unable to connect. Please check your internet connection and try again.';
  }
}
