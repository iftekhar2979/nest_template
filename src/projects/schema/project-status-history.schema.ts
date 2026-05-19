import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from 'mongoose';
import { ProjectStatus } from '../../common/enums/db-design.enum';

@Schema({ collection: 'project_status_history', timestamps: { createdAt: 'changedAt', updatedAt: false } })
export class ProjectStatusHistory extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true })
  projectId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  changedBy: mongoose.Schema.Types.ObjectId;

  @Prop({ enum: ProjectStatus, default: null })
  fromStatus: ProjectStatus;

  @Prop({ required: true, enum: ProjectStatus })
  toStatus: ProjectStatus;

  @Prop({ default: '' })
  note: string;

  changedAt: Date;
}

export const ProjectStatusHistorySchema = SchemaFactory.createForClass(ProjectStatusHistory);

ProjectStatusHistorySchema.index({ projectId: 1, changedAt: -1 }, { name: 'idx_project_status_history' });
ProjectStatusHistorySchema.index({ changedBy: 1 }, { name: 'idx_project_status_changed_by' });
