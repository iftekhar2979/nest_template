import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema()
export class Quiz extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'QuizTemplate', required: true, index: true })
  templateId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true })
  quizCode: string; // e.g. ATD25_1

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  instanceNumber: number;

  @Prop({ default: 0 })
  questionCount: number;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

Quiz.applyBaseHooks(QuizSchema);

QuizSchema.index({ quizCode: 1 });
