import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';
import { PaymentSourceType, TransactionStatus } from '../../common/enums/db-design.enum';

@Schema({ collection: 'transactions' })
export class Transaction extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'USD', uppercase: true, trim: true })
  currency: string;

  @Prop({ enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Prop({ required: true, enum: PaymentSourceType })
  sourceType: PaymentSourceType;

  @Prop({ required: true })
  sourceId: string;

  @Prop({ required: true, trim: true })
  gatewayName: string;

  @Prop({ default: undefined })
  gatewaySessionId: string;

  @Prop({ default: '' })
  gatewayReceiptUrl: string;

  @Prop({ default: null })
  paidAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

Transaction.applyBaseHooks(TransactionSchema);

TransactionSchema.index({ userId: 1 }, { name: 'idx_tx_user_id' });
TransactionSchema.index(
  { gatewaySessionId: 1 },
  {
    unique: true,
    name: 'idx_tx_webhook',
    partialFilterExpression: { gatewaySessionId: { $type: 'string' } },
  },
);
TransactionSchema.index({ sourceType: 1, sourceId: 1 }, { name: 'idx_tx_source_polymorphic' });
