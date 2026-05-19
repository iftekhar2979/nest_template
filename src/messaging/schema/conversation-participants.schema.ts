import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'conversation_participants', timestamps: { createdAt: 'joinedAt', updatedAt: false } })
export class ConversationParticipant extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ default: 0 })
  unreadCount: number;

  joinedAt: Date;
}

export const ConversationParticipantSchema = SchemaFactory.createForClass(ConversationParticipant);

ConversationParticipantSchema.index(
  { userId: 1, conversationId: 1 },
  { unique: true, name: 'idx_participant_lookup' },
);
ConversationParticipantSchema.index({ conversationId: 1 }, { name: 'idx_conv_participants' });
