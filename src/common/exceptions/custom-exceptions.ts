import {
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ErrorCode, ErrorMessages, getErrorMessage } from '../constants';

/**
 * Base Custom Exception
 * Provides a consistent structure for all custom exceptions
 */
export class BaseCustomException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    public readonly errorCode: string,
  ) {
    super(
      {
        message,
        errorCode,
        statusCode,
      },
      statusCode,
    );
  }
}

/**
 * Validation Exception
 * Thrown when request validation fails
 */
export class ValidationException extends BadRequestException {
  constructor(errors?: string[] | Record<string, string[]>) {
    super({
      message: ErrorMessages[ErrorCode.VALIDATION_ERROR],
      errorCode: ErrorCode.VALIDATION_ERROR,
      errors,
    });
  }
}

/**
 * Resource Not Found Exception
 * Thrown when a requested resource is not found
 */
export class ResourceNotFoundException extends NotFoundException {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super({
      message,
      errorCode: ErrorCode.RESOURCE_NOT_FOUND,
    });
  }
}

/**
 * Resource Already Exists Exception
 * Thrown when trying to create a resource that already exists
 */
export class ResourceAlreadyExistsException extends ConflictException {
  constructor(resource: string, field?: string) {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;
    super({
      message,
      errorCode: ErrorCode.RESOURCE_ALREADY_EXISTS,
    });
  }
}

/**
 * Invalid Credentials Exception
 * Thrown when authentication credentials are invalid
 */
export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      message: ErrorMessages[ErrorCode.INVALID_CREDENTIALS],
      errorCode: ErrorCode.INVALID_CREDENTIALS,
    });
  }
}

/**
 * Token Expired Exception
 * Thrown when an authentication token has expired
 */
export class TokenExpiredException extends UnauthorizedException {
  constructor() {
    super({
      message: ErrorMessages[ErrorCode.TOKEN_EXPIRED],
      errorCode: ErrorCode.TOKEN_EXPIRED,
    });
  }
}

/**
 * Invalid Token Exception
 * Thrown when an authentication token is invalid
 */
export class InvalidTokenException extends UnauthorizedException {
  constructor() {
    super({
      message: ErrorMessages[ErrorCode.INVALID_TOKEN],
      errorCode: ErrorCode.INVALID_TOKEN,
    });
  }
}

/**
 * Insufficient Permissions Exception
 * Thrown when user doesn't have required permissions
 */
export class InsufficientPermissionsException extends ForbiddenException {
  constructor(action?: string) {
    const message = action
      ? `You do not have permission to ${action}`
      : ErrorMessages[ErrorCode.INSUFFICIENT_PERMISSIONS];
    super({
      message,
      errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
    });
  }
}

/**
 * Rate Limit Exception
 * Thrown when rate limit is exceeded
 */
export class RateLimitException extends HttpException {
  constructor(retryAfter?: number) {
    super(
      {
        message: ErrorMessages[ErrorCode.RATE_LIMIT_EXCEEDED],
        errorCode: ErrorCode.RATE_LIMIT_EXCEEDED,
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/**
 * Database Exception
 * Thrown when a database operation fails
 */
export class DatabaseException extends InternalServerErrorException {
  constructor(message?: string) {
    super({
      message: message || ErrorMessages[ErrorCode.DATABASE_ERROR],
      errorCode: ErrorCode.DATABASE_ERROR,
    });
  }
}

/**
 * External Service Exception
 * Thrown when an external service call fails
 */
export class ExternalServiceException extends HttpException {
  constructor(serviceName: string, message?: string) {
    super(
      {
        message:
          message ||
          `${serviceName}: ${getErrorMessage(ErrorCode.EXTERNAL_SERVICE_ERROR)}`,
        errorCode: ErrorCode.EXTERNAL_SERVICE_ERROR,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}

