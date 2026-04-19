import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base } from '../common/schema/base.schema';

@Schema()
export class Settings extends Base {
  @Prop({
    required: true,
    enum: ['privacy_policy', 'terms_and_condition', 'about_us'],
  })
  key: string;
  @Prop({ required: true })
  content: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

// Apply production-ready query hooks
Settings.applyBaseHooks(SettingsSchema);
