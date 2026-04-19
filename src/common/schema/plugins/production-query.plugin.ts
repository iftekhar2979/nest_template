import { Schema, Query, Aggregate } from 'mongoose';

/**
 * Custom options for Mongoose queries to allow bypassing global filters.
 */
interface CustomQueryOptions {
  ignoreGlobalFilters?: boolean;
}

export const ProductionQueryPlugin = (schema: Schema) => {
  const readHooks = ['find', 'findOne', 'countDocuments', 'exists'];
  const writeHooks = ['findOneAndUpdate', 'updateMany'];

  // READ QUERIES
  readHooks.forEach((hook) => {
    schema.pre(hook as any, function (this: Query<any, any> & CustomQueryOptions, next) {
      const options = this.getOptions() as CustomQueryOptions;
      if (options?.ignoreGlobalFilters) return next();

      const query = this.getQuery();

      if (!('deletedAt' in query)) {
        this.where({ deletedAt: null });
      }

      if (!('isActive' in query)) {
        this.where({ isActive: true });
      }

      next();
    });
  });

  // WRITE QUERIES
  writeHooks.forEach((hook) => {
    schema.pre(hook as any, function (this: Query<any, any> & CustomQueryOptions, next) {
      const options = this.getOptions() as CustomQueryOptions;
      if (options?.ignoreGlobalFilters) return next();

      const query = this.getQuery();

      this.setQuery({
        ...query,
        deletedAt: query.deletedAt ?? null,
        isActive: query.isActive ?? true,
      });

      next();
    });
  });

  // AGGREGATE
  schema.pre('aggregate', function (this: Aggregate<any> & { options: CustomQueryOptions }, next) {
    if (this.options?.ignoreGlobalFilters) return next();

    this.pipeline().unshift({
      $match: {
        deletedAt: null,
        isActive: true,
      },
    });

    next();
  });
};