import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from 'mongoose';
import { OfferStatus } from '../../common/enums/db-design.enum';

@Schema({ collection: 'custom_offers', timestamps: { createdAt: 'createdAt', updatedAt: false } })
export class CustomOffer extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  senderId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  receiverId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'USD', uppercase: true, trim: true })
  currency: string;

  @Prop({ enum: OfferStatus, default: OfferStatus.PENDING })
  status: OfferStatus;

  @Prop({ default: null })
  acceptedAt: Date;

  createdAt: Date;
}

export const CustomOfferSchema = SchemaFactory.createForClass(CustomOffer);

CustomOfferSchema.index({ conversationId: 1 }, { name: 'idx_custom_offer_conversation' });
CustomOfferSchema.index({ senderId: 1 }, { name: 'idx_custom_offer_sender' });
CustomOfferSchema.index({ receiverId: 1, status: 1 }, { name: 'idx_custom_offer_receiver_status' });
