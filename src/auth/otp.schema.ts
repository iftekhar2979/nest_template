import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../common/schema/base.schema';

@Schema()
export class Otp extends Base {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
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
OtpSchema.index({ userID: 1 }, { unique: true, name: 'idx_otp_user_id' });
OtpSchema.index({ userID: 1, oneTimePassword: 1 }, { name: 'idx_otp_user_code' });
