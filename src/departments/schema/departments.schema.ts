import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';
import { DepartmentType } from '../../common/enums/db-design.enum';

@Schema({ collection: 'departments' })
export class Department extends Base {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: DepartmentType })
  type: DepartmentType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  leaderId: mongoose.Schema.Types.ObjectId;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

Department.applyBaseHooks(DepartmentSchema);

DepartmentSchema.index({ type: 1 }, { name: 'idx_departments_type' });
DepartmentSchema.index({ leaderId: 1 }, { name: 'idx_departments_leader_id' });
