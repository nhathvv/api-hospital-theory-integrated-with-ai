import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, ErrorMessages, getErrorMessage } from '../constants';
import {
  ErrorResponse,
  ExceptionDetails,
  getErrorCodeFromStatus,
  buildErrorResponse,
  isPrismaError,
  handlePrismaError,
} from './error-response.utils';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, errorCode, errors } = this.getExceptionDetails(exception);

    const errorResponse: ErrorResponse = buildErrorResponse(
      status,
      message,
      errorCode,
      request.url,
      errors,
    );

    this.logger.error(
      `Exception caught: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json(errorResponse);
  }

  private getExceptionDetails(exception: unknown): ExceptionDetails & {
    errors?: Record<string, string[]> | string[];
  } {
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    if (isPrismaError(exception)) {
      return handlePrismaError(exception);
    }

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

  private handleHttpException(exception: HttpException): ExceptionDetails & {
    errors?: Record<string, string[]> | string[];
  } {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return {
        status,
        message: exceptionResponse,
        errorCode: getErrorCodeFromStatus(status),
      };
    }

    const response = exceptionResponse as Record<string, unknown>;

    if (Array.isArray(response.message)) {
      return {
        status,
        message: getErrorMessage(ErrorCode.VALIDATION_ERROR),
        errorCode: ErrorCode.VALIDATION_ERROR,
        errors: response.message as string[],
      };
    }

    return {
      status,
      message: (response.message as string) || exception.message,
      errorCode: getErrorCodeFromStatus(status),
    };
  }
}
