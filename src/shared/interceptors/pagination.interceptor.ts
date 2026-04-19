import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { pagination } from '../utils/pagination';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((result) => {
        // If the result has data and total, it's a paginated result
        if (result && result.data && typeof result.total === 'number') {
          const { data, total, page, limit } = result;
          return {
            data,
            meta: pagination({ page, limit, total }),
          };
        }
        return result;
      }),
    );
  }
}
