import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema()
export class RefreshToken extends Base {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, select: false })
  tokenHash: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false, index: true })
  isRevoked: boolean;

  @Prop({ default: null })
  revokedAt: Date;

  @Prop({ default: '' })
  replacedByTokenHash: string;

  @Prop({ default: '' })
  createdByIp: string;

  @Prop({ default: '' })
  userAgent: string;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

RefreshToken.applyBaseHooks(RefreshTokenSchema);

RefreshTokenSchema.index({ tokenHash: 1 }, { unique: true, name: 'idx_refresh_token_hash' });
RefreshTokenSchema.index(
  { userId: 1, isRevoked: 1, expiresAt: 1 },
  { name: 'idx_refresh_token_user_active' },
);
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'idx_refresh_token_ttl' });
