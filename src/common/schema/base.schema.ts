import { Prop, Schema } from '@nestjs/mongoose';
import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';
import { ProductionQueryPlugin } from './plugins/production-query.plugin';

@Schema({
  timestamps: true,
  toJSON: { getters: true, virtuals: true },
  toObject: { getters: true, virtuals: true }
})
export abstract class Base extends Document {
  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: 'active', index: true })
  status: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true })
  createdBy: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true })
  updatedBy: mongoose.Schema.Types.ObjectId;

  @Prop({ default: null, index: true })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;

  /**
   * Applies base query hooks to a schema.
   * Includes soft-delete and active-only filtering as recommended for production.
   */
  static applyBaseHooks(schema: MongooseSchema) {
    schema.plugin(ProductionQueryPlugin);
  }
}
