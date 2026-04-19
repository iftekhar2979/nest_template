import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema()
export class Category extends Base {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: false })
  iconUrl: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

Category.applyBaseHooks(CategorySchema);

CategorySchema.index({ name: 'text' });
