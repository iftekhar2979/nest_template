import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'pinned_messages', timestamps: { createdAt: 'pinnedAt', updatedAt: false } })
export class PinnedMessage extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true })
  messageId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  pinnedBy: mongoose.Schema.Types.ObjectId;

  pinnedAt: Date;
}

export const PinnedMessageSchema = SchemaFactory.createForClass(PinnedMessage);

PinnedMessageSchema.index(
  { conversationId: 1, messageId: 1 },
  { unique: true, name: 'idx_pinned_msg_unique' },
);
PinnedMessageSchema.index({ pinnedBy: 1 }, { name: 'idx_pinned_msg_user' });
