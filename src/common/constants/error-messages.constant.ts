import { ErrorCode } from './http-status.constant';

/**
 * Error Messages Constants
 * Mapping of error codes to human-readable messages
 */
export const ErrorMessages: Record<string, string> = {
  // General Errors
  [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred',
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.INTERNAL_ERROR]: 'Internal server error',

  // Authentication Errors
  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.INVALID_TOKEN]: 'Invalid or malformed token',
  [ErrorCode.TOKEN_EXPIRED]: 'Token has expired',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',

  // Authorization Errors
  [ErrorCode.FORBIDDEN]: 'Access denied',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]:
    'You do not have permission to perform this action',

  // Resource Errors
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'The requested resource was not found',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
  [ErrorCode.RESOURCE_CONFLICT]: 'Resource conflict detected',

  // Request Errors
  [ErrorCode.BAD_REQUEST]: 'Bad request',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCode.INVALID_FORMAT]: 'Invalid format',

  // Rate Limiting
  [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests',
  [ErrorCode.RATE_LIMIT_EXCEEDED]:
    'Rate limit exceeded. Please try again later',

  // Database Errors
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.DUPLICATE_ENTRY]: 'Duplicate entry detected',

  // External Service Errors
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable',
} as const;

/**
 * Get error message by error code
 * @param errorCode - The error code
 * @param defaultMessage - Default message if error code not found
 * @returns The error message
 */
export function getErrorMessage(
  errorCode: string,
  defaultMessage?: string,
): string {
  return (
    ErrorMessages[errorCode] ?? defaultMessage ?? ErrorMessages.UNKNOWN_ERROR
  );
}
