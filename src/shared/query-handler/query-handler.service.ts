import { Injectable } from '@nestjs/common';
import { Query } from 'mongoose';
import { ParsedQueryOptions } from './decorators/parsed-query.decorator';

@Injectable()
export class QueryHandlerService {
  /**
   * Applies parsed query options (filter, sort, projection, and global filter bypass) 
   * to a Mongoose query.
   * 
   * @param query The Mongoose query instance (e.g., this.model.find())
   * @param parsedOptions The output from the @ParsedQuery() decorator
   */
  apply<T, Doc>(
    query: Query<T, Doc>,
    parsedOptions: ParsedQueryOptions,
  ): Query<T, Doc> {
    const { filter, sort, projection, options } = parsedOptions;

    // Apply the user-defined filter
    query.where(filter);

    // Apply sorting
    query.sort(sort);

    // Apply field projection
    if (projection) {
      query.select(projection);
    }

    // Handle bypassing global filters (defined in ProductionQueryPlugin)
    if (options.ignoreGlobalFilters) {
      query.setOptions({ ignoreGlobalFilters: true });
    }

    return query;
  }
}
