import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema()
export class LearningTopic extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true })
  categoryId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: false })
  description: string;

  @Prop({ default: 0 })
  orderIndex: number;
}

export const LearningTopicSchema = SchemaFactory.createForClass(LearningTopic);

LearningTopic.applyBaseHooks(LearningTopicSchema);

LearningTopicSchema.index({ title: 'text' });
