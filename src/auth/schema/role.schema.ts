import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RoleType } from '../../users/schema/users.schema';

@Schema({ collection: 'roles', timestamps: false })
export class Role extends Document {
  @Prop({ required: true, enum: RoleType, trim: true })
  id: RoleType;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ default: '' })
  description: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index({ id: 1 }, { unique: true, name: 'idx_roles_id' });
