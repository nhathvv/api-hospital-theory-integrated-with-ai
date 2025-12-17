import { HttpStatus } from '@nestjs/common';
import {
  ResourceNotFoundException,
  ResourceAlreadyExistsException,
  ValidationException,
  InvalidCredentialsException,
  TokenExpiredException,
  InvalidTokenException,
  InsufficientPermissionsException,
  DatabaseException,
  ExternalServiceException,
  BaseCustomException,
} from '../exceptions';
import { ErrorCode, ErrorMessages } from '../constants';

export class ExceptionUtils {
  static throwNotFound(resource: string, identifier?: string | number): never {
    throw new ResourceNotFoundException(resource, identifier);
  }

  static throwAlreadyExists(resource: string, field?: string): never {
    throw new ResourceAlreadyExistsException(resource, field);
  }

  static throwValidation(errors?: string[] | Record<string, string[]>): never {
    throw new ValidationException(errors);
  }

  static throwInvalidCredentials(): never {
    throw new InvalidCredentialsException();
  }

  static throwTokenExpired(): never {
    throw new TokenExpiredException();
  }

  static throwInvalidToken(): never {
    throw new InvalidTokenException();
  }

  static throwInsufficientPermissions(action?: string): never {
    throw new InsufficientPermissionsException(action);
  }

  static throwDatabaseError(message?: string): never {
    throw new DatabaseException(message);
  }

  static throwExternalServiceError(
    serviceName: string,
    message?: string,
  ): never {
    throw new ExternalServiceException(serviceName, message);
  }

  static throwCustom(
    message: string,
    statusCode: HttpStatus,
    errorCode: string,
  ): never {
    throw new BaseCustomException(message, statusCode, errorCode);
  }

  static throwBadRequest(message: string): never {
    throw new BaseCustomException(
      message,
      HttpStatus.BAD_REQUEST,
      ErrorCode.BAD_REQUEST,
    );
  }

  static throwUnauthorized(message?: string): never {
    throw new BaseCustomException(
      message || ErrorMessages[ErrorCode.UNAUTHORIZED],
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED,
    );
  }

  static throwForbidden(message?: string): never {
    throw new BaseCustomException(
      message || ErrorMessages[ErrorCode.FORBIDDEN],
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
    );
  }

  static throwConflict(message: string): never {
    throw new BaseCustomException(
      message,
      HttpStatus.CONFLICT,
      ErrorCode.RESOURCE_CONFLICT,
    );
  }

  static throwInternalError(message?: string): never {
    throw new BaseCustomException(
      message || ErrorMessages[ErrorCode.INTERNAL_ERROR],
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR,
    );
  }
}
