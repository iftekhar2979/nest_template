import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Otp extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null })
  userID: mongoose.Schema.Types.ObjectId;
  @Prop({ required: true })
  oneTimePassword: string;
  @Prop({ required: true })
  expiredAt: Date;
}
export const OtpSchema = SchemaFactory.createForClass(Otp);
