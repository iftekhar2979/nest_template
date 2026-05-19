import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schema/projects.schema';
import { ProjectMember, ProjectMemberSchema } from './schema/project-members.schema';
import { ProjectStatusHistory, ProjectStatusHistorySchema } from './schema/project-status-history.schema';
import { ProjectAttachment, ProjectAttachmentSchema } from './schema/project-attachments.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectMember.name, schema: ProjectMemberSchema },
      { name: ProjectStatusHistory.name, schema: ProjectStatusHistorySchema },
      { name: ProjectAttachment.name, schema: ProjectAttachmentSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ProjectsModule {}
