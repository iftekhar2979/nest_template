import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'message_attachments', timestamps: { createdAt: 'uploadedAt', updatedAt: false } })
export class MessageAttachment extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true })
  messageId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  fileName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ default: null })
  fileSize: number;

  @Prop({ default: '' })
  mimeType: string;

  uploadedAt: Date;
}

export const MessageAttachmentSchema = SchemaFactory.createForClass(MessageAttachment);

MessageAttachmentSchema.index({ messageId: 1 }, { name: 'idx_msg_attach_id' });
MessageAttachmentSchema.index({ conversationId: 1, mimeType: 1 }, { name: 'idx_conv_media_gallery' });
