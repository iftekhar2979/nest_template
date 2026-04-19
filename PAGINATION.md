# Pagination Implementation Guide

This project uses a standardized pagination pattern involving a custom decorator, a service-level helper, and an interceptor.

## 1. Controller Implementation

Use the `@PaginationParams()` decorator to extract `page`, `limit`, and `skip` from the query string. Apply the `@UseInterceptors(PaginationInterceptor)` to automatically format the response.

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { PaginationParams, PaginationRequest } from '../shared/utils/pagination';
import { PaginationInterceptor } from '../shared/interceptors/pagination.interceptor';

@Controller('items')
@UseInterceptors(PaginationInterceptor)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  findAll(@PaginationParams() pagination: PaginationRequest) {
    return this.itemsService.findAll(pagination);
  }
}
```

## 2. Service Implementation

Pass the pagination parameters to your service and return the data along with the total count and the requested page/limit. The interceptor will handle the formatting.

```typescript
@Injectable()
export class ItemsService {
  constructor(@InjectModel(Item.name) private itemModel: Model<Item>) {}

  async findAll(pagination: PaginationRequest) {
    const { page, limit, skip } = pagination;
    
    const [data, total] = await Promise.all([
      this.itemModel.find().skip(skip).limit(limit).exec(),
      this.itemModel.countDocuments().exec(),
    ]);

    return { data, total, page, limit };
  }
}
```

## 3. Response Format

The `PaginationInterceptor` ensures all paginated endpoints return this consistent JSON structure:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Summary of Components

- **Decorator**: `src/shared/utils/pagination.ts` -> `@PaginationParams()`
- **Interceptor**: `src/shared/interceptors/pagination.interceptor.ts` -> `PaginationInterceptor`
- **Helper**: `src/shared/utils/pagination.ts` -> `pagination()` function (used by interceptor)
