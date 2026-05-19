import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'team_members', timestamps: { createdAt: 'joinedAt', updatedAt: false } })
export class TeamMember extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true })
  teamId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Schema.Types.ObjectId;

  @Prop({ default: '' })
  designationId: string;

  @Prop({ default: true })
  isActive: boolean;

  joinedAt: Date;
}

export const TeamMemberSchema = SchemaFactory.createForClass(TeamMember);

TeamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true, name: 'idx_team_user_unique' });
TeamMemberSchema.index({ userId: 1 }, { name: 'idx_member_user_lookup' });
TeamMemberSchema.index({ designationId: 1 }, { name: 'idx_member_designation' });
