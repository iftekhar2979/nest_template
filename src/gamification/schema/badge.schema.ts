import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema()
export class Badge extends Base {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: false })
  iconUrl: string;
}

export const BadgeSchema = SchemaFactory.createForClass(Badge);

Badge.applyBaseHooks(BadgeSchema);

BadgeSchema.index({ name: 'text' });
