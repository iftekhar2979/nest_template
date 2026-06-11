import { Module } from '@nestjs/common';
import { SeederService } from './seedService';
import { UsersModule } from '../users/users.module';
import { SettingsModule } from '../settings/settings.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../auth/schema/role.schema';
import { RoleRepository } from '../auth/repositories/role.repository';

@Module({
  imports: [
    UsersModule,
    SettingsModule,
    TypeOrmModule.forFeature([Role]),
  ],
  providers: [SeederService, RoleRepository],
  exports: [SeederService],
})
export class SeedModule {
}
