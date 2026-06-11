import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../auth/schema/role.schema';
import { RoleRepository } from '../auth/repositories/role.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
  ],
  providers: [RoleRepository],
  exports: [TypeOrmModule, RoleRepository],
})
export class RolesModule {}
