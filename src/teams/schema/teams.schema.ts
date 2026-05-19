import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema({ collection: 'teams' })
export class Team extends Base {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true })
  departmentId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  leaderId: mongoose.Schema.Types.ObjectId;
}

export const TeamSchema = SchemaFactory.createForClass(Team);

Team.applyBaseHooks(TeamSchema);

TeamSchema.index({ departmentId: 1 }, { name: 'idx_teams_department_id' });
TeamSchema.index({ leaderId: 1 }, { name: 'idx_teams_leader_id' });
