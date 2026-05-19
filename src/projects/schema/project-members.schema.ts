import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from 'mongoose';
import { ProjectMemberRole } from '../../common/enums/db-design.enum';

@Schema({ collection: 'project_members', timestamps: { createdAt: 'assignedAt', updatedAt: false } })
export class ProjectMember extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true })
  projectId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, enum: ProjectMemberRole })
  projectRole: ProjectMemberRole;

  @Prop({ default: 0 })
  allocatedRevenue: number;

  @Prop({ default: 0 })
  splitPercentage: number;

  @Prop({ default: 0 })
  costRate: number;

  assignedAt: Date;
}

export const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);

ProjectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true, name: 'idx_proj_member_unique' });
ProjectMemberSchema.index({ userId: 1, projectRole: 1 }, { name: 'idx_user_project_context' });
ProjectMemberSchema.index({ projectId: 1, allocatedRevenue: 1 }, { name: 'idx_proj_revenue_distribution' });
