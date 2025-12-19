import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto';

/**
 * Response Interceptor
 * Transforms all successful responses to a standardized format
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    if (
      path &&
      (path.startsWith('/api/docs') || path.startsWith('/api/docs-json'))
    ) {
      return next.handle() as Observable<ApiResponse<T>>;
    }

    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'statusCode' in data
        ) {
          return data;
        }

        return {
          success: true,
          statusCode,
          message: this.getSuccessMessage(statusCode),
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private getSuccessMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      200: 'Success',
      201: 'Created successfully',
      202: 'Accepted',
      204: 'No content',
    };
    return messages[statusCode] || 'Success';
  }
}
