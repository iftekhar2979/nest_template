import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema({ _id: false })
export class UserAnswer {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true })
  questionId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  optionId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  isCorrect: boolean;
}

@Schema()
export class QuizAttempt extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true })
  quizId: mongoose.Schema.Types.ObjectId;

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: Date.now })
  startedAt: Date;

  @Prop({ default: null })
  finishedAt: Date;

  @Prop({ type: [UserAnswer], default: [] })
  answers: UserAnswer[];
}

export const QuizAttemptSchema = SchemaFactory.createForClass(QuizAttempt);

QuizAttempt.applyBaseHooks(QuizAttemptSchema);
