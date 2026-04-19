import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../common/schema/base.schema';

@Schema()
export class Otp extends Base {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    default: null,
    unique: true,
  })
  userID: mongoose.Schema.Types.ObjectId;
  @Prop({ required: true })
  oneTimePassword: string;
  @Prop({ required: true })
  expiredAt: Date;
  @Prop({ default: 0 })
  attempts: number;
  
}
export const OtpSchema = SchemaFactory.createForClass(Otp);

// Apply production-ready query hooks
Otp.applyBaseHooks(OtpSchema);

OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3000 });
