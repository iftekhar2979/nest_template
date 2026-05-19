import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';
import { MessageChannel } from '../../common/enums/db-design.enum';

@Schema({ collection: 'conversations' })
export class Conversation extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null })
  projectId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, enum: MessageChannel })
  channel: MessageChannel;

  @Prop({ default: '' })
  lastMessageText: string;

  @Prop({ default: Date.now })
  lastMessageAt: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  lastSenderId: mongoose.Schema.Types.ObjectId;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

Conversation.applyBaseHooks(ConversationSchema);

ConversationSchema.index({ projectId: 1 }, { name: 'idx_conv_project_id' });
ConversationSchema.index({ lastMessageAt: -1 }, { name: 'idx_conv_sorting' });
