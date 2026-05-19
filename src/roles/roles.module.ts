import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from '../auth/schema/role.schema';
import { RoleRepository } from '../auth/repositories/role.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
  ],
  providers: [RoleRepository],
  exports: [MongooseModule, RoleRepository],
})
export class RolesModule {}
