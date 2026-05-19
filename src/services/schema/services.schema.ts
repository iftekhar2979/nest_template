import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base } from '../../common/schema/base.schema';
import { BillingType } from '../../common/enums/db-design.enum';

@Schema({ collection: 'services' })
export class Service extends Base {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, enum: BillingType })
  billingType: BillingType;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

Service.applyBaseHooks(ServiceSchema);

ServiceSchema.index({ billingType: 1, isActive: 1 }, { name: 'idx_services_billing_active' });
