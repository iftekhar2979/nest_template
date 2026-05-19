import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'messages', timestamps: { createdAt: 'sentAt', updatedAt: false } })
export class Message extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  senderId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'CustomOffer', default: null })
  customOfferId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null })
  parentMessageId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  isRead: boolean;

  sentAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversationId: 1 }, { name: 'idx_msg_conversation_id' });
MessageSchema.index({ conversationId: 1, sentAt: 1 }, { name: 'idx_msg_history_load' });
MessageSchema.index({ parentMessageId: 1 }, { name: 'idx_msg_reply_lookup' });
