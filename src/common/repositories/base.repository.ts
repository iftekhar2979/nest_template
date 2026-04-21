import { Model, Document, FilterQuery, UpdateQuery, QueryOptions, SaveOptions } from 'mongoose';

export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: any, options?: SaveOptions): Promise<T> {
    const createdDocument = new this.model(data);
    return await createdDocument.save(options);
  }

  async findOne(filter: FilterQuery<T>, projection?: any, options?: QueryOptions): Promise<T | null> {
    return await this.model.findOne(filter, projection, options).exec();
  }

  async findById(id: string, projection?: any, options?: QueryOptions): Promise<T | null> {
    return await this.model.findById(id, projection, options).exec();
  }

  async find(filter: FilterQuery<T>, projection?: any, options?: QueryOptions): Promise<T[]> {
    return await this.model.find(filter, projection, options).exec();
  }

  async updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>, options?: QueryOptions): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, update, { new: true, ...options }).exec();
  }

  async updateById(id: string, update: UpdateQuery<T>, options?: QueryOptions): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, update, { new: true, ...options }).exec();
  }

  async deleteOne(filter: FilterQuery<T>): Promise<any> {
    return await this.model.deleteOne(filter).exec();
  }

  async softDelete(id: string): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true }).exec();
  }

  async count(filter: FilterQuery<T>): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }
}
