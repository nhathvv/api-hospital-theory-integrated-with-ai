import { HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorMessages } from '../constants';

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errorCode: string;
  errors?: Record<string, string[]> | string[];
  timestamp: string;
  path: string;
}

export interface ExceptionDetails {
  status: number;
  message: string;
  errorCode: string;
}

const STATUS_TO_ERROR_CODE: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.RESOURCE_CONFLICT,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.VALIDATION_ERROR,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.TOO_MANY_REQUESTS,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_ERROR,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
};

export function getErrorCodeFromStatus(status: number): string {
  return STATUS_TO_ERROR_CODE[status] || ErrorCode.UNKNOWN_ERROR;
}

export function buildErrorResponse(
  status: number,
  message: string,
  errorCode: string,
  path: string,
  errors?: Record<string, string[]> | string[],
): ErrorResponse {
  return {
    success: false,
    statusCode: status,
    message,
    errorCode,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
    path,
  };
}

export function isPrismaError(exception: unknown): boolean {
  if (exception && typeof exception === 'object' && 'code' in exception) {
    const code = (exception as { code: string }).code;
    return typeof code === 'string' && code.startsWith('P');
  }
  return false;
}

export function handlePrismaError(exception: unknown): ExceptionDetails {
  const prismaError = exception as { code: string; meta?: { target?: string[] } };

  switch (prismaError.code) {
    case 'P2002':
      return {
        status: HttpStatus.CONFLICT,
        message: ErrorMessages[ErrorCode.DUPLICATE_ENTRY],
        errorCode: ErrorCode.DUPLICATE_ENTRY,
      };
    case 'P2025':
      return {
        status: HttpStatus.NOT_FOUND,
        message: ErrorMessages[ErrorCode.RESOURCE_NOT_FOUND],
        errorCode: ErrorCode.RESOURCE_NOT_FOUND,
      };
    case 'P2003':
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Referenced record does not exist',
        errorCode: ErrorCode.BAD_REQUEST,
      };
    default:
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: ErrorMessages[ErrorCode.DATABASE_ERROR],
        errorCode: ErrorCode.DATABASE_ERROR,
      };
  }
}
