/**
 * Standard API Response DTO
 * Used for all API responses to ensure consistency
 */
export class ApiResponse<T> {
  /**
   * Indicates if the request was successful
   */
  success: boolean;

  /**
   * HTTP status code
   */
  statusCode: number;

  /**
   * Response message
   */
  message: string;

  /**
   * Response data (can be null for error responses)
   */
  data: T | null;

  /**
   * Timestamp of the response
   */
  timestamp: string;

  /**
   * Request path
   */
  path?: string;

  constructor(partial: Partial<ApiResponse<T>>) {
    Object.assign(this, partial);
    this.timestamp = new Date().toISOString();
  }

  /**
   * Create a success response
   */
  static success<T>(
    data: T,
    message = 'Success',
    statusCode = 200,
  ): ApiResponse<T> {
    return new ApiResponse<T>({
      success: true,
      statusCode,
      message,
      data,
    });
  }

  /**
   * Create an error response
   */
  static error<T = null>(
    message: string,
    statusCode = 500,
    data: T | null = null,
  ): ApiResponse<T> {
    return new ApiResponse<T>({
      success: false,
      statusCode,
      message,
      data,
    });
  }
}
