/**
 * Webfix API Client
 * Universal client for Webfix RPC protocol (v1.0)
 * Handles unified request format and multiple response formats
 */

export interface WebfixRequest {
  webfix: "1.0";
  method: string;
  params?: string[];
  body?: unknown;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export interface WebfixResponse<T = unknown> {
  webfix: "1.0";
  result: T;
}

export interface WebfixErrorResponse {
  webfix: "1.0";
  error: {
    code: number;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> =
  | SuccessResponse<T>
  | ErrorResponse
  | WebfixResponse<T>
  | WebfixErrorResponse;

export class WebfixApiError extends Error {
  constructor(
    public message: string,
    public code?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "WebfixApiError";
  }
}

/**
 * Universal Webfix API Client
 * Handles all Webfix RPC requests with unified error handling
 */
export class WebfixApiClient {
  private baseUrl: string;
  private session: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set session for authentication
   */
  setSession(session: string | null): void {
    this.session = session;
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.session) {
      headers["stels-session"] = this.session;
    }

    return headers;
  }

  /**
   * Extract data from various response formats
   */
  private extractData<T>(response: ApiResponse<T>): T {
    // SuccessResponse format: {success: true, data: T}
    if ("success" in response && response.success === true) {
      return (response as SuccessResponse<T>).data;
    }

    // WebfixResponse format: {webfix: "1.0", result: T}
    if ("webfix" in response && "result" in response) {
      return (response as WebfixResponse<T>).result;
    }

    // If response is already the data type (some endpoints return data directly)
    return response as T;
  }

  /**
   * Handle errors from various response formats
   */
  private handleError(response: ApiResponse): never {
    // ErrorResponse format: {success: false, error: string}
    if ("success" in response && response.success === false) {
      const errorResponse = response as ErrorResponse;
      throw new WebfixApiError(errorResponse.error);
    }

    // WebfixErrorResponse format: {webfix: "1.0", error: {code, message, details}}
    if ("webfix" in response && "error" in response) {
      const errorResponse = response as WebfixErrorResponse;
      throw new WebfixApiError(
        errorResponse.error.message,
        errorResponse.error.code,
        errorResponse.error.details,
      );
    }

    // Fallback error
    throw new WebfixApiError("Unknown error format");
  }

  /**
   * Make Webfix RPC request
   * @param method - RPC method name
   * @param body - Method-specific request body
   * @param params - Optional params array (defaults to ["network-id"])
   * @returns Extracted data from response
   */
  async request<T = unknown>(
    method: string,
    body?: unknown,
    params: string[] = ["network-id"],
  ): Promise<T> {
    const requestBody: WebfixRequest = {
      webfix: "1.0",
      method,
      params,
    };

    if (body !== undefined && body !== null) {
      requestBody.body = body;
    }

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    });

    // Handle HTTP errors
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = typeof errorData.error === "string"
            ? errorData.error
            : errorData.error.message || errorMessage;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If JSON parsing fails, use default error message
      }
      throw new WebfixApiError(errorMessage, response.status);
    }

    // Parse response
    const data = await response.json() as ApiResponse<T>;

    // Check for error responses
    if (
      ("success" in data && data.success === false) ||
      ("webfix" in data && "error" in data)
    ) {
      this.handleError(data);
    }

    // Extract and return data
    return this.extractData(data);
  }

  /**
   * Make Webfix RPC request with custom params
   * @param method - RPC method name
   * @param body - Method-specific request body
   * @param params - Custom params array
   * @returns Extracted data from response
   */
  async requestWithParams<T = unknown>(
    method: string,
    body: unknown,
    params: string[],
  ): Promise<T> {
    return this.request<T>(method, body, params);
  }
}
