import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema({ _id: false })
export class Option {
  @Prop({ required: true })
  optionLabel: string; // A, B, C, D

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  isCorrect: boolean;
}

@Schema()
export class Question extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: false, index: true })
  quizId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LearningTopic', required: true, index: true })
  topicId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: false })
  subtopic: string;

  @Prop({ required: true, enum: ['easy', 'medium', 'hard'] })
  difficulty: string;

  @Prop({ required: false })
  rationale: string;

  @Prop({ required: false })
  trapExplanation: string;

  @Prop({ required: false })
  externalId: number;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [Option], required: true })
  options: Option[];
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

Question.applyBaseHooks(QuestionSchema);

QuestionSchema.index({ content: 'text' });
