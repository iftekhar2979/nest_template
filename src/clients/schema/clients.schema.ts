import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema()
export class Client extends Base {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ default: '' })
  companyName: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  stripeCustomerId: string;
}

export const ClientSchema = SchemaFactory.createForClass(Client);

Client.applyBaseHooks(ClientSchema);

ClientSchema.index({ userId: 1 }, { unique: true, name: 'idx_clients_user_id' });
