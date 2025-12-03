import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, ErrorMessages } from '../constants';

/**
 * Error Response Interface
 */
interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errorCode: string;
  timestamp: string;
  path: string;
}

/**
 * Global All Exceptions Filter
 * Catches all exceptions (including non-HTTP) and returns a standardized error response
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, errorCode } =
      this.getExceptionDetails(exception);

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      message,
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(
      `Exception caught: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json(errorResponse);
  }

  private getExceptionDetails(exception: unknown): {
    status: number;
    message: string;
    errorCode: string;
  } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : (response as { message?: string }).message ||
            exception.message;

      return {
        status: exception.getStatus(),
        message,
        errorCode: this.getErrorCodeFromStatus(exception.getStatus()),
      };
    }

    // Handle Prisma errors
    if (this.isPrismaError(exception)) {
      return this.handlePrismaError(exception);
    }

    // Handle generic errors
    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          process.env.NODE_ENV === 'production'
            ? ErrorMessages[ErrorCode.INTERNAL_ERROR]
            : exception.message,
        errorCode: ErrorCode.INTERNAL_ERROR,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: ErrorMessages[ErrorCode.UNKNOWN_ERROR],
      errorCode: ErrorCode.UNKNOWN_ERROR,
    };
  }

  private getErrorCodeFromStatus(status: number): string {
    const statusToErrorCode: Record<number, string> = {
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

    return statusToErrorCode[status] || ErrorCode.UNKNOWN_ERROR;
  }

  private isPrismaError(exception: unknown): boolean {
    if (exception && typeof exception === 'object' && 'code' in exception) {
      const code = (exception as { code: string }).code;
      return typeof code === 'string' && code.startsWith('P');
    }
    return false;
  }

  private handlePrismaError(exception: unknown): {
    status: number;
    message: string;
    errorCode: string;
  } {
    const prismaError = exception as { code: string; meta?: { target?: string[] } };

    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        return {
          status: HttpStatus.CONFLICT,
          message: ErrorMessages[ErrorCode.DUPLICATE_ENTRY],
          errorCode: ErrorCode.DUPLICATE_ENTRY,
        };
      case 'P2025': // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          message: ErrorMessages[ErrorCode.RESOURCE_NOT_FOUND],
          errorCode: ErrorCode.RESOURCE_NOT_FOUND,
        };
      case 'P2003': // Foreign key constraint violation
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
}

