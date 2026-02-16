/**
 * Shared API client helpers (non-React).
 *
 * Keep this file free of React/context so it can be used from:
 * - UI pages/components (via higher-level helpers in utils/api.ts)
 * - AuthContext (auth checks)
 * - Any future split-out API modules (coursesApi.ts, modulesApi.ts, etc.)
 */

/**
 * Get authentication headers for API requests.
 * Reads bearer token from localStorage.
 */
export function getAuthHeaders(
    includeContentType = true
): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
        ...(includeContentType && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
    };

    return headers;
}

/**
 * Get the API base URL from environment or default to localhost.
 * Includes /api prefix for all API routes.
 */
export function getApiUrl(): string {
    const baseUrl =
        (import.meta.env.VITE_API_URL as string | undefined) !== undefined
            ? (import.meta.env.VITE_API_URL as string)
            : 'http://localhost:8000';
    // Ensure /api is appended to the base URL
    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
}

interface ErrorResponse {
    detail?: string;
}

/**
 * Handle API response errors consistently.
 * @returns Parsed JSON response, or null for 204 responses
 * @throws {Error} If response is not ok
 */
export async function handleResponse<T = unknown>(
    response: Response
): Promise<T | null> {
    if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
            const errorData = (await response.json()) as ErrorResponse;
            errorMessage = errorData.detail || errorMessage;
        } catch {
            // If response is not JSON, use status text
        }

        // Log more details for debugging
        if (response.status === 401 || response.status === 403) {
            console.error('Authentication error:', {
                status: response.status,
                statusText: response.statusText,
                message: errorMessage,
                hasToken: !!localStorage.getItem('auth_token'),
            });
        }

        // Check for authentication errors and redirect to login
        if (
            response.status === 401 ||
            response.status === 403 ||
            errorMessage.includes('Could not validate credentials') ||
            errorMessage.includes('Not authenticated')
        ) {
            // Clear auth token
            localStorage.removeItem('auth_token');
            localStorage.removeItem('token_type');

            // Redirect to login page
            // Only redirect if we're not already on the login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        throw new Error(errorMessage);
    }

    // Handle 204 No Content responses (common for DELETE requests)
    if (response.status === 204) {
        return null;
    }

    return response.json() as Promise<T>;
}
