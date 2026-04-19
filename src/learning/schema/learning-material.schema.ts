import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema()
export class LearningMaterial extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LearningTopic', required: true, index: true })
  topicId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, enum: ['text', 'image', 'video', 'card'] })
  contentType: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  contentData: any;

  @Prop({ required: true })
  orderIndex: number;
}

export const LearningMaterialSchema = SchemaFactory.createForClass(LearningMaterial);

LearningMaterial.applyBaseHooks(LearningMaterialSchema);
