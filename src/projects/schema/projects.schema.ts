import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';
import { ProjectStatus } from '../../common/enums/db-design.enum';

@Schema({ collection: 'projects' })
export class Project extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true })
  clientId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true })
  subscriptionId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true })
  serviceId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ enum: ProjectStatus, default: ProjectStatus.PENDING })
  status: ProjectStatus;

  @Prop({ default: 0 })
  totalRevenue: number;

  @Prop({ default: 'USD', uppercase: true, trim: true })
  currency: string;

  @Prop({ default: '' })
  notes: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

Project.applyBaseHooks(ProjectSchema);

ProjectSchema.index({ clientId: 1, status: 1 }, { name: 'idx_proj_client_lookup' });
