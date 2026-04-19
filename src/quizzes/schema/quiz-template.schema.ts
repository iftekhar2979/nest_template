import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema()
export class QuizTemplate extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LearningTopic', required: true, index: true })
  topicId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  codePrefix: string; // e.g. ATD25, ATD15

  @Prop({ required: true, trim: true })
  namePrefix: string; // e.g. Associated Trades & Drywall Quiz

  @Prop({ required: true })
  questionCount: number;

  @Prop({ required: true })
  easyCount: number;

  @Prop({ required: true })
  moderateCount: number;

  @Prop({ required: true })
  hardCount: number;

  @Prop({ required: false })
  timeLimit: number; // seconds

  @Prop({ default: true })
  randomized: boolean;

  @Prop({ default: false })
  allowRepeats: boolean;
}

export const QuizTemplateSchema = SchemaFactory.createForClass(QuizTemplate);

QuizTemplate.applyBaseHooks(QuizTemplateSchema);

QuizTemplateSchema.index({ codePrefix: 1, topicId: 1 });
