import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema({ collection: 'project_attachments' })
export class ProjectAttachment extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null })
  projectId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  uploadedBy: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ default: null })
  fileSize: number;

  @Prop({ default: '' })
  mimeType: string;

  @Prop({ required: true, trim: true })
  attachmentType: string;
}

export const ProjectAttachmentSchema = SchemaFactory.createForClass(ProjectAttachment);

ProjectAttachment.applyBaseHooks(ProjectAttachmentSchema);

ProjectAttachmentSchema.index({ projectId: 1 }, { name: 'idx_attach_project_id' });
ProjectAttachmentSchema.index({ uploadedBy: 1 }, { name: 'idx_attach_uploader' });
ProjectAttachmentSchema.index({ projectId: 1, attachmentType: 1 }, { name: 'idx_attach_type_filter' });
