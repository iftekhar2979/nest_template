import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Team, TeamSchema } from './schema/teams.schema';
import { TeamMember, TeamMemberSchema } from './schema/team-members.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Team.name, schema: TeamSchema },
      { name: TeamMember.name, schema: TeamMemberSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class TeamsModule {}
