import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Helper function to format pagination metadata.
 */
export function pagination({ page = 1, limit = 10, total }: { page: number; limit: number; total: number }) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
  };
}

/**
 * Custom decorator to extract pagination parameters from the query string.
 * Defaults: page = 1, limit = 10.
 */
export const PaginationParams = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    
    // Ensure positive integers
    return {
      page: page > 0 ? page : 1,
      limit: limit > 0 ? limit : 10,
      skip: (page - 1) * limit
    };
  },
);

export interface PaginationRequest {
  page: number;
  limit: number;
  skip: number;
}
