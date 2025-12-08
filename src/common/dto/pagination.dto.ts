import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationDefault, SortOrder } from '../constants';
import type { SortOrderType } from '../constants';

/**
 * Pagination Query DTO
 * Used for paginated list requests
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PaginationDefault.PAGE)
  page?: number = PaginationDefault.PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PaginationDefault.PAGE)
  @Max(PaginationDefault.MAX_LIMIT)
  limit?: number = PaginationDefault.LIMIT;

  @IsOptional()
  @IsString()
  sortBy?: string = PaginationDefault.SORT_BY;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrderType = PaginationDefault.SORT_ORDER;

  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Get the offset for database queries
   */
  get offset(): number {
    return (
      ((this.page ?? PaginationDefault.PAGE) - 1) *
      (this.limit ?? PaginationDefault.LIMIT)
    );
  }

  /**
   * Get pagination parameters for Prisma
   */
  getPrismaParams(): { skip: number; take: number } {
    return {
      skip: this.offset,
      take: this.limit ?? PaginationDefault.LIMIT,
    };
  }

  /**
   * Get sort parameters for Prisma
   */
  getPrismaSortParams(): Record<string, SortOrderType> {
    return {
      [this.sortBy ?? PaginationDefault.SORT_BY]:
        this.sortOrder ?? PaginationDefault.SORT_ORDER,
    };
  }
}

/**
 * Pagination Meta Information
 */
export interface PaginationMeta {
  /**
   * Current page number
   */
  page: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Total number of items
   */
  totalItems: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Whether there is a next page
   */
  hasNextPage: boolean;

  /**
   * Whether there is a previous page
   */
  hasPreviousPage: boolean;
}

/**
 * Paginated Response DTO
 * Used for paginated list responses
 */
export class PaginatedResponse<T> {
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
   * Response data items
   */
  data: T[];

  /**
   * Pagination metadata
   */
  meta: PaginationMeta;

  /**
   * Timestamp of the response
   */
  timestamp: string;

  constructor(partial: Partial<PaginatedResponse<T>>) {
    Object.assign(this, partial);
    this.timestamp = new Date().toISOString();
  }

  /**
   * Create a paginated response
   */
  static create<T>(
    data: T[],
    totalItems: number,
    query: PaginationQueryDto,
    message = 'Success',
  ): PaginatedResponse<T> {
    const page = query.page ?? PaginationDefault.PAGE;
    const limit = query.limit ?? PaginationDefault.LIMIT;
    const totalPages = Math.ceil(totalItems / limit);

    return new PaginatedResponse<T>({
      success: true,
      statusCode: 200,
      message,
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > PaginationDefault.PAGE,
      },
    });
  }
}

/**
 * Utility class for building pagination responses
 */
export class PaginationBuilder {
  /**
   * Build pagination meta from query and total count
   */
  static buildMeta(
    query: PaginationQueryDto,
    totalItems: number,
  ): PaginationMeta {
    const page = query.page ?? PaginationDefault.PAGE;
    const limit = query.limit ?? PaginationDefault.LIMIT;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > PaginationDefault.PAGE,
    };
  }
}
