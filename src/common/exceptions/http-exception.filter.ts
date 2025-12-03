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

/**
 * Error Response Interface
 */
interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errorCode: string;
  errors?: Record<string, string[]> | string[];
  timestamp: string;
  path: string;
}

/**
 * Global HTTP Exception Filter
 * Catches all HTTP exceptions and returns a standardized error response
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = this.buildErrorResponse(
      status,
      exceptionResponse,
      request.url,
    );

    this.logger.error(
      `HTTP Exception: ${errorResponse.message}`,
      `Status: ${status}, Path: ${request.url}`,
    );

    response.status(status).json(errorResponse);
  }

  private buildErrorResponse(
    status: number,
    exceptionResponse: string | object,
    path: string,
  ): ErrorResponse {
    const errorCode = this.getErrorCodeFromStatus(status);
    const { message, errors } =
      this.extractMessageAndErrors(exceptionResponse);

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

  private extractMessageAndErrors(exceptionResponse: string | object): {
    message: string;
    errors?: Record<string, string[]> | string[];
  } {
    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse };
    }

    const response = exceptionResponse as Record<string, unknown>;

    // Handle class-validator validation errors
    if (Array.isArray(response.message)) {
      return {
        message: getErrorMessage(ErrorCode.VALIDATION_ERROR),
        errors: response.message as string[],
      };
    }

    return {
      message:
        (response.message as string) ||
        ErrorMessages[ErrorCode.UNKNOWN_ERROR],
    };
  }
}

